from __future__ import annotations

import random
import secrets
import uuid
from datetime import datetime, timedelta

from src.shared.infrastructure.security import SecurityUtils
from src.shared.infrastructure.email_service import send_otp_email
from src.shared.domain.exceptions import DomainException
from fastapi import status

from ..domain.entities import User, EmailVerificationToken
from ..infrastructure.repository import IdentityRepository

OTP_TTL_MINUTES = 15
OTP_MAX_ATTEMPTS = 5
RESEND_COOLDOWN_SECONDS = 60


class OtpService:
    def __init__(self, repo: IdentityRepository):
        self._repo = repo

    def _generate_otp(self) -> str:
        return f"{random.randint(0, 999999):06d}"

    def _can_resend(self, token: EmailVerificationToken | None) -> int:
        if not token:
            return 0
        elapsed = (datetime.utcnow() - token.created_at).total_seconds()
        remaining = RESEND_COOLDOWN_SECONDS - int(elapsed)
        return max(0, remaining)

    def register_company(
        self,
        nombre_empresa: str,
        pais_origen: str,
        sector_interes: str,
        email: str,
        nombre_representante: str,
    ) -> tuple[User, bool]:
        existing = self._repo.get_user_by_email(email)
        if existing and existing.is_verified:
            raise DomainException(
                title="Conflict",
                detail="Email ya registrado y verificado.",
                status_code=status.HTTP_409_CONFLICT,
                type_uri="https://comex.ai/errors/email_already_verified",
            )

        if existing:
            user = existing
        else:
            temp_password = secrets.token_urlsafe(16)
            user = User(
                email=email,
                hashed_password=SecurityUtils.get_password_hash(temp_password),
                full_name=nombre_representante,
                role="inversor",
                is_verified=False,
                preferred_lang="es" if pais_origen != "CN" else "zh",
            )
            user = self._repo.create_user(user)

        otp = self._generate_otp()
        token = EmailVerificationToken(
            user_id=user.id,
            token_hash=SecurityUtils.get_password_hash(otp),
            expires_at=datetime.utcnow() + timedelta(minutes=OTP_TTL_MINUTES),
        )
        self._repo.create_otp_token(token)
        sent = send_otp_email(email, otp)
        return user, sent

    def verify_email(self, email: str, otp_code: str) -> User:
        user = self._repo.get_user_by_email(email)
        if not user:
            raise DomainException(
                title="Not Found",
                detail="Email no registrado.",
                status_code=status.HTTP_404_NOT_FOUND,
                type_uri="https://comex.ai/errors/user_not_found",
            )

        token = self._repo.get_active_otp(user.id)
        if not token:
            raise DomainException(
                title="Gone",
                detail="Código expirado. Solicite un nuevo OTP.",
                status_code=status.HTTP_410_GONE,
                type_uri="https://comex.ai/errors/otp_expired",
            )

        if token.expires_at < datetime.utcnow():
            raise DomainException(
                title="Gone",
                detail="Código expirado.",
                status_code=status.HTTP_410_GONE,
                type_uri="https://comex.ai/errors/otp_expired",
            )

        if token.intentos_fallidos >= OTP_MAX_ATTEMPTS:
            raise DomainException(
                title="Too Many Requests",
                detail="Máximo de intentos alcanzado.",
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                type_uri="https://comex.ai/errors/max_attempts_reached",
            )

        if not SecurityUtils.verify_password(otp_code, token.token_hash):
            token.intentos_fallidos += 1
            self._repo.update_otp_token(token)
            raise DomainException(
                title="Bad Request",
                detail="Código OTP incorrecto.",
                status_code=status.HTTP_400_BAD_REQUEST,
                type_uri="https://comex.ai/errors/invalid_otp",
            )

        token.used_at = datetime.utcnow()
        user.is_verified = True
        self._repo.update_otp_token(token)
        self._repo.update_user(user)
        return user

    def resend_otp(self, email: str) -> tuple[bool, int]:
        user = self._repo.get_user_by_email(email)
        if not user:
            raise DomainException(
                title="Not Found",
                detail="Email no registrado.",
                status_code=status.HTTP_404_NOT_FOUND,
            )

        active = self._repo.get_active_otp(user.id)
        cooldown = self._can_resend(active)
        if cooldown > 0:
            raise DomainException(
                title="Too Many Requests",
                detail=f"Espere {cooldown} segundos antes de reenviar.",
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                type_uri="https://comex.ai/errors/resend_cooldown",
            )

        otp = self._generate_otp()
        token = EmailVerificationToken(
            user_id=user.id,
            token_hash=SecurityUtils.get_password_hash(otp),
            expires_at=datetime.utcnow() + timedelta(minutes=OTP_TTL_MINUTES),
        )
        self._repo.create_otp_token(token)
        sent = send_otp_email(email, otp)
        return sent, RESEND_COOLDOWN_SECONDS
