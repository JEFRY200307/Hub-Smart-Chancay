from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, status
from sqlmodel import Session

from src.shared.infrastructure.database import get_session
from src.modules.identity.infrastructure.auth_dependency import get_current_user
from src.modules.identity.domain.entities import User

from ..application.dtos import ProjectCreateDTO, ProjectUpdateDTO, ProjectResponseDTO
from ..application.service import ProjectService

router = APIRouter(prefix="/api/v1/projects", tags=["Portafolio"])


@router.get("", response_model=list[ProjectResponseDTO])
async def list_projects(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return ProjectService(session).list_for_user(current_user.id)


@router.post("", response_model=ProjectResponseDTO, status_code=status.HTTP_201_CREATED)
async def create_project(
    payload: ProjectCreateDTO,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return ProjectService(session).create(payload, current_user.id)


@router.get("/{project_id}", response_model=ProjectResponseDTO)
async def get_project(
    project_id: uuid.UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return ProjectService(session).get(project_id, current_user.id)


@router.patch("/{project_id}", response_model=ProjectResponseDTO)
async def update_project(
    project_id: uuid.UUID,
    payload: ProjectUpdateDTO,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return ProjectService(session).update(project_id, current_user.id, payload)


@router.post("/{project_id}/activate", response_model=ProjectResponseDTO)
async def activate_project(
    project_id: uuid.UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return ProjectService(session).activate(project_id, current_user.id)


@router.delete("/{project_id}", response_model=ProjectResponseDTO)
async def archive_project(
    project_id: uuid.UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return ProjectService(session).archive(project_id, current_user.id)
