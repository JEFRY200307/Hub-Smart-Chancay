from __future__ import annotations

import uuid
from datetime import datetime

from sqlmodel import Session, select, func

from ..domain.entities import InvestmentProject
from .dtos import ProjectCreateDTO, ProjectUpdateDTO, ProjectResponseDTO
from src.modules.onboarding.domain.entities import InvestorProfile
from src.shared.domain.exceptions import DomainException


MAX_ACTIVE_PROJECTS = 20


class ProjectService:
    def __init__(self, session: Session) -> None:
        self._session = session

    def list_for_user(self, user_id: uuid.UUID) -> list[ProjectResponseDTO]:
        rows = self._session.exec(
            select(InvestmentProject)
            .where(InvestmentProject.user_id == user_id)
            .where(InvestmentProject.estado != "archivado")
            .order_by(InvestmentProject.is_active.desc(), InvestmentProject.updated_at.desc())
        ).all()
        return [self._to_dto(r) for r in rows]

    def get(self, project_id: uuid.UUID, user_id: uuid.UUID) -> ProjectResponseDTO:
        row = self._get_owned(project_id, user_id)
        return self._to_dto(row)

    def create(self, dto: ProjectCreateDTO, user_id: uuid.UUID) -> ProjectResponseDTO:
        count = self._session.exec(
            select(func.count())
            .select_from(InvestmentProject)
            .where(InvestmentProject.user_id == user_id)
            .where(InvestmentProject.estado != "archivado")
        ).one()
        if count >= MAX_ACTIVE_PROJECTS:
            raise DomainException(
                title="Límite alcanzado",
                detail=f"Máximo {MAX_ACTIVE_PROJECTS} proyectos activos.",
                status_code=422,
            )

        codigo = self._next_codigo(user_id)
        has_any = count > 0
        project = InvestmentProject(
            user_id=user_id,
            codigo=codigo,
            nombre=dto.nombre,
            descripcion=dto.descripcion,
            sector=dto.sector,
            monto_usd=dto.monto_usd,
            empleo_directo=dto.empleo_directo,
            empleo_indirecto=dto.empleo_indirecto,
            porcentaje_cl=dto.porcentaje_cl,
            exportacion_pct=dto.exportacion_pct,
            pais_origen_capital=dto.pais_origen_capital.upper(),
            empresa_razon_social=dto.empresa_razon_social,
            is_active=not has_any,
        )
        self._session.add(project)
        self._session.commit()
        self._session.refresh(project)
        return self._to_dto(project)

    def update(
        self, project_id: uuid.UUID, user_id: uuid.UUID, dto: ProjectUpdateDTO
    ) -> ProjectResponseDTO:
        row = self._get_owned(project_id, user_id)
        for field, value in dto.model_dump(exclude_unset=True).items():
            setattr(row, field, value)
        row.updated_at = datetime.utcnow()
        self._session.add(row)
        self._session.commit()
        self._session.refresh(row)
        return self._to_dto(row)

    def activate(self, project_id: uuid.UUID, user_id: uuid.UUID) -> ProjectResponseDTO:
        row = self._get_owned(project_id, user_id)
        others = self._session.exec(
            select(InvestmentProject).where(
                InvestmentProject.user_id == user_id,
                InvestmentProject.id != project_id,
            )
        ).all()
        for o in others:
            o.is_active = False
            self._session.add(o)
        row.is_active = True
        self._session.add(row)
        self._session.commit()
        self._session.refresh(row)
        return self._to_dto(row)

    def archive(self, project_id: uuid.UUID, user_id: uuid.UUID) -> ProjectResponseDTO:
        row = self._get_owned(project_id, user_id)
        row.estado = "archivado"
        row.is_active = False
        self._session.add(row)
        self._session.commit()
        if not self._session.exec(
            select(InvestmentProject).where(
                InvestmentProject.user_id == user_id,
                InvestmentProject.is_active.is_(True),
            )
        ).first():
            next_p = self._session.exec(
                select(InvestmentProject)
                .where(InvestmentProject.user_id == user_id)
                .where(InvestmentProject.estado != "archivado")
                .order_by(InvestmentProject.updated_at.desc())
            ).first()
            if next_p:
                next_p.is_active = True
                self._session.add(next_p)
        self._session.commit()
        self._session.refresh(row)
        return self._to_dto(row)

    def link_profile(
        self,
        project_id: uuid.UUID,
        user_id: uuid.UUID,
        profile_id: uuid.UUID,
        session_id: uuid.UUID,
    ) -> None:
        row = self._get_owned(project_id, user_id)
        row.investor_profile_id = profile_id
        row.session_id = session_id
        row.estado = "perfil_creado"
        self._session.add(row)
        self._session.commit()

    def get_active(self, user_id: uuid.UUID) -> InvestmentProject | None:
        return self._session.exec(
            select(InvestmentProject).where(
                InvestmentProject.user_id == user_id,
                InvestmentProject.is_active.is_(True),
            )
        ).first()

    def _get_owned(self, project_id: uuid.UUID, user_id: uuid.UUID) -> InvestmentProject:
        row = self._session.get(InvestmentProject, project_id)
        if not row or row.user_id != user_id:
            raise DomainException(
                title="No encontrado",
                detail="Proyecto no existe o no pertenece al usuario.",
                status_code=404,
            )
        return row

    def _next_codigo(self, user_id: uuid.UUID) -> str:
        year = datetime.utcnow().year
        n = self._session.exec(
            select(func.count())
            .select_from(InvestmentProject)
            .where(InvestmentProject.user_id == user_id)
        ).one()
        return f"PRY-{year}-{int(n) + 1:03d}"

    def _to_dto(self, row: InvestmentProject) -> ProjectResponseDTO:
        completion = 0
        if row.investor_profile_id:
            profile = self._session.get(InvestorProfile, row.investor_profile_id)
            if profile:
                completion = profile.completion_pct or 0
        return ProjectResponseDTO(
            id=row.id,
            codigo=row.codigo,
            nombre=row.nombre,
            sector=row.sector,
            estado=row.estado,
            monto_usd=row.monto_usd,
            empleo_directo=row.empleo_directo,
            empleo_indirecto=row.empleo_indirecto,
            porcentaje_cl=row.porcentaje_cl,
            exportacion_pct=row.exportacion_pct,
            pais_origen_capital=row.pais_origen_capital,
            empresa_razon_social=row.empresa_razon_social,
            is_active=row.is_active,
            investor_profile_id=row.investor_profile_id,
            session_id=row.session_id,
            completion_pct=completion,
        )
