from __future__ import annotations
from typing import Optional
from datetime import date
from sqlmodel import SQLModel, Field


class PadronRucRecord(SQLModel, table=True):
    """Tabla de staging truncate-mensual para el ETL del Padrón RUC SUNAT (spec07)."""
    __tablename__ = "padron_ruc_staging"

    ruc: str = Field(primary_key=True, max_length=11)
    razon_social: str = Field(max_length=500)
    estado_contribuyente: str = Field(max_length=30)        # ACTIVO | SUSPENDIDO | BAJA
    condicion_contribuyente: str = Field(max_length=20)     # HABIDO | NO HABIDO
    tipo_contribuyente: Optional[str] = Field(default=None, max_length=50)
    ciiu_principal: Optional[str] = Field(default=None, max_length=10)
    ciiu_secundario: Optional[str] = Field(default=None, max_length=10)
    ubigeo: Optional[str] = Field(default=None, max_length=6)
    departamento: Optional[str] = Field(default=None, max_length=100)
    provincia: Optional[str] = Field(default=None, max_length=100)
    distrito: Optional[str] = Field(default=None, max_length=100)
    direccion: Optional[str] = Field(default=None)
    fecha_inscripcion: Optional[date] = Field(default=None)
    fecha_inicio_actividades: Optional[date] = Field(default=None)
    fecha_baja: Optional[date] = Field(default=None)
    descarga_fecha: date = Field()                          # Fecha del archivo bulk de origen
