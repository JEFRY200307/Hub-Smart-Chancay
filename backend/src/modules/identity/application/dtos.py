from pydantic import BaseModel, Field
from typing import Optional

class LoginRequestDTO(BaseModel):
    username_or_email: str = Field(..., description="Username or Email of the corporate user")
    password: str = Field(..., min_length=6)

class TokenDTO(BaseModel):
    access_token: str
    refresh_token: str
    expires_in: int = 1800 # 30 min standard
    token_type: str = "bearer"
    role: str

class LoginResponseDTO(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_name: str
    role: str

class RefreshRequestDTO(BaseModel):
    refresh_token: str

class RegisterRequestDTO(BaseModel):
    username: str = Field(..., min_length=4)
    ruc: str = Field(..., min_length=11, max_length=11)
    email: str = Field(...)
    password: str = Field(..., min_length=8)
    full_name: str
    company_name: Optional[str] = None
