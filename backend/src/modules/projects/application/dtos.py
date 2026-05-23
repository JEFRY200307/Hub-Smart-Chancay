from __future__ import annotations

import uuid
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


class ProjectCreateDTO(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=500)
    sector: str
    monto_usd: Decimal = Field(..., gt=0)
    empleo_directo: int = Field(default=0, ge=0)
    empleo_indirecto: int = Field(default=0, ge=0)
    porcentaje_cl: Decimal = Field(default=Decimal("0"), ge=0, le=100)
    exportacion_pct: Optional[Decimal] = Field(default=None, ge=0, le=100)
    pais_origen_capital: str = Field(default="PE", min_length=2, max_length=2)
    empresa_razon_social: str = Field(..., min_length=2, max_length=500)
    descripcion: Optional[str] = None


class ProjectUpdateDTO(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    monto_usd: Optional[Decimal] = None
    empleo_directo: Optional[int] = None
    empleo_indirecto: Optional[int] = None
    porcentaje_cl: Optional[Decimal] = None
    exportacion_pct: Optional[Decimal] = None
    estado: Optional[str] = None


class ProjectResponseDTO(BaseModel):
    id: uuid.UUID
    codigo: str
    nombre: str
    sector: str
    estado: str
    monto_usd: Decimal
    empleo_directo: int
    empleo_indirecto: int
    porcentaje_cl: Decimal
    exportacion_pct: Optional[Decimal]
    pais_origen_capital: str
    empresa_razon_social: str
    is_active: bool
    investor_profile_id: Optional[uuid.UUID]
    session_id: Optional[uuid.UUID]
    completion_pct: int = 0

    model_config = {"from_attributes": True}
