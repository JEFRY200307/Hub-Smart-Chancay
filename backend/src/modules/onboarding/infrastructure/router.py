from __future__ import annotations

import uuid
from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from sqlmodel import Session

from src.shared.infrastructure.database import get_session
from src.shared.infrastructure.storage import save_upload
from src.shared.domain.exceptions import DomainException, ResourceNotFoundException
from src.modules.identity.infrastructure.auth_dependency import get_current_user
from src.modules.identity.domain.entities import User

from ..application.dtos import OnboardingCreateDTO, OnboardingUpdateDTO, InvestorProfileDTO
from ..application.service import OnboardingService

router = APIRouter(prefix="/api/v1/onboarding", tags=["Onboarding"])

MAX_DOC_BYTES = 10 * 1024 * 1024


def _to_dto(profile) -> InvestorProfileDTO:
    return InvestorProfileDTO(
        id=profile.id,
        session_id=profile.session_id,
        user_id=profile.user_id,
        estado=profile.estado,
        completion_pct=profile.completion_pct,
        empresa_razon_social=profile.empresa_razon_social,
        proyecto_nombre=profile.proyecto_nombre,
        proyecto_monto_usd=profile.proyecto_monto_usd,
        sector=profile.sector,
        created_at=profile.created_at.isoformat(),
    )


@router.post("/profiles", response_model=InvestorProfileDTO, status_code=status.HTTP_201_CREATED)
async def create_profile(
    payload: OnboardingCreateDTO,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    svc = OnboardingService(session)
    profile = svc.create_profile(payload, current_user.id)
    return _to_dto(profile)


@router.get("/profiles/{profile_id}", response_model=InvestorProfileDTO)
async def get_profile(
    profile_id: uuid.UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    svc = OnboardingService(session)
    profile = svc.get_profile(profile_id)
    if not profile:
        raise ResourceNotFoundException("InvestorProfile", str(profile_id))
    if profile.user_id != current_user.id and current_user.role not in ("operador_zeep", "admin"):
        raise DomainException(title="Forbidden", detail="Perfil de otro usuario.", status_code=status.HTTP_403_FORBIDDEN)
    return _to_dto(profile)


@router.patch("/profiles/{profile_id}", response_model=InvestorProfileDTO)
async def update_profile(
    profile_id: uuid.UUID,
    payload: OnboardingUpdateDTO,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    svc = OnboardingService(session)
    profile = svc.get_profile(profile_id)
    if not profile:
        raise ResourceNotFoundException("InvestorProfile", str(profile_id))
    if profile.user_id != current_user.id:
        raise DomainException(title="Forbidden", detail="Perfil de otro usuario.", status_code=status.HTTP_403_FORBIDDEN)
    updated = svc.update_profile(profile_id, payload)
    return _to_dto(updated)


@router.post("/profiles/{profile_id}/documents", status_code=status.HTTP_201_CREATED)
async def upload_document(
    profile_id: uuid.UUID,
    file: UploadFile = File(...),
    tipo_documento: str = Form(...),
    descripcion: str | None = Form(None),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    svc = OnboardingService(session)
    profile = svc.get_profile(profile_id)
    if not profile:
        raise ResourceNotFoundException("InvestorProfile", str(profile_id))

    content = await file.read()
    if len(content) > MAX_DOC_BYTES:
        raise DomainException(title="Payload Too Large", detail="Máximo 10 MB.", status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE)
    if file.content_type not in ("application/pdf", "application/octet-stream"):
        raise DomainException(title="Unsupported Media Type", detail="Solo PDF.", status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE)

    url, digest, size = save_upload(content, file.filename or "documento.pdf")
    doc = svc.attach_document(
        profile_id=profile_id,
        tipo=tipo_documento,
        nombre_archivo=file.filename or "documento.pdf",
        url_storage=url,
        size_bytes=size,
        mime_type=file.content_type or "application/pdf",
        hash_sha256=digest,
        user_id=current_user.id,
    )
    return {
        "documento_id": str(doc.id),
        "tipo_documento": doc.tipo,
        "filename": doc.nombre_archivo,
        "url": doc.url_storage,
        "uploaded_at": doc.created_at.isoformat(),
        "descripcion": descripcion,
    }


@router.get("/profiles/{profile_id}/roadmap")
async def get_roadmap(
    profile_id: uuid.UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    svc = OnboardingService(session)
    profile = svc.get_profile(profile_id)
    if not profile:
        raise ResourceNotFoundException("InvestorProfile", str(profile_id))
    return svc.get_roadmap_detail(profile_id)
