from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session
from src.shared.infrastructure.database import get_session
from src.shared.domain.exceptions import DomainException
from src.shared.infrastructure.security import SecurityUtils

from ..application.dtos import (
    LoginRequestDTO, LoginResponseDTO, RegisterRequestDTO, 
    TokenDTO, RefreshRequestDTO
)
from ..infrastructure.repository import IdentityRepository
from ..domain.entities import User
from .auth_dependency import get_current_user

router = APIRouter(prefix="/api/v1/auth", tags=["Identity"])

@router.post("/login", response_model=LoginResponseDTO)
async def login(
    payload: LoginRequestDTO = None,
    form_data: OAuth2PasswordRequestForm = Depends(None), # Para Swagger
    session: Session = Depends(get_session)
):
    repo = IdentityRepository(session)
    
    # Soporte dual: JSON (App) o Form (Swagger)
    username_or_email = form_data.username if form_data else payload.username_or_email
    password = form_data.password if form_data else payload.password
    
    # 1. Buscar por email o username
    user = repo.get_user_by_email(username_or_email)
    if not user:
        user = repo.get_user_by_username(username_or_email)
        
    # 2. Validar credenciales
    if not user or not SecurityUtils.verify_password(password, user.hashed_password):
        raise DomainException(
            title="Authentication Failed",
            detail="Usuario o contraseña incorrectos.",
            status_code=status.HTTP_401_UNAUTHORIZED,
            type_uri="https://api.chancaygateway.gob.pe/errors/auth/invalid-credentials"
        )
    
    # 3. Generar Tokens
    token_data = {"sub": user.username}
    access_token = SecurityUtils.create_access_token(token_data)
    refresh_token = SecurityUtils.create_refresh_token(token_data)
    
    # 4. Actualizar actividad y persistir Refresh Token
    user.refresh_token = refresh_token
    repo.update_user(user)
    repo.update_user_activity(user)
    
    # Respuesta plana compatible con el estándar OAuth2 y Swagger
    return LoginResponseDTO(
        access_token=access_token,
        refresh_token=refresh_token,
        user_name=user.full_name,
        role=user.role
    )

@router.post("/register", response_model=LoginResponseDTO)
async def register(
    payload: RegisterRequestDTO,
    session: Session = Depends(get_session)
):
    repo = IdentityRepository(session)
    
    # 1. Validaciones de existencia
    if repo.get_user_by_email(payload.email) or repo.get_user_by_username(payload.username):
        raise DomainException(
            title="User Already Exists",
            detail="El correo o nombre de usuario ya está registrado.",
            status_code=status.HTTP_400_BAD_REQUEST
        )
    
    # 2. Manejo de Empresa (Lógica institucional)
    company = repo.get_company_by_ruc(payload.ruc)
    if not company:
        from src.modules.zeep_ingestion.domain.entities import Company
        company = Company(
            ruc=payload.ruc,
            razon_social=payload.company_name or "Empresa Registrada Manualmente",
            estado_contribuyente="ACTIVO",
            condicion_domicilio="HABIDO",
            ubigeo="000000",
            is_verified=False
        )
        company = repo.create_company(company)
    
    # 3. Crear Usuario con Password Hasheado
    new_user = User(
        email=payload.email,
        username=payload.username,
        hashed_password=SecurityUtils.get_password_hash(payload.password),
        ruc=payload.ruc,
        full_name=payload.full_name,
        company_id=company.id,
        role="OPERATOR"
    )
    
    repo.create_user(new_user)
    
    # 4. Hacer login automático tras registro
    return await login(LoginRequestDTO(username_or_email=new_user.email, password=payload.password), session)

@router.post("/refresh", response_model=LoginResponseDTO)
async def refresh_token(
    payload: RefreshRequestDTO,
    session: Session = Depends(get_session)
):
    repo = IdentityRepository(session)
    
    # 1. Decodificar y validar Refresh Token
    token_payload = SecurityUtils.decode_token(payload.refresh_token)
    if not token_payload or token_payload.get("type") != "refresh":
        raise DomainException(
            title="Invalid Refresh Token",
            detail="El token de refresco es inválido o ha expirado.",
            status_code=status.HTTP_401_UNAUTHORIZED
        )
        
    username = token_payload.get("sub")
    user = repo.get_user_by_username(username)
    
    # 2. Validar contra DB (Rotación - el token debe coincidir con el almacenado)
    if not user or user.refresh_token != payload.refresh_token:
        raise DomainException(
            title="Session Revoked",
            detail="La sesión ha sido revocada o el token ya fue utilizado.",
            status_code=status.HTTP_401_UNAUTHORIZED
        )
    
    # 3. Generar nuevo par de tokens (Rotación estricta)
    new_token_data = {"sub": user.username}
    access_token = SecurityUtils.create_access_token(new_token_data)
    new_refresh_token = SecurityUtils.create_refresh_token(new_token_data)
    
    # 4. Actualizar DB
    user.refresh_token = new_refresh_token
    repo.update_user(user)
    
    return LoginResponseDTO(
        tokens=TokenDTO(
            access_token=access_token,
            refresh_token=new_refresh_token,
            role=user.role
        ),
        user_name=user.full_name
    )

@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    repo = IdentityRepository(session)
    current_user.refresh_token = None
    repo.update_user(current_user)
    return {"message": "Sesión cerrada exitosamente."}

@router.get("/me")
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "username": current_user.username,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "last_active_at": current_user.last_active_at
    }
