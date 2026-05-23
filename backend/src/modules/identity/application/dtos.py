from __future__ import annotations
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
import uuid


class LoginRequestDTO(BaseModel):
    email: str
    password: str


class RegisterRequestDTO(BaseModel):
    email: str
    password: str = Field(..., min_length=8)
    full_name: str
    role: str = "inversor"
    phone: Optional[str] = None
    preferred_lang: str = "es"


class LoginResponseDTO(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    full_name: Optional[str]
    role: str


class RefreshRequestDTO(BaseModel):
    refresh_token: str


class UserMeDTO(BaseModel):
    id: uuid.UUID
    email: str
    full_name: Optional[str]
    role: str
    is_active: bool
    is_verified: bool
    preferred_lang: str
    last_login_at: Optional[str] = None
    created_at: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class RegisterCompanyDTO(BaseModel):
    nombre_empresa: str
    pais_origen: str = Field(..., min_length=2, max_length=2)
    sector_interes: str = Field(..., pattern="^(manufactura|ckd|tech)$")
    email_corporativo: str
    nombre_representante: str


class RegisterCompanyResponseDTO(BaseModel):
    user_id: str
    email: str
    otp_enviado: bool
    mensaje: str


class VerifyEmailDTO(BaseModel):
    email: str
    otp_code: str = Field(..., min_length=6, max_length=6)


class VerifyEmailResponseDTO(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = 1800
    investor_profile_id: Optional[str] = None


class ResendOtpDTO(BaseModel):
    email: str


class ResendOtpResponseDTO(BaseModel):
    otp_enviado: bool
    cooldown_seconds: int = 60
    expires_in_minutes: int = 15
