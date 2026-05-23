from __future__ import annotations
from typing import Callable
from fastapi import Depends, status
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session

from src.shared.infrastructure.database import get_session
from src.shared.infrastructure.security import SecurityUtils
from src.shared.domain.exceptions import DomainException
from ..infrastructure.repository import IdentityRepository
from ..domain.entities import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    session: Session = Depends(get_session),
) -> User:
    repo = IdentityRepository(session)
    payload = SecurityUtils.decode_token(token)

    if not payload or payload.get("type") != "access":
        raise DomainException(
            title="Unauthorized",
            detail="Token inválido o expirado.",
            status_code=status.HTTP_401_UNAUTHORIZED,
            type_uri="https://api.chancaygateway.gob.pe/errors/auth/expired-token",
        )

    email: str = payload.get("sub")
    if not email:
        raise DomainException(
            title="Unauthorized",
            detail="Token no contiene identidad válida.",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )

    user = repo.get_user_by_email(email)
    if not user or not user.is_active:
        raise DomainException(
            title="Forbidden",
            detail="El usuario no existe o está inactivo.",
            status_code=status.HTTP_403_FORBIDDEN,
        )

    return user


async def get_optional_user(
    token: str | None = Depends(oauth2_scheme_optional),
    session: Session = Depends(get_session),
) -> User | None:
    if not token:
        return None
    repo = IdentityRepository(session)
    payload = SecurityUtils.decode_token(token)
    if not payload or payload.get("type") != "access":
        return None
    email = payload.get("sub")
    if not email:
        return None
    user = repo.get_user_by_email(email)
    if not user or not user.is_active:
        return None
    return user


def require_roles(*roles: str) -> Callable:
    async def _checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise DomainException(
                title="Forbidden",
                detail=f"Se requiere rol: {', '.join(roles)}.",
                status_code=status.HTTP_403_FORBIDDEN,
            )
        return current_user

    return _checker
