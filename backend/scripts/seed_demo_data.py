"""Carga datos demo para marketplace y companies (ejecutar tras alembic upgrade)."""
from __future__ import annotations

import sys
from pathlib import Path
from decimal import Decimal

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from sqlmodel import Session, select
from src.shared.infrastructure.database import engine

# Registrar todos los modelos en metadata (evita errores de FK en SQLModel)
import src.modules.identity.domain.entities  # noqa: F401
import src.modules.marketplace.domain.entities  # noqa: F401
import src.modules.zeep_ingestion.domain.entities  # noqa: F401

from src.modules.marketplace.domain.entities import EngineerCIP, LawyerCAL
from src.modules.zeep_ingestion.domain.entities import Company


def seed():
    with Session(engine) as session:
        if not session.exec(select(EngineerCIP).limit(1)).first():
            session.add(
                EngineerCIP(
                    numero_cip="CIP-058423",
                    nombre_completo="Ing. Carlos Ramírez Torres",
                    habilitacion_vigente=True,
                    especialidad_principal="Ingeniería Mecánica Industrial",
                    especialidades=["Manufactura pesada", "ZEEP"],
                    experiencia_zeep=True,
                    sector_preferido="manufactura",
                    idiomas=["es", "en"],
                    marketplace_visible=True,
                    validado_plataforma=True,
                    rating_promedio=Decimal("4.8"),
                    descripcion_publica="Experiencia en líneas de manufactura y zonas francas.",
                )
            )
        # Abogados: insertar vía SQL por compatibilidad enum[] sector_type
        from sqlalchemy import text
        exists_cal = session.exec(
            text("SELECT 1 FROM lawyers_cal WHERE numero_cal = 'CAL-12847' LIMIT 1")
        ).first()
        if not exists_cal:
            session.exec(
                text("""
                    INSERT INTO lawyers_cal (
                        numero_cal, nombre_completo, habilitacion_vigente,
                        especializacion_principal, certificacion_zeep, idiomas,
                        marketplace_visible, validado_plataforma, rating_promedio
                    ) VALUES (
                        'CAL-12847', 'Dra. Ana Huapaya Flores', true,
                        'Ley ZEEP N° 32449', true, ARRAY['es','en','zh'],
                        true, true, 4.9
                    )
                """)
            )
        if not session.get(Company, "20512345678"):
            session.add(
                Company(
                    ruc="20512345678",
                    razon_social="Transportes Lima Norte SAC",
                    estado_sunarp="ACTIVA",
                    condicion_contribuyente="HABIDO",
                    estado_contribuyente="ACTIVO",
                    sector_interno="logistica",
                    trust_score=Decimal("0.88"),
                    capacidad_operativa="alta",
                    distancia_puerto_chancay_km=Decimal("28.5"),
                    marketplace_visible=True,
                    descripcion_publica="Logística portuaria ZEEP Chancay",
                    servicios_principales=["Almacenaje", "Transporte"],
                )
            )
        session.commit()
    print("Seed demo completado.")


if __name__ == "__main__":
    seed()
