from __future__ import annotations
import uuid
from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field
from sqlalchemy import Column, String, Boolean, SmallInteger, Text
from sqlalchemy.dialects.postgresql import INET


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    email: str = Field(max_length=320, unique=True, index=True)
    hashed_password: str = Field(sa_column=Column(Text, nullable=False))
    role: str = Field(default="inversor", max_length=20)      # UserRole enum
    full_name: Optional[str] = Field(default=None, max_length=200)
    phone: Optional[str] = Field(default=None, max_length=20)
    preferred_lang: str = Field(default="es", max_length=5)   # es | en | zh
    is_active: bool = Field(default=True)
    is_verified: bool = Field(default=False)
    last_login_at: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class RefreshToken(SQLModel, table=True):
    __tablename__ = "refresh_tokens"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    token: str = Field(sa_column=Column(Text, unique=True, nullable=False))
    user_id: uuid.UUID = Field(foreign_key="users.id")
    expires_at: datetime
    revoked_at: Optional[datetime] = Field(default=None)
    ip_address: Optional[str] = Field(default=None, sa_column=Column(INET, nullable=True))
    user_agent: Optional[str] = Field(default=None, sa_column=Column(Text, nullable=True))
    created_at: datetime = Field(default_factory=datetime.utcnow)


class EmailVerificationToken(SQLModel, table=True):
    __tablename__ = "email_verification_tokens"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id")
    token_hash: str = Field(sa_column=Column(Text, nullable=False))  # bcrypt del OTP de 6 dígitos
    expires_at: datetime                                               # NOW() + 15 min
    intentos_fallidos: int = Field(default=0, sa_column=Column(SmallInteger, nullable=False, server_default="0"))
    used_at: Optional[datetime] = Field(default=None)                 # NULL = token activo
    created_at: datetime = Field(default_factory=datetime.utcnow)
