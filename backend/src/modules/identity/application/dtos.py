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
    profile_type: str = Field(
        ...,
        pattern="^(ingeniero|abogado|empresa_inversora|empresa_local)$",
    )
    phone: Optional[str] = None
    preferred_lang: str = "es"
    numero_cip: Optional[str] = None
    numero_cal: Optional[str] = None
    razon_social: Optional[str] = None
    ruc: Optional[str] = None
    pais_origen: Optional[str] = Field(default=None, min_length=2, max_length=2)
    tax_id_internacional: Optional[str] = None
    rep_legal_nombre_pasaporte: Optional[str] = None


class UserProfileDTO(BaseModel):
    profile_type: str
    numero_cip: Optional[str] = None
    numero_cal: Optional[str] = None
    razon_social: Optional[str] = None
    ruc: Optional[str] = None
    pais_origen: Optional[str] = None
    tax_id_internacional: Optional[str] = None
    rep_legal_nombre_pasaporte: Optional[str] = None
    profile_completed: bool = False
    can_access_onboarding: bool = False


class UpdateUserProfileDTO(BaseModel):
    pais_origen: Optional[str] = Field(default=None, min_length=2, max_length=2)
    tax_id_internacional: Optional[str] = None
    rep_legal_nombre_pasaporte: Optional[str] = None
    razon_social: Optional[str] = None


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
    profile: Optional[UserProfileDTO] = None

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
