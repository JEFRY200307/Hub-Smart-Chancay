from __future__ import annotations
from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
import uuid


class ChatStartDTO(BaseModel):
    idioma: str = "es"
    titulo: Optional[str] = None
    investor_profile_id: Optional[uuid.UUID] = None


class ChatMessageSendDTO(BaseModel):
    content: str = Field(..., min_length=1, max_length=8000)


class ChatSessionDTO(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    idioma: str
    titulo: Optional[str]
    created_at: str

    model_config = ConfigDict(from_attributes=True)


class ChatMessageDTO(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID
    role: str
    content: str
    agente_activado: Optional[str] = None
    confidence_score: Optional[float] = None
    requiere_visado_humano: bool = False
    sources: list = []
    llm_provider: Optional[str] = None
    created_at: str

    model_config = ConfigDict(from_attributes=True)


class AIQueryDTO(BaseModel):
    query: str
    investor_profile_id: Optional[uuid.UUID] = None
    lang: str = "es"
    session_id: Optional[str] = None


class AIQueryResponseDTO(BaseModel):
    session_id: str
    message_id: str
    respuesta: str
    confidence_score: float
    requiere_visado_humano: bool = False
    agentes_activados: list[str] = []
    sources: list = []
    advertencias: list = []
    ticket_visado_id: Optional[str] = None
    created_at: str


class EscalateDTO(BaseModel):
    message_id: uuid.UUID
    motivo: str


class EscalateResponseDTO(BaseModel):
    ticket_id: str
    estado: str = "pendiente"
    tiempo_estimado_respuesta_horas: int = 24
    created_at: str


class VisadoTicketDTO(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID
    chat_message_id: uuid.UUID
    query_original: str
    confidence_score: float
    created_at: str

    model_config = ConfigDict(from_attributes=True)
