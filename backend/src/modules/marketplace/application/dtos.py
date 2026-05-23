from __future__ import annotations

import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field

class ZEEPOpportunityDTO(BaseModel):
    id: str
    title: str
    category: str
    match_score: Optional[int] = None
    description: str
    tags: List[str]
    company_name: str
    posted_ago: str
    
    model_config = ConfigDict(from_attributes=True)

class OperatorDTO(BaseModel):
    id: str
    name: str
    tier: str
    description: str
    services: List[str]
    rating: float
    verified: bool


class MatchRequestDTO(BaseModel):
    investor_profile_id: uuid.UUID
    categorias: Optional[List[str]] = None


class MatchCandidatoDTO(BaseModel):
    candidato_id: uuid.UUID
    nombre: str
    numero_cip: Optional[str] = None
    numero_cal: Optional[str] = None
    score_compatibilidad: float
    especialidad_principal: Optional[str] = None
    disponibilidad: str = "disponible"
    idiomas: List[str] = []
    validacion_institucional: str = "vigente"
    justificacion: Optional[str] = None


class MatchCategoriaResultDTO(BaseModel):
    categoria: str
    score_promedio: float
    justificacion_agente: str
    candidatos: List[MatchCandidatoDTO]


class MatchResponseDTO(BaseModel):
    match_id: uuid.UUID
    investor_profile_id: uuid.UUID
    resultados: List[MatchCategoriaResultDTO]
    created_at: str


class ReunionRequestDTO(BaseModel):
    candidato_id: uuid.UUID
    categoria: str
    modalidad: str = "virtual"
    fecha_preferida: datetime
    agenda: Optional[str] = None


class ReunionResponseDTO(BaseModel):
    reunion_id: uuid.UUID
    estado: str
    candidato_id: uuid.UUID
    modalidad: str
    fecha_propuesta: str
    ledger_event_id: Optional[uuid.UUID] = None
    mensaje: str


class EngineerDirectoryItemDTO(BaseModel):
    id: uuid.UUID
    nombre: str
    numero_cip: str
    especialidades: List[str]
    disponibilidad: str
    idiomas: List[str]
    habilitacion_vigente: bool
    rating_promedio: Optional[float] = None
    foto_url: Optional[str] = None
    especialidad_principal: Optional[str] = None
    descripcion_publica: Optional[str] = None


class LawyerDirectoryItemDTO(BaseModel):
    id: uuid.UUID
    nombre: str
    numero_cal: str
    especializaciones: List[str]
    certificacion_zeep: bool
    idiomas: List[str]
    habilitacion_vigente: bool
    rating_promedio: Optional[float] = None
    especializacion_principal: Optional[str] = None
    descripcion_publica: Optional[str] = None


class ProviderDirectoryItemDTO(BaseModel):
    ruc: str
    razon_social: str
    sector_interno: Optional[str] = None
    estado_sunarp: str
    condicion_contribuyente: Optional[str] = None
    trust_score: Optional[float] = None
    capacidad_operativa: Optional[str] = None
    distancia_puerto_chancay_km: Optional[float] = None
    tiene_cargas: bool = False
    marketplace_visible: bool = True
    descripcion_publica: Optional[str] = None


class EnrichmentMetaDTO(BaseModel):
    completeness_score: float
    fuentes: List[str] = []
    ultima_actualizacion: Optional[str] = None


class EngineerDetailDTO(EngineerDirectoryItemDTO):
    region: Optional[str] = None
    ciudad: Optional[str] = None
    experiencia_zeep: bool = False
    anos_experiencia: Optional[int] = None
    certificaciones: List[str] = []
    enrichment: Optional[EnrichmentMetaDTO] = None


class LawyerDetailDTO(LawyerDirectoryItemDTO):
    region: Optional[str] = None
    ciudad: Optional[str] = None
    anos_experiencia: Optional[int] = None
    enrichment: Optional[EnrichmentMetaDTO] = None


class ProviderDetailDTO(ProviderDirectoryItemDTO):
    ciiu_principal: Optional[str] = None
    servicios_principales: List[str] = []
    web_enrichment_data: Optional[dict] = None
    directorio: Optional[list] = None
    enrichment: Optional[EnrichmentMetaDTO] = None
