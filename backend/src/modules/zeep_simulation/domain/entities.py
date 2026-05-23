from __future__ import annotations
import uuid
from typing import Optional
from datetime import datetime
from decimal import Decimal
from sqlmodel import SQLModel, Field
from sqlalchemy import Column, Numeric, Integer, Boolean, Text
from sqlalchemy.dialects.postgresql import JSONB, INET


class SimulationRecord(SQLModel, table=True):
    __tablename__ = "simulation_records"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    session_id: uuid.UUID = Field(unique=True)
    user_id: Optional[uuid.UUID] = Field(default=None, foreign_key="users.id")

    # Sector y clasificación
    sector: str = Field(max_length=15)                          # SectorType enum
    clasificacion: str = Field(max_length=25)                   # ClasificacionElegibilidad enum

    # Variables de entrada (base)
    monto_inversion_usd: Decimal = Field(sa_column=Column(Numeric(18, 2), nullable=False))
    empleo_directo: int = Field(sa_column=Column(Integer, nullable=False))
    empleo_indirecto: int = Field(default=0)
    porcentaje_cl: Decimal = Field(sa_column=Column(Numeric(5, 2), nullable=False))
    tiempo_instalacion_meses: int = Field(sa_column=Column(Integer, nullable=False))
    pais_origen: str = Field(max_length=2)                      # ISO 3166-1 alpha-2
    exportacion_pct: Decimal = Field(default=Decimal("0"), sa_column=Column(Numeric(5, 2), nullable=False))

    # Variables sectoriales (estructura varía por sector — Manufactura | CKD | Tech)
    variables_sector: dict = Field(default_factory=dict, sa_column=Column(JSONB, nullable=False, server_default="{}"))

    # Resultados del scoring
    v_base: Decimal = Field(sa_column=Column(Numeric(6, 4), nullable=False))
    delta_cl: Decimal = Field(default=Decimal("0"), sa_column=Column(Numeric(6, 4), nullable=False))
    delta_sector: Decimal = Field(default=Decimal("0"), sa_column=Column(Numeric(6, 4), nullable=False))
    v_final: Decimal = Field(sa_column=Column(Numeric(5, 2), nullable=False))   # [0, 100]
    beneficio_cl_activo: bool = Field(default=False)

    # Proyección fiscal: {ir_estandar_pct, ir_zeep_pct, ahorro_5_anos_usd, igv_exonerado, arancel_0}
    proyeccion_fiscal: dict = Field(default_factory=dict, sa_column=Column(JSONB, nullable=False, server_default="{}"))

    # Alertas y recomendaciones
    alertas: list = Field(default_factory=list, sa_column=Column(JSONB, nullable=False, server_default="[]"))
    recomendaciones_agente: list = Field(default_factory=list, sa_column=Column(JSONB, nullable=False, server_default="[]"))

    # Control
    ip_address: Optional[str] = Field(default=None, sa_column=Column(INET, nullable=True))
    created_at: datetime = Field(default_factory=datetime.utcnow)


class WeightConfig(SQLModel, table=True):
    __tablename__ = "weight_configs"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    sector: str = Field(max_length=15)                          # SectorType enum
    config_name: str = Field(max_length=100)                    # base | delta_cl | delta_sector
    weights: dict = Field(sa_column=Column(JSONB, nullable=False))
    descripcion: Optional[str] = Field(default=None, sa_column=Column(Text, nullable=True))
    activo: bool = Field(default=True)
    creado_por: Optional[uuid.UUID] = Field(default=None, foreign_key="users.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)


class RagPromptConfig(SQLModel, table=True):
    __tablename__ = "rag_prompt_configs"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    agente: str = Field(max_length=20)                          # AgenteActivadoType enum
    nombre: str = Field(max_length=200)
    system_prompt: str = Field(sa_column=Column(Text, nullable=False))
    temperatura: Decimal = Field(default=Decimal("0.10"), sa_column=Column(Numeric(3, 2), nullable=False))
    max_tokens: int = Field(default=1500)
    activo: bool = Field(default=True)
    version: int = Field(default=1)
    creado_por: Optional[uuid.UUID] = Field(default=None, foreign_key="users.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
