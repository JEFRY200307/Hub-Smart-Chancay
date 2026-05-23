from __future__ import annotations
import uuid
from typing import Optional, Any
from datetime import datetime
from pydantic import BaseModel, Field


class LedgerEventCreateDTO(BaseModel):
    investor_profile_id: uuid.UUID
    event_type: str                                     # LedgerEventType enum
    payload: dict[str, Any] = {}
    actor_id: uuid.UUID
    actor_type: str                                     # ActorType enum


class LedgerEventResponseDTO(BaseModel):
    id: uuid.UUID
    investor_profile_id: uuid.UUID
    sequence_number: int
    event_type: str
    payload: dict
    actor_id: uuid.UUID
    actor_type: str
    previous_hash: str
    hash: str
    created_at: datetime


class LedgerIntegrityResultDTO(BaseModel):
    profile_id: uuid.UUID
    total_events: int
    is_valid: bool
    first_broken_sequence: Optional[int] = None
    error_detail: Optional[str] = None


class MinutaRegistrarDTO(BaseModel):
    investor_profile_id: uuid.UUID
    reunion_id: uuid.UUID
    participantes: list[dict] = Field(default_factory=list)
    acuerdos: list[str] = Field(default_factory=list)
    proximos_pasos: list[dict] = Field(default_factory=list)
    validada_por: uuid.UUID
    actor_id: uuid.UUID


class LedgerStatsDTO(BaseModel):
    profile_id: uuid.UUID
    total_events: int
    events_by_type: dict[str, int]
    last_event_at: Optional[datetime]
    fase_actual: Optional[str]
    has_dossier: bool
