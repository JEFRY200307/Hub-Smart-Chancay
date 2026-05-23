from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlmodel import SQLModel, Field
from sqlalchemy import Column, Text, Boolean


class UserProfile(SQLModel, table=True):
    __tablename__ = "user_profiles"

    user_id: uuid.UUID = Field(foreign_key="users.id", primary_key=True)
    profile_type: str = Field(max_length=30)
    numero_cip: Optional[str] = Field(default=None, max_length=20)
    numero_cal: Optional[str] = Field(default=None, max_length=20)
    razon_social: Optional[str] = Field(default=None, max_length=500)
    ruc: Optional[str] = Field(default=None, max_length=11)
    pais_origen: Optional[str] = Field(default=None, max_length=2)
    tax_id_internacional: Optional[str] = Field(default=None, max_length=100)
    rep_legal_nombre_pasaporte: Optional[str] = Field(
        default=None, sa_column=Column(Text, nullable=True)
    )
    profile_completed: bool = Field(
        default=False, sa_column=Column(Boolean, nullable=False, server_default="false")
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
