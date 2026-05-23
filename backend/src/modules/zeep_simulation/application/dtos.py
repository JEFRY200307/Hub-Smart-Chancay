from __future__ import annotations
import uuid
from typing import Optional, Any
from decimal import Decimal
from pydantic import BaseModel, Field, field_validator


class VariablesSectorManufacturaDTO(BaseModel):
    tipo_proceso: str                                   # batch | continuo | discreto
    requiere_anexo_4: bool = False
    va_estimado_pct: float = Field(ge=0, le=100)
    tipo_impacto_ambiental: str = "medio"               # alto | medio | bajo


class VariablesSectorCKDDTO(BaseModel):
    producto_ensamblado: str
    ratio_ckd_importado: float = Field(ge=0, le=100)
    mercado_destino: str = "regional"                   # exportacion | regional | interno
    certificaciones: list[str] = []


class VariablesSectorTechDTO(BaseModel):
    tipo_servicio: str                                  # software | ia | cloud | idi | logistica
    pct_servicios_exportables: float = Field(ge=0, le=100)
    requiere_datacenter: bool = False
    ratio_empleos_tech: float = Field(ge=0, le=1)


class SimulationRequestDTO(BaseModel):
    session_id: uuid.UUID
    sector: str                                         # manufactura | ckd | tech
    monto_inversion_usd: Decimal = Field(gt=0)
    empleo_directo: int = Field(ge=0)
    empleo_indirecto: int = 0
    porcentaje_cl: Decimal = Field(ge=0, le=100)
    tiempo_instalacion_meses: int = Field(gt=0)
    pais_origen: str = Field(min_length=2, max_length=2)
    exportacion_pct: Decimal = Field(default=Decimal("0"), ge=0, le=100)
    variables_sector: dict[str, Any]

    @field_validator("sector")
    @classmethod
    def sector_valido(cls, v: str) -> str:
        valid = {"manufactura", "ckd", "tech"}
        if v not in valid:
            raise ValueError(f"sector debe ser uno de: {valid}")
        return v


class ProyeccionFiscalDTO(BaseModel):
    ir_estandar_pct: float
    ir_zeep_pct: float
    ahorro_5_anos_usd: float
    igv_exonerado: bool
    arancel_0: bool


class AlertaDTO(BaseModel):
    tipo: str
    descripcion: str
    impacto_score: float


class SimulationResponseDTO(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID
    sector: str
    clasificacion: str
    v_base: float
    delta_cl: float
    delta_sector: float
    v_final: float
    beneficio_cl_activo: bool
    proyeccion_fiscal: ProyeccionFiscalDTO
    alertas: list[AlertaDTO]
    recomendaciones_agente: list[str]
    created_at: str


class SimulationStatusDTO(BaseModel):
    session_id: uuid.UUID
    clasificacion: str
    v_final: float
    sector: str
