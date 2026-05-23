from __future__ import annotations
import uuid
from fastapi import APIRouter, Depends, status
from sqlmodel import Session

from src.shared.infrastructure.database import get_session
from src.shared.domain.exceptions import DomainException, ResourceNotFoundException
from src.modules.identity.infrastructure.auth_dependency import get_optional_user
from src.modules.identity.domain.entities import User

from ..application.dtos import SimulationRequestDTO, SimulationResponseDTO, SimulationStatusDTO
from ..application.simulation_service import SimulationService

router = APIRouter(prefix="/api/v1/simulation", tags=["Simulation"])


@router.post("/calculate", response_model=SimulationResponseDTO, status_code=status.HTTP_201_CREATED)
async def calculate_simulation(
    payload: SimulationRequestDTO,
    session: Session = Depends(get_session),
    current_user: User | None = Depends(get_optional_user),
):
    """
    Calcula el Score de Elegibilidad ZEEP.
    No requiere autenticación (GANCHO — primer contacto del inversor).
    """
    svc = SimulationService(session)
    return svc.calculate(payload, user_id=current_user.id if current_user else None)


@router.get("/{session_id}", response_model=SimulationResponseDTO)
async def get_simulation_by_session(
    session_id: str,
    session: Session = Depends(get_session),
):
    """Recupera una simulación previa por session_id (público)."""
    svc = SimulationService(session)
    sid = uuid.UUID(session_id)
    record = svc.get_by_session(sid)
    if not record:
        raise ResourceNotFoundException("SimulationRecord", str(session_id))

    return svc.record_to_response(record)
