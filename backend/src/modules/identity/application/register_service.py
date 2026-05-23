from __future__ import annotations

from sqlmodel import Session

from ..domain.entities import User
from ..domain.user_profile import UserProfile
from ..infrastructure.repository import IdentityRepository
from .dtos import RegisterRequestDTO
from src.shared.domain.exceptions import DomainException
from src.shared.infrastructure.security import SecurityUtils


ROLE_BY_PROFILE = {
    "ingeniero": "profesional",
    "abogado": "profesional",
    "empresa_inversora": "inversor",
    "empresa_local": "profesional",
}


class RegisterService:
    def __init__(self, session: Session) -> None:
        self._repo = IdentityRepository(session)
        self._session = session

    def validate_payload(self, payload: RegisterRequestDTO) -> None:
        pt = payload.profile_type
        if pt == "ingeniero" and not payload.numero_cip:
            raise DomainException(
                title="Validación",
                detail="El código CIP es obligatorio para ingenieros.",
                status_code=422,
            )
        if pt == "abogado" and not payload.numero_cal:
            raise DomainException(
                title="Validación",
                detail="El código CAL es obligatorio para abogados.",
                status_code=422,
            )
        if pt == "empresa_inversora" and not payload.razon_social:
            raise DomainException(
                title="Validación",
                detail="La razón social es obligatoria para empresas inversoras.",
                status_code=422,
            )
        if pt == "empresa_local":
            if not payload.razon_social:
                raise DomainException(
                    title="Validación",
                    detail="La razón social es obligatoria para empresas locales.",
                    status_code=422,
                )
            if not payload.ruc or len(payload.ruc.replace(" ", "")) != 11:
                raise DomainException(
                    title="Validación",
                    detail="El RUC debe tener 11 dígitos.",
                    status_code=422,
                )

    def register(self, payload: RegisterRequestDTO) -> User:
        self.validate_payload(payload)
        if self._repo.get_user_by_email(payload.email):
            raise DomainException(
                title="User Already Exists",
                detail="El correo ya está registrado.",
                status_code=409,
            )

        role = ROLE_BY_PROFILE[payload.profile_type]
        user = User(
            email=payload.email,
            hashed_password=SecurityUtils.get_password_hash(payload.password),
            full_name=payload.full_name,
            role=role,
            phone=payload.phone,
            preferred_lang=payload.preferred_lang,
            is_verified=True,
            is_active=True,
        )
        self._repo.create_user(user)

        pais = payload.pais_origen.upper() if payload.pais_origen else None
        completed = False
        if payload.profile_type == "empresa_inversora":
            completed = bool(payload.razon_social and pais)

        profile = UserProfile(
            user_id=user.id,
            profile_type=payload.profile_type,
            numero_cip=payload.numero_cip,
            numero_cal=payload.numero_cal,
            razon_social=payload.razon_social,
            ruc=payload.ruc.replace(" ", "") if payload.ruc else None,
            pais_origen=pais,
            tax_id_internacional=payload.tax_id_internacional,
            rep_legal_nombre_pasaporte=payload.rep_legal_nombre_pasaporte,
            profile_completed=completed,
        )
        self._session.add(profile)
        self._session.commit()
        self._session.refresh(user)
        return user
