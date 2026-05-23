from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlmodel import SQLModel, Field
from sqlalchemy import Column, Text, Numeric, Boolean, Integer


class InvestmentProject(SQLModel, table=True):
    __tablename__ = "investment_projects"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id")
    investor_profile_id: Optional[uuid.UUID] = Field(
        default=None, foreign_key="investor_profiles.id"
    )
    session_id: Optional[uuid.UUID] = Field(
        default=None, foreign_key="simulation_records.session_id"
    )
    codigo: str = Field(max_length=50)
    nombre: str = Field(max_length=500)
    descripcion: Optional[str] = Field(default=None, sa_column=Column(Text, nullable=True))
    sector: str = Field(max_length=15)
    estado: str = Field(default="borrador", max_length=20)
    monto_usd: Decimal = Field(
        default=Decimal("0"), sa_column=Column(Numeric(18, 2), nullable=False)
    )
    empleo_directo: int = Field(default=0)
    empleo_indirecto: int = Field(default=0)
    porcentaje_cl: Decimal = Field(
        default=Decimal("0"), sa_column=Column(Numeric(5, 2), nullable=False)
    )
    exportacion_pct: Optional[Decimal] = Field(
        default=None, sa_column=Column(Numeric(5, 2), nullable=True)
    )
    pais_origen_capital: str = Field(default="PE", max_length=2)
    empresa_razon_social: str = Field(max_length=500)
    area_terreno_m2: Optional[Decimal] = Field(
        default=None, sa_column=Column(Numeric(14, 2), nullable=True)
    )
    teus_estimados: Optional[int] = Field(default=None, sa_column=Column(Integer, nullable=True))
    documento_perfil_url: Optional[str] = Field(
        default=None, sa_column=Column(Text, nullable=True)
    )
    is_active: bool = Field(
        default=False, sa_column=Column(Boolean, nullable=False, server_default="false")
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
