from __future__ import annotations
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Request, status
from sqlmodel import Session

from src.shared.infrastructure.database import get_session
from src.shared.infrastructure.security import SecurityUtils, REFRESH_TOKEN_EXPIRE_DAYS
from src.shared.domain.exceptions import DomainException

from ..application.dtos import (
    LoginRequestDTO, LoginResponseDTO,
    RegisterRequestDTO, RefreshRequestDTO, UserMeDTO,
    RegisterCompanyDTO, RegisterCompanyResponseDTO,
    VerifyEmailDTO, VerifyEmailResponseDTO,
    ResendOtpDTO, ResendOtpResponseDTO,
    UpdateUserProfileDTO,
)
from ..application.otp_service import OtpService
from ..application.register_service import RegisterService
from ..application.profile_helpers import profile_to_dto, refresh_profile_completed
from ..infrastructure.repository import IdentityRepository
from ..domain.entities import User, RefreshToken
from .auth_dependency import get_current_user
from src.shared.infrastructure.security import ACCESS_TOKEN_EXPIRE_MINUTES

router = APIRouter(prefix="/api/v1/auth", tags=["Identity"])


def _issue_tokens(user: User, repo: IdentityRepository, request: Request) -> LoginResponseDTO:
    token_data = {"sub": user.email}
    access_token = SecurityUtils.create_access_token(token_data)
    refresh_token_str = SecurityUtils.create_refresh_token(token_data)

    refresh_record = RefreshToken(
        token=refresh_token_str,
        user_id=user.id,
        expires_at=datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    repo.create_refresh_token(refresh_record)

    return LoginResponseDTO(
        access_token=access_token,
        refresh_token=refresh_token_str,
        user_id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        role=user.role,
    )


@router.post("/login", response_model=LoginResponseDTO)
async def login(
    request: Request,
    payload: LoginRequestDTO,
    session: Session = Depends(get_session),
):
    """Login JSON — el frontend envía { email, password }."""
    repo = IdentityRepository(session)
    email = payload.email
    password = payload.password

    user = repo.get_user_by_email(email)
    if not user or not SecurityUtils.verify_password(password, user.hashed_password):
        raise DomainException(
            title="Authentication Failed",
            detail="Correo o contraseña incorrectos.",
            status_code=status.HTTP_401_UNAUTHORIZED,
            type_uri="https://comex.ai/errors/invalid_credentials",
        )

    if user and not user.is_verified:
        raise DomainException(
            title="Email Not Verified",
            detail="Cuenta no verificada. Reenvíe el OTP.",
            status_code=status.HTTP_403_FORBIDDEN,
            type_uri="https://comex.ai/errors/email_not_verified",
        )

    if not user.is_active:
        raise DomainException(
            title="Account Disabled",
            detail="La cuenta está desactivada.",
            status_code=status.HTTP_403_FORBIDDEN,
        )

    repo.update_last_login(user)
    return _issue_tokens(user, repo, request)


@router.post("/register", response_model=LoginResponseDTO, status_code=status.HTTP_201_CREATED)
async def register(
    request: Request,
    payload: RegisterRequestDTO,
    session: Session = Depends(get_session),
):
    repo = IdentityRepository(session)
    new_user = RegisterService(session).register(payload)
    return _issue_tokens(new_user, repo, request)


@router.post("/refresh", response_model=LoginResponseDTO)
async def refresh_token(
    request: Request,
    payload: RefreshRequestDTO,
    session: Session = Depends(get_session),
):
    repo = IdentityRepository(session)

    payload_jwt = SecurityUtils.decode_token(payload.refresh_token)
    if not payload_jwt or payload_jwt.get("type") != "refresh":
        raise DomainException(
            title="Invalid Refresh Token",
            detail="El token de refresco es inválido o ha expirado.",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )

    token_record = repo.get_refresh_token(payload.refresh_token)
    if not token_record or token_record.revoked_at is not None:
        raise DomainException(
            title="Session Revoked",
            detail="La sesión ha sido revocada o el token ya fue utilizado.",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )

    if token_record.expires_at < datetime.utcnow():
        raise DomainException(
            title="Token Expired",
            detail="El token de refresco ha expirado.",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )

    # Rotation: revoke old, issue new
    repo.revoke_refresh_token(payload.refresh_token)

    user = repo.get_user_by_id(token_record.user_id)
    if not user or not user.is_active:
        raise DomainException(
            title="Forbidden",
            detail="El usuario no existe o está inactivo.",
            status_code=status.HTTP_403_FORBIDDEN,
        )

    return _issue_tokens(user, repo, request)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    payload: RefreshRequestDTO,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    repo = IdentityRepository(session)
    repo.revoke_refresh_token(payload.refresh_token)


@router.post("/register/company", response_model=RegisterCompanyResponseDTO, status_code=status.HTTP_201_CREATED)
async def register_company(
    payload: RegisterCompanyDTO,
    session: Session = Depends(get_session),
):
    repo = IdentityRepository(session)
    otp_svc = OtpService(repo)
    user, sent = otp_svc.register_company(
        nombre_empresa=payload.nombre_empresa,
        pais_origen=payload.pais_origen.upper(),
        sector_interes=payload.sector_interes,
        email=payload.email_corporativo,
        nombre_representante=payload.nombre_representante,
    )
    return RegisterCompanyResponseDTO(
        user_id=str(user.id),
        email=user.email,
        otp_enviado=sent,
        mensaje="Revisa tu correo corporativo. El código expira en 15 minutos.",
    )


@router.post("/verify-email", response_model=VerifyEmailResponseDTO)
async def verify_email(
    request: Request,
    payload: VerifyEmailDTO,
    session: Session = Depends(get_session),
):
    repo = IdentityRepository(session)
    user = OtpService(repo).verify_email(payload.email, payload.otp_code)
    tokens = _issue_tokens(user, repo, request)
    return VerifyEmailResponseDTO(
        access_token=tokens.access_token,
        refresh_token=tokens.refresh_token,
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.post("/resend-otp", response_model=ResendOtpResponseDTO)
async def resend_otp(
    payload: ResendOtpDTO,
    session: Session = Depends(get_session),
):
    repo = IdentityRepository(session)
    sent, cooldown = OtpService(repo).resend_otp(payload.email)
    return ResendOtpResponseDTO(otp_enviado=sent, cooldown_seconds=cooldown)


@router.get("/me", response_model=UserMeDTO)
async def get_current_user_info(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    repo = IdentityRepository(session)
    profile = repo.get_user_profile(current_user.id)
    return UserMeDTO(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        preferred_lang=current_user.preferred_lang,
        last_login_at=current_user.last_login_at.isoformat() if current_user.last_login_at else None,
        created_at=current_user.created_at.isoformat(),
        profile=profile_to_dto(profile),
    )


@router.patch("/me/profile", response_model=UserMeDTO)
async def update_my_profile(
    payload: UpdateUserProfileDTO,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    repo = IdentityRepository(session)
    profile = repo.get_user_profile(current_user.id)
    if not profile:
        raise DomainException(
            title="Perfil no encontrado",
            detail="Complete el registro primero.",
            status_code=404,
        )
    if profile.profile_type != "empresa_inversora":
        raise DomainException(
            title="Forbidden",
            detail="Solo empresas inversoras actualizan este perfil.",
            status_code=403,
        )
    for field, value in payload.model_dump(exclude_unset=True).items():
        if field == "pais_origen" and value:
            setattr(profile, field, value.upper())
        else:
            setattr(profile, field, value)
    refresh_profile_completed(profile)
    repo.upsert_user_profile(profile)
    return await get_current_user_info(current_user, session)
