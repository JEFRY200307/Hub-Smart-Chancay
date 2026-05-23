from __future__ import annotations
from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from decimal import Decimal
import uuid


class OnboardingCreateDTO(BaseModel):
    session_id: uuid.UUID
    sector: str = Field(..., description="manufactura | ckd | tech")
    proyecto_nombre: str = Field(..., max_length=500)
    proyecto_descripcion: Optional[str] = None
    proyecto_monto_usd: Optional[Decimal] = None
    proyecto_area_terreno_m2: Optional[Decimal] = None
    proyecto_teus_estimados: Optional[int] = None
    proyecto_empleo_directo: int = 0
    proyecto_empleo_indirecto: int = 0
    proyecto_porcentaje_cl: Decimal = Decimal("0")
    proyecto_exportacion_pct: Optional[Decimal] = None
    documento_perfil_url: Optional[str] = None


class OnboardingUpdateDTO(BaseModel):
    empresa_capital_usd: Optional[Decimal] = None
    rep_nombre: Optional[str] = None
    rep_documento_tipo: Optional[str] = None
    rep_documento_num: Optional[str] = None
    rep_cargo: Optional[str] = None
    proyecto_empleo_directo: Optional[int] = None
    proyecto_empleo_indirecto: Optional[int] = None
    proyecto_porcentaje_cl: Optional[Decimal] = None
    proyecto_duracion_meses: Optional[int] = None
    perfil_tecnico: Optional[dict] = None
    completion_pct: Optional[int] = None


class InvestorProfileDTO(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID
    user_id: uuid.UUID
    estado: str
    completion_pct: int
    empresa_razon_social: str
    proyecto_nombre: str
    proyecto_monto_usd: Decimal
    sector: str
    proyecto_documento_pdf_url: Optional[str] = None
    created_at: str

    model_config = ConfigDict(from_attributes=True)
