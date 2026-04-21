from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
import uuid
from src.shared.infrastructure.database import get_session
from src.modules.identity.infrastructure.auth_dependency import get_current_user
from src.modules.identity.domain.entities import User
from ..application.dtos import ProfileSubmitDTO, OnboardingResultsDTO
from ..application.service import OnboardingService

router = APIRouter(prefix="/api/v1/onboarding", tags=["Onboarding"])

@router.post("/profile", response_model=OnboardingResultsDTO)
async def submit_onboarding_profile(
    payload: ProfileSubmitDTO,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Recibe los datos del formulario de profiling y devuelve 
    los resultados calculados (Score, Beneficios, Lote).
    """
    service = OnboardingService(session)
    return service.calculate_and_save_profile(payload, user_id=current_user.id)

@router.get("/results/{profile_id}", response_model=OnboardingResultsDTO)
async def get_onboarding_results(
    profile_id: uuid.UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Recupera un análisis de onboarding previo."""
    service = OnboardingService(session)
    profile = service.get_profile(profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Perfil de onboarding no encontrado.")
    return profile
