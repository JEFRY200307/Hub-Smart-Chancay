from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session
from datetime import datetime, timedelta

from src.shared.infrastructure.database import get_session
from src.shared.infrastructure.security import SecurityUtils
from src.shared.domain.exceptions import DomainException
from ..infrastructure.repository import IdentityRepository
from ..domain.entities import User

# El esquema OAuth2 que FastAPI usará para leer el header Authorization: Bearer <token>
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    session: Session = Depends(get_session)
) -> User:
    """
    Dependencia central para proteger rutas. 
    Valida: Token JWT, Existencia de Usuario e Inactividad de 10 min.
    """
    repo = IdentityRepository(session)
    payload = SecurityUtils.decode_token(token)
    
    if not payload or payload.get("type") != "access":
        raise DomainException(
            title="Unauthorized",
            detail="Token inválido o expirado.",
            status_code=status.HTTP_401_UNAUTHORIZED,
            type_uri="https://api.chancaygateway.gob.pe/errors/auth/expired-token"
        )
    
    username: str = payload.get("sub")
    if username is None:
         raise DomainException(
            title="Unauthorized",
            detail="Token no contiene identidad válida.",
            status_code=status.HTTP_401_UNAUTHORIZED
        )
        
    user = repo.get_user_by_username(username)
    if not user or not user.is_active:
        raise DomainException(
            title="Forbidden",
            detail="El usuario no existe o está inactivo.",
            status_code=status.HTTP_403_FORBIDDEN
        )

    # --- Lógica de Inactividad (10 minutos) ---
    now = datetime.utcnow()
    inactivity_limit = timedelta(minutes=10)
    
    if now - user.last_active_at > inactivity_limit:
        # Importante: No borramos el refresh token aquí para permitir que el proceso de /refresh 
        # intente salvar la sesión si el Refresh Token aún es válido (7 días).
        # Pero esta petición específica de API sí se rechaza.
        raise DomainException(
            title="Session Timeout",
            detail="Sesión cerrada por inactividad de 10 minutos.",
            status_code=status.HTTP_401_UNAUTHORIZED,
            type_uri="https://api.chancaygateway.gob.pe/errors/auth/inactivity-timeout"
        )
    
    # --- Actualizar actividad ---
    repo.update_user_activity(user)
    
    return user
