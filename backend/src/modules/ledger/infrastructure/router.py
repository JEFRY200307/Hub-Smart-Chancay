from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlmodel import Session

from src.shared.infrastructure.database import get_session
from src.shared.domain.exceptions import ResourceNotFoundException
from src.modules.identity.infrastructure.auth_dependency import get_current_user, require_roles
from src.modules.identity.domain.entities import User

from ..application.dtos import (
    LedgerEventCreateDTO,
    LedgerEventResponseDTO,
    LedgerIntegrityResultDTO,
    MinutaRegistrarDTO,
    LedgerStatsDTO,
)
from ..application.ledger_service import LedgerService

router = APIRouter(prefix="/api/v1/ledger", tags=["Ledger"])


@router.post("/events", response_model=LedgerEventResponseDTO, status_code=status.HTTP_201_CREATED)
async def create_event(
    payload: LedgerEventCreateDTO,
    session: Session = Depends(get_session),
    _: User = Depends(require_roles("admin")),
):
    return LedgerService(session).append(payload)


@router.post("/minutas", response_model=LedgerEventResponseDTO, status_code=status.HTTP_201_CREATED)
async def register_minuta(
    payload: MinutaRegistrarDTO,
    session: Session = Depends(get_session),
    _: User = Depends(require_roles("operador_zeep", "admin")),
):
    event_dto = LedgerEventCreateDTO(
        investor_profile_id=payload.investor_profile_id,
        event_type="MINUTA_REGISTRADA",
        payload={
            "reunion_id": str(payload.reunion_id),
            "participantes": payload.participantes,
            "acuerdos": payload.acuerdos,
            "proximos_pasos": payload.proximos_pasos,
            "validada_por": str(payload.validada_por),
        },
        actor_id=payload.actor_id,
        actor_type="operador_zeep",
    )
    return LedgerService(session).append(event_dto)


@router.get("/stats")
async def global_stats(
    session: Session = Depends(get_session),
    _: User = Depends(require_roles("operador_zeep", "admin")),
):
    return LedgerService(session).get_global_stats()


@router.get("/profiles/{profile_id}/timeline", response_model=list[LedgerEventResponseDTO])
async def get_timeline_legacy(
    profile_id: uuid.UUID,
    session: Session = Depends(get_session),
    _: User = Depends(get_current_user),
):
    return LedgerService(session).get_timeline(profile_id)


@router.get("/profiles/{profile_id}/verify", response_model=LedgerIntegrityResultDTO)
async def verify_legacy(profile_id: uuid.UUID, session: Session = Depends(get_session)):
    return LedgerService(session).verify_integrity(profile_id)


@router.get("/profiles/{profile_id}/stats", response_model=LedgerStatsDTO)
async def stats_legacy(
    profile_id: uuid.UUID,
    session: Session = Depends(get_session),
    _: User = Depends(get_current_user),
):
    return LedgerService(session).get_stats(profile_id)


@router.get("/{profile_id}/verify")
async def verify_integrity(profile_id: uuid.UUID, session: Session = Depends(get_session)):
    result = LedgerService(session).verify_integrity(profile_id)
    return {
        "investor_profile_id": str(profile_id),
        "valid": result.is_valid,
        "events_verified": result.total_events,
        "tampered_at": result.first_broken_sequence,
        "detail": result.error_detail,
        "verified_at": datetime.utcnow().isoformat() + "Z",
    }


@router.get("/{profile_id}/dossier")
async def get_dossier(
    profile_id: uuid.UUID,
    format: str = Query("json"),
    session: Session = Depends(get_session),
    _: User = Depends(get_current_user),
):
    dossier = LedgerService(session).get_or_create_dossier(profile_id)
    if not dossier:
        raise ResourceNotFoundException("Dossier", str(profile_id))
    if format == "pdf":
        return {"pdf_url": dossier["pdf_url"]}
    return dossier


@router.get("/{profile_id}")
async def get_ledger_timeline(
    profile_id: uuid.UUID,
    event_type: Optional[str] = Query(None),
    session: Session = Depends(get_session),
    _: User = Depends(get_current_user),
):
    svc = LedgerService(session)
    events = svc.get_timeline(profile_id)
    if event_type:
        events = [e for e in events if e.event_type == event_type]
    stats = svc.get_stats(profile_id)
    return {
        "investor_profile_id": str(profile_id),
        "total_events": len(events),
        "fase_actual": stats.fase_actual,
        "events": [
            {
                "event_id": str(e.id),
                "sequence_number": e.sequence_number,
                "event_type": e.event_type,
                "actor_type": e.actor_type,
                "payload": e.payload,
                "event_hash": f"sha256:{e.hash}",
                "created_at": e.created_at.isoformat(),
            }
            for e in events
        ],
    }
