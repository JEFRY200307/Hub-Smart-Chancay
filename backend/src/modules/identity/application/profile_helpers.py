from __future__ import annotations

from ..domain.user_profile import UserProfile
from .dtos import UserProfileDTO


def profile_to_dto(profile: UserProfile | None) -> UserProfileDTO | None:
    if not profile:
        return None
    can_onboard = profile.profile_type == "empresa_inversora"
    return UserProfileDTO(
        profile_type=profile.profile_type,
        numero_cip=profile.numero_cip,
        numero_cal=profile.numero_cal,
        razon_social=profile.razon_social,
        ruc=profile.ruc,
        pais_origen=profile.pais_origen,
        tax_id_internacional=profile.tax_id_internacional,
        rep_legal_nombre_pasaporte=profile.rep_legal_nombre_pasaporte,
        profile_completed=profile.profile_completed,
        can_access_onboarding=can_onboard,
    )


def refresh_profile_completed(profile: UserProfile) -> None:
    if profile.profile_type == "empresa_inversora":
        profile.profile_completed = bool(
            profile.razon_social and profile.pais_origen
        )
