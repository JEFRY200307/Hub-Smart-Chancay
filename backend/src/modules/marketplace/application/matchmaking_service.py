from __future__ import annotations

import uuid
from decimal import Decimal
from datetime import datetime

from sqlmodel import Session, select

from src.modules.onboarding.domain.entities import InvestorProfile
from src.modules.zeep_ingestion.domain.entities import Company
from ..domain.entities import (
    MatchResult,
    MatchCandidato,
    EngineerCIP,
    LawyerCAL,
    Reunion,
)
from .dtos import (
    MatchRequestDTO,
    MatchResponseDTO,
    MatchCategoriaResultDTO,
    MatchCandidatoDTO,
    ReunionRequestDTO,
    ReunionResponseDTO,
)


class MatchmakingService:
    def __init__(self, session: Session):
        self._session = session

    def run_match(self, dto: MatchRequestDTO) -> MatchResponseDTO:
        profile = self._session.get(InvestorProfile, dto.investor_profile_id)
        if not profile:
            raise ValueError("profile_not_found")
        if profile.estado == "archivado":
            raise ValueError("profile_archived")

        categorias = dto.categorias or [
            "ingeniero_cip",
            "abogado_cal",
            "proveedor_local",
        ]
        resultados: list[MatchCategoriaResultDTO] = []

        for cat in categorias:
            existing = self._session.exec(
                select(MatchResult).where(
                    MatchResult.investor_profile_id == profile.id,
                    MatchResult.categoria == cat,
                )
            ).first()
            if existing:
                mr = existing
            else:
                mr = self._create_match_for_category(profile, cat)
            resultados.append(self._build_categoria_result(mr))

        first_mr = self._session.exec(
            select(MatchResult)
            .where(MatchResult.investor_profile_id == profile.id)
            .order_by(MatchResult.created_at.desc())
        ).first()

        return MatchResponseDTO(
            match_id=first_mr.id if first_mr else uuid.uuid4(),
            investor_profile_id=profile.id,
            resultados=resultados,
            created_at=datetime.utcnow().isoformat(),
        )

    def get_match(self, match_id: uuid.UUID) -> MatchResponseDTO | None:
        mr = self._session.get(MatchResult, match_id)
        if not mr:
            return None
        return MatchResponseDTO(
            match_id=mr.id,
            investor_profile_id=mr.investor_profile_id,
            resultados=[self._build_categoria_result(mr)],
            created_at=mr.created_at.isoformat(),
        )

    def request_reunion(
        self, match_id: uuid.UUID, dto: ReunionRequestDTO, user_id: uuid.UUID
    ) -> ReunionResponseDTO:
        candidato = self._session.get(MatchCandidato, dto.candidato_id)
        if not candidato:
            raise ValueError("candidato_not_found")

        mr = self._session.get(MatchResult, match_id)
        profile_id = mr.investor_profile_id if mr else candidato.match_result_id

        reunion = Reunion(
            investor_profile_id=profile_id,
            match_candidato_id=candidato.id,
            inversor_user_id=user_id,
            profesional_tipo=dto.categoria,
            profesional_id=candidato.candidato_ref_id,
            profesional_nombre=candidato.candidato_nombre,
            fecha_propuesta=dto.fecha_preferida,
            modalidad=dto.modalidad,
            agenda_previa=dto.agenda,
            creada_por=user_id,
            fase_roadmap="contratacion",
        )
        candidato.reunion_solicitada = True
        self._session.add(candidato)
        self._session.add(reunion)
        self._session.commit()
        self._session.refresh(reunion)

        return ReunionResponseDTO(
            reunion_id=reunion.id,
            estado=reunion.estado,
            candidato_id=candidato.id,
            modalidad=reunion.modalidad,
            fecha_propuesta=reunion.fecha_propuesta.isoformat(),
            ledger_event_id=None,
            mensaje="Reunión solicitada. El candidato recibirá notificación por email.",
        )

    def _create_match_for_category(self, profile: InvestorProfile, categoria: str) -> MatchResult:
        candidatos_data = self._fetch_candidates(profile, categoria)
        if not candidatos_data:
            candidatos_data = self._demo_candidates(categoria)

        scores = [c["score"] for c in candidatos_data]
        promedio = sum(scores) / len(scores) if scores else Decimal("0.75")

        mr = MatchResult(
            investor_profile_id=profile.id,
            categoria=categoria,
            score_promedio=Decimal(str(round(promedio, 4))),
            justificacion_agente=(
                f"Match generado para sector {profile.sector} "
                f"con prioridad en {categoria.replace('_', ' ')}."
            ),
        )
        self._session.add(mr)
        self._session.commit()
        self._session.refresh(mr)

        for rank, c in enumerate(candidatos_data[:5], start=1):
            mc = MatchCandidato(
                match_result_id=mr.id,
                ranking=rank,
                candidato_ref_id=c.get("ref_id"),
                candidato_nombre=c["nombre"],
                candidato_org=c.get("org"),
                score_compatibilidad=Decimal(str(c["score"])),
                especialidad_principal=c.get("especialidad"),
                idiomas=c.get("idiomas", ["es"]),
                disponibilidad=c.get("disponibilidad", "disponible"),
                validacion_institucional=c.get("validacion", "vigente"),
                justificacion=c.get("justificacion", "Compatibilidad alta con el perfil del inversor."),
            )
            self._session.add(mc)
        self._session.commit()
        self._session.refresh(mr)
        return mr

    def _fetch_candidates(self, profile: InvestorProfile, categoria: str) -> list[dict]:
        if categoria == "ingeniero_cip":
            rows = self._session.exec(
                select(EngineerCIP)
                .where(EngineerCIP.marketplace_visible.is_(True))
                .where(EngineerCIP.habilitacion_vigente.is_(True))
                .limit(5)
            ).all()
            return [
                {
                    "ref_id": r.id,
                    "nombre": r.nombre_completo,
                    "org": "CIP Lima",
                    "score": float(r.rating_promedio or 4.5) / 5,
                    "especialidad": r.especialidad_principal,
                    "idiomas": list(r.idiomas or ["es"]),
                    "disponibilidad": r.disponibilidad,
                    "validacion": "vigente" if r.habilitacion_vigente else "requiere_verificacion",
                }
                for r in rows
            ]
        if categoria == "abogado_cal":
            rows = self._session.exec(
                select(LawyerCAL)
                .where(LawyerCAL.marketplace_visible.is_(True))
                .where(LawyerCAL.habilitacion_vigente.is_(True))
                .limit(5)
            ).all()
            return [
                {
                    "ref_id": r.id,
                    "nombre": r.nombre_completo,
                    "org": "CAL Lima",
                    "score": float(r.rating_promedio or 4.7) / 5,
                    "especialidad": r.especializacion_principal,
                    "idiomas": list(r.idiomas or ["es"]),
                    "disponibilidad": r.disponibilidad,
                    "validacion": "vigente",
                }
                for r in rows
            ]
        rows = self._session.exec(
            select(Company)
            .where(Company.marketplace_visible.is_(True))
            .where(Company.condicion_contribuyente == "HABIDO")
            .order_by(Company.trust_score.desc().nullslast())
            .limit(5)
        ).all()
        return [
            {
                "ref_id": None,
                "nombre": r.razon_social,
                "org": r.ruc,
                "score": float(r.trust_score or 0.75),
                "especialidad": r.sector_interno,
                "idiomas": ["es"],
                "disponibilidad": "disponible",
                "validacion": "vigente",
            }
            for r in rows
        ]

    @staticmethod
    def _demo_candidates(categoria: str) -> list[dict]:
        demos = {
            "ingeniero_cip": [
                {
                    "nombre": "Ing. Carlos Ramírez Torres",
                    "org": "CIP-058423",
                    "score": 0.91,
                    "especialidad": "Ingeniería Mecánica Industrial",
                    "idiomas": ["es", "en"],
                },
            ],
            "abogado_cal": [
                {
                    "nombre": "Dra. Ana Huapaya Flores",
                    "org": "CAL-12847",
                    "score": 0.88,
                    "especialidad": "Ley ZEEP N° 32449",
                    "idiomas": ["es", "en", "zh"],
                },
            ],
            "proveedor_local": [
                {
                    "nombre": "Transportes Lima Norte SAC",
                    "org": "20512345678",
                    "score": 0.85,
                    "especialidad": "logistica",
                    "idiomas": ["es"],
                },
            ],
        }
        return demos.get(categoria, demos["proveedor_local"])

    def _build_categoria_result(self, mr: MatchResult) -> MatchCategoriaResultDTO:
        candidatos = self._session.exec(
            select(MatchCandidato)
            .where(MatchCandidato.match_result_id == mr.id)
            .order_by(MatchCandidato.ranking)
        ).all()
        return MatchCategoriaResultDTO(
            categoria=mr.categoria,
            score_promedio=float(mr.score_promedio),
            justificacion_agente=mr.justificacion_agente or "",
            candidatos=[
                MatchCandidatoDTO(
                    candidato_id=c.id,
                    nombre=c.candidato_nombre,
                    numero_cip=c.candidato_org if mr.categoria == "ingeniero_cip" else None,
                    numero_cal=c.candidato_org if mr.categoria == "abogado_cal" else None,
                    score_compatibilidad=float(c.score_compatibilidad),
                    especialidad_principal=c.especialidad_principal,
                    disponibilidad=c.disponibilidad,
                    idiomas=list(c.idiomas or []),
                    validacion_institucional=c.validacion_institucional,
                    justificacion=c.justificacion,
                )
                for c in candidatos
            ],
        )
