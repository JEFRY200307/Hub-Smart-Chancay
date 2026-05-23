from __future__ import annotations
import uuid
from typing import Optional
from datetime import datetime
from decimal import Decimal
from sqlmodel import SQLModel, Field
from sqlalchemy import Column, Text, Numeric, Integer
from sqlalchemy.dialects.postgresql import JSONB


class ChatSession(SQLModel, table=True):
    __tablename__ = "chat_sessions"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id")
    investor_profile_id: Optional[uuid.UUID] = Field(default=None, foreign_key="investor_profiles.id")
    idioma: str = Field(default="es", max_length=5)
    titulo: Optional[str] = Field(default=None, max_length=300)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ChatMessage(SQLModel, table=True):
    __tablename__ = "chat_messages"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    session_id: uuid.UUID = Field(foreign_key="chat_sessions.id")
    role: str = Field(max_length=15)                                    # MessageRole enum: user | assistant | system
    content: str = Field(sa_column=Column(Text, nullable=False))

    # Solo para mensajes del asistente
    agente_activado: Optional[str] = Field(default=None, max_length=20) # AgenteActivadoType enum
    confidence_score: Optional[Decimal] = Field(default=None, sa_column=Column(Numeric(4, 3), nullable=True))
    requiere_visado_humano: bool = Field(default=False)
    tokens_prompt: Optional[int] = Field(default=None)
    tokens_completion: Optional[int] = Field(default=None)
    latencia_ms: Optional[int] = Field(default=None)
    llm_provider: Optional[str] = Field(default=None, max_length=50)   # groq | gemini | claude

    # Fuentes normativas citadas
    sources: list = Field(default_factory=list, sa_column=Column(JSONB, nullable=False, server_default="[]"))

    created_at: datetime = Field(default_factory=datetime.utcnow)


class VisadoHumanoTicket(SQLModel, table=True):
    __tablename__ = "visado_humano_tickets"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    chat_message_id: uuid.UUID = Field(foreign_key="chat_messages.id")
    session_id: uuid.UUID = Field(foreign_key="chat_sessions.id")
    query_original: str = Field(sa_column=Column(Text, nullable=False))
    confidence_score: Decimal = Field(sa_column=Column(Numeric(4, 3), nullable=False))
    asignado_a: Optional[uuid.UUID] = Field(default=None, foreign_key="users.id")
    resuelto_at: Optional[datetime] = Field(default=None)
    respuesta_experto: Optional[str] = Field(default=None, sa_column=Column(Text, nullable=True))
    created_at: datetime = Field(default_factory=datetime.utcnow)
