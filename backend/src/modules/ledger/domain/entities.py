from __future__ import annotations
import uuid
from typing import Optional
from datetime import datetime
from decimal import Decimal
from sqlmodel import SQLModel, Field
from sqlalchemy import Column, Text, Numeric, Integer, SmallInteger, BigInteger, text
from sqlalchemy.dialects.postgresql import JSONB


class LedgerEvent(SQLModel, table=True):
    __tablename__ = "ledger_events"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    investor_profile_id: uuid.UUID = Field(foreign_key="investor_profiles.id")

    sequence_number: int = Field(
        sa_column=Column(
            BigInteger,
            nullable=False,
            server_default=text("nextval('ledger_global_seq')"),
        ),
    )

    event_type: str = Field(max_length=50)                              # LedgerEventType enum
    payload: dict = Field(default_factory=dict, sa_column=Column(JSONB, nullable=False, server_default="{}"))

    actor_id: uuid.UUID
    actor_type: str = Field(max_length=20)                              # ActorType enum

    # Cadena de integridad SHA-256
    previous_hash: str = Field(max_length=64)                           # "GENESIS" para el primero
    hash: str = Field(max_length=64, unique=True)

    created_at: datetime = Field(default_factory=datetime.utcnow)


class DossierInversion(SQLModel, table=True):
    __tablename__ = "dossiers_inversion"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    investor_profile_id: uuid.UUID = Field(foreign_key="investor_profiles.id")
    version: int = Field(default=1, sa_column=Column(SmallInteger, nullable=False, server_default="1"))

    # Contenido estructurado
    resumen_ejecutivo: Optional[str] = Field(default=None, sa_column=Column(Text, nullable=True))
    secciones: dict = Field(default_factory=dict, sa_column=Column(JSONB, nullable=False, server_default="{}"))

    # Integridad
    hash_integridad: str = Field(max_length=64)
    url_pdf: str = Field(sa_column=Column(Text, nullable=False))
    size_bytes: Optional[int] = Field(default=None)

    # Aprobación
    aprobado_por: Optional[uuid.UUID] = Field(default=None, foreign_key="users.id")
    aprobado_at: Optional[datetime] = Field(default=None)

    created_at: datetime = Field(default_factory=datetime.utcnow)
