from __future__ import annotations
import uuid
from typing import Optional
from datetime import datetime, date
from decimal import Decimal
from sqlmodel import SQLModel, Field
from sqlalchemy import Column, Text, Numeric, SmallInteger, Integer
from sqlalchemy.dialects.postgresql import JSONB


class InvestorProfile(SQLModel, table=True):
    __tablename__ = "investor_profiles"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    session_id: uuid.UUID = Field(foreign_key="simulation_records.session_id")
    user_id: uuid.UUID = Field(foreign_key="users.id")
    estado: str = Field(default="en_progreso", max_length=20)           # ProfileEstado enum

    # Empresa de origen
    empresa_razon_social: str = Field(max_length=500)
    empresa_pais_origen: str = Field(max_length=2)
    empresa_registro_extranjero: Optional[str] = Field(default=None, max_length=100)
    empresa_sector_ciiu: Optional[str] = Field(default=None, max_length=10)
    empresa_capital_usd: Optional[Decimal] = Field(default=None, sa_column=Column(Numeric(18, 2), nullable=True))

    # Representante legal
    rep_nombre: Optional[str] = Field(default=None, max_length=300)
    rep_documento_tipo: Optional[str] = Field(default=None, max_length=20)
    rep_documento_num: Optional[str] = Field(default=None, max_length=50)
    rep_cargo: Optional[str] = Field(default=None, max_length=100)

    # Proyecto de inversión
    proyecto_nombre: str = Field(max_length=500)
    proyecto_descripcion: Optional[str] = Field(default=None, sa_column=Column(Text, nullable=True))
    proyecto_monto_usd: Decimal = Field(sa_column=Column(Numeric(18, 2), nullable=False))
    proyecto_empleo_directo: int = Field(default=0)
    proyecto_empleo_indirecto: int = Field(default=0)
    proyecto_porcentaje_cl: Decimal = Field(default=Decimal("0"), sa_column=Column(Numeric(5, 2), nullable=False))
    proyecto_fecha_inicio: Optional[date] = Field(default=None)
    proyecto_duracion_meses: Optional[int] = Field(default=None)
    proyecto_exportacion_pct: Optional[Decimal] = Field(default=None, sa_column=Column(Numeric(5, 2), nullable=True))
    proyecto_documento_pdf_url: Optional[str] = Field(
        default=None, sa_column=Column(Text, nullable=True)
    )

    # Perfil técnico (discriminated union serializado como JSONB)
    sector: str = Field(max_length=15)                                   # SectorType enum
    perfil_tecnico: dict = Field(default_factory=dict, sa_column=Column(JSONB, nullable=False, server_default="{}"))

    # Roadmap de instalación personalizado
    roadmap: list = Field(default_factory=list, sa_column=Column(JSONB, nullable=False, server_default="[]"))

    # Metadatos de control
    completion_pct: int = Field(default=0, sa_column=Column(SmallInteger, nullable=False, server_default="0"))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class DocumentoAdjunto(SQLModel, table=True):
    __tablename__ = "documentos_adjuntos"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    investor_profile_id: uuid.UUID = Field(foreign_key="investor_profiles.id")
    tipo: str = Field(max_length=30)                                      # TipoDocumento enum
    nombre_archivo: str = Field(max_length=500)
    url_storage: str = Field(sa_column=Column(Text, nullable=False))
    size_bytes: Optional[int] = Field(default=None, sa_column=Column(Integer, nullable=True))
    mime_type: Optional[str] = Field(default=None, max_length=100)
    hash_sha256: Optional[str] = Field(default=None, max_length=64)
    subido_por: uuid.UUID = Field(foreign_key="users.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
