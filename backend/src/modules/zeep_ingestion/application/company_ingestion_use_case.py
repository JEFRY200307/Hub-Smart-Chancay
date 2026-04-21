import os
import pandas as pd
from sqlmodel import Session, select
from typing import Optional
import uuid

from src.shared.infrastructure.database import engine
from src.modules.zeep_ingestion.domain.entities import Company
from src.modules.zeep_ingestion.infrastructure.sunat_scraper import SunatScraper

class CompanyIngestionUseCase:
    """Caso de uso orquestador para ingerir empresas de ZEEP desde los padrones de SUNAT"""
    
    def __init__(self):
        self.scraper = SunatScraper()
        # Puedes variar esto si cambian las especificaciones de SUNAT
        self.ubigeo_chancay = "150605"
        
    def execute(self, padron_general_id: str = "51"):
        """
        Paso 1: Descarga y extrae Padron General
        Paso 2: Descarga y extrae Padron Reducido
        Paso 3: Procesa en pandas y cruza datos.
        Paso 4: Guarda en BD.
        """
        # 1. Padrón General
        general_zip_url = self.scraper.find_latest_padron_general_url(padron_general_id)
        general_zip_path = self.scraper.download_file(general_zip_url, "padron_general.zip")
        general_csv_path = self.scraper.extract_zip(general_zip_path)
        
        # 2. Padrón Reducido
        reducido_url = "http://www2.sunat.gob.pe/padron_reducido_ruc.zip"
        reducido_zip_path = self.scraper.download_file(reducido_url, "padron_reducido.zip")
        reducido_csv_path = self.scraper.extract_zip(reducido_zip_path)
        
        # 3. Procesamiento - Cargamos el Reducido filtrando directamente Chancay
        print("Procesando Padrón Reducido en Chunks...")
        df_reducido_list = []
        # El padrón reducido suele estar separado por '|' y con encoding iso-8859-1
        cols_reducido = ["RUC", "NOMBRE_RAZON_SOCIAL", "ESTADO", "CONDICION", "UBIGEO"]
        
        for chunk in pd.read_csv(reducido_csv_path, sep='|', encoding='latin1', chunksize=100000, 
                                 usecols=[0, 1, 2, 3, 4], names=cols_reducido, header=0, dtype=str):
            
            # Empresas activas en Chancay y que sean personas jurídicas (RUC empieza con 20)
            filtered = chunk[
                (chunk['UBIGEO'] == self.ubigeo_chancay) & 
                (chunk['ESTADO'].str.contains("ACTIVO", case=False, na=False)) &
                (chunk['RUC'].str.startswith("20", na=False))
            ]
            df_reducido_list.append(filtered)
            
        df_reducido = pd.concat(df_reducido_list, ignore_index=True)
        print(f"Empresas activas en Chancay en Padrón Reducido: {len(df_reducido)}")
        
        # 4. Procesamiento - Cargamos Padrón General para sacar los CIIU
        print("Procesando Padrón General en Chunks...")
        df_general_list = []
        # General usa ','
        cols_general = ["RUC", "Estado", "Condicion", "Actividad_Economica_CIIU_revision4_Principal", "UBIGEO"]
        # Evitar usar indices directamente si podemos usar usecols=[0,1,2,6,11] dependiendo el index exacto
        # Basado en el prompt asumo índices, si es un CSV real con Headers usamos los nombres
        try:
            for chunk in pd.read_csv(general_csv_path, sep=',', encoding='latin1', chunksize=100000, dtype=str):
                
                # Filtrar Chancay, Activos, RUC 20 para reducir data
                if 'UBIGEO' in chunk.columns:
                    filtered = chunk[
                        (chunk['UBIGEO'] == self.ubigeo_chancay) &
                        (chunk['RUC'].str.startswith("20", na=False))
                    ]
                    df_general_list.append(filtered)
        except Exception as e:
            print(f"Error procesando General: {e}")
            
        df_general = pd.concat(df_general_list, ignore_index=True) if df_general_list else pd.DataFrame(columns=cols_general)
        
        # 5. Cruce de Datos (Merge)
        # Prevalece el reducido, cruzamos por RUC para traernos el CIIU (Actividad_Economica_CIIU_revision4_Principal)
        # Limpiar columnas duplicadas
        if not df_general.empty and 'Actividad_Economica_CIIU_revision4_Principal' in df_general.columns:
            df_merged = pd.merge(df_reducido, df_general[['RUC', 'Actividad_Economica_CIIU_revision4_Principal']], on='RUC', how='left')
        else:
            df_merged = df_reducido.copy()
            df_merged['Actividad_Economica_CIIU_revision4_Principal'] = ""
            
        # 6. Mapeo Sector Macro
        df_merged['Sector_Macro'] = df_merged['Actividad_Economica_CIIU_revision4_Principal'].apply(self._map_ciiu_to_sector)
        
        # 7. Guardar a Base de Datos
        self._save_to_db(df_merged)
        
    def _map_ciiu_to_sector(self, ciiu: Optional[str]) -> str:
        if pd.isna(ciiu) or not str(ciiu).strip():
            return "Otros"
            
        c = str(ciiu).strip()
        
        # Logística: 4923, 5210
        if c in ["4923", "5210"]:
            return "Logística"
            
        # Tecnología: 6201, 6202
        if c in ["6201", "6202"]:
            return "Tecnología"
            
        # Minería: 0722, 0990
        if c in ["0722", "0990"]:
            return "Minería"
            
        # Agroindustria: 014*, 016*
        if c.startswith("014") or c.startswith("016"):
            return "Agroindustria"
            
        # Manufactura: 10* a 33*
        try:
            prefijo = int(c[:2])
            if 10 <= prefijo <= 33:
                return "Manufactura"
        except ValueError:
            pass
            
        return "Otros"
        
    def _save_to_db(self, df: pd.DataFrame):
        print(f"Guardando {len(df)} empresas a la BD...")
        with Session(engine) as session:
            for _, row in df.iterrows():
                # Busca si ya existe
                ruc = row['RUC']
                company = session.exec(select(Company).where(Company.ruc == ruc)).first()
                
                if not company:
                    company = Company(
                        ruc=ruc,
                        razon_social=row['NOMBRE_RAZON_SOCIAL'],
                        estado_contribuyente=row['ESTADO'],
                        condicion_domicilio=row['CONDICION'],
                        ubigeo=row['UBIGEO'],
                        sector_macro=row['Sector_Macro']
                    )
                    session.add(company)
                else:
                    # Update fields
                    company.razon_social = row['NOMBRE_RAZON_SOCIAL']
                    company.estado_contribuyente = row['ESTADO']
                    company.condicion_domicilio = row['CONDICION']
                    company.sector_macro = row['Sector_Macro']
                    session.add(company)
                    
            session.commit()
            print("Carga de BD Padrón completada.")
