from __future__ import annotations
import uuid
from decimal import Decimal
from typing import Optional, Any
from datetime import datetime
from sqlmodel import Session

from ..domain.entities import InvestorProfile, DocumentoAdjunto
from .dtos import OnboardingCreateDTO, OnboardingUpdateDTO
from src.modules.ledger.application.ledger_service import LedgerService
from src.modules.ledger.application.dtos import LedgerEventCreateDTO
from src.modules.zeep_simulation.application.simulation_service import SimulationService
from src.modules.zeep_simulation.application.dtos import SimulationRequestDTO
from src.modules.identity.domain.user_profile import UserProfile
from src.shared.domain.exceptions import DomainException


class OnboardingService:
    def __init__(self, session: Session):
        self.session = session

    @staticmethod
    def _default_roadmap() -> list:
        return [
            {"fase": "elegibilidad", "estado": "completado", "dias_estimados": 0, "hitos": ["Simulación GANCHO"]},
            {"fase": "validacion_legal", "estado": "en_progreso", "dias_estimados": 5, "hitos_pendientes": ["Validación CIP"]},
            {"fase": "contratacion", "estado": "pendiente", "dias_estimados": 7},
            {"fase": "operacion", "estado": "pendiente", "dias_estimados": 3},
        ]

    def _ensure_simulation_session(
        self, dto: OnboardingCreateDTO, user_id: uuid.UUID, pais_origen: str
    ) -> None:
        """Crea registro de simulación si el inversor llegó sin pasar por /simulation."""
        sim_svc = SimulationService(self.session)
        if sim_svc.get_by_session(dto.session_id):
            return

        sector = dto.sector if dto.sector in ("manufactura", "ckd", "tech") else "manufactura"
        variables: dict[str, Any] = {
            "tipo_proceso": "continuo",
            "requiere_anexo_4": False,
            "va_estimado_pct": 35,
            "tipo_impacto_ambiental": "medio",
        }
        if sector == "ckd":
            variables = {
                "producto_ensamblado": "vehiculo_comercial",
                "ratio_ckd_importado": 40,
                "mercado_destino": "regional",
                "certificaciones": [],
            }
        elif sector == "tech":
            variables = {
                "tipo_servicio": "software",
                "pct_servicios_exportables": 50,
                "requiere_datacenter": False,
                "ratio_empleos_tech": 0.6,
            }

        monto = dto.proyecto_monto_usd if dto.proyecto_monto_usd and dto.proyecto_monto_usd > 0 else Decimal("1000000")
        pais = pais_origen or "PE"

        sim_svc.calculate(
            SimulationRequestDTO(
                session_id=dto.session_id,
                sector=sector,
                monto_inversion_usd=monto,
                empleo_directo=dto.proyecto_empleo_directo,
                empleo_indirecto=dto.proyecto_empleo_indirecto,
                porcentaje_cl=dto.proyecto_porcentaje_cl,
                tiempo_instalacion_meses=18,
                pais_origen=pais,
                exportacion_pct=dto.proyecto_exportacion_pct or Decimal("0"),
                variables_sector=variables,
            ),
            user_id=user_id,
        )

    def _load_inversor_profile(self, user_id: uuid.UUID) -> UserProfile:
        up = self.session.get(UserProfile, user_id)
        if not up or up.profile_type != "empresa_inversora":
            raise DomainException(
                title="Forbidden",
                detail="El onboarding ZEEP es exclusivo para empresas inversoras.",
                status_code=403,
            )
        if not up.razon_social or not up.pais_origen:
            raise DomainException(
                title="Perfil incompleto",
                detail="Complete razón social y país de origen en su perfil de empresa.",
                status_code=422,
            )
        return up

    def create_profile(self, dto: OnboardingCreateDTO, user_id: uuid.UUID) -> InvestorProfile:
        user_profile = self._load_inversor_profile(user_id)

        self._ensure_simulation_session(dto, user_id, user_profile.pais_origen or "PE")
        monto = dto.proyecto_monto_usd if dto.proyecto_monto_usd and dto.proyecto_monto_usd > 0 else Decimal("0")

        rep_parts = (user_profile.rep_legal_nombre_pasaporte or "").split("|", 1)
        rep_nombre = rep_parts[0].strip() if rep_parts else None
        rep_doc = rep_parts[1].strip() if len(rep_parts) > 1 else None

        roadmap = self._default_roadmap()
        profile = InvestorProfile(
            session_id=dto.session_id,
            user_id=user_id,
            roadmap=roadmap,
            empresa_razon_social=user_profile.razon_social,
            empresa_pais_origen=user_profile.pais_origen,
            empresa_registro_extranjero=user_profile.tax_id_internacional,
            rep_nombre=rep_nombre,
            rep_documento_tipo="pasaporte" if rep_doc else None,
            rep_documento_num=rep_doc,
            proyecto_nombre=dto.proyecto_nombre,
            proyecto_descripcion=dto.proyecto_descripcion,
            proyecto_monto_usd=monto,
            proyecto_empleo_directo=dto.proyecto_empleo_directo,
            proyecto_empleo_indirecto=dto.proyecto_empleo_indirecto,
            proyecto_porcentaje_cl=dto.proyecto_porcentaje_cl,
            proyecto_exportacion_pct=dto.proyecto_exportacion_pct,
            proyecto_documento_pdf_url=dto.documento_perfil_url,
            sector=dto.sector,
            perfil_tecnico={
                "area_terreno_m2": float(dto.proyecto_area_terreno_m2)
                if dto.proyecto_area_terreno_m2
                else None,
                "teus_estimados": dto.proyecto_teus_estimados,
                "documento_perfil_url": dto.documento_perfil_url,
            },
        )
        self.session.add(profile)
        self.session.commit()
        self.session.refresh(profile)

        LedgerService(self.session).append(
            LedgerEventCreateDTO(
                investor_profile_id=profile.id,
                event_type="PERFIL_CREADO",
                payload={"sector": profile.sector, "empresa": profile.empresa_razon_social},
                actor_id=user_id,
                actor_type="inversor",
            )
        )

        try:
            from src.modules.projects.application.service import ProjectService

            active = ProjectService(self.session).get_active(user_id)
            if active:
                ProjectService(self.session).link_profile(
                    active.id, user_id, profile.id, dto.session_id
                )
            else:
                from src.modules.projects.application.dtos import ProjectCreateDTO

                created = ProjectService(self.session).create(
                    ProjectCreateDTO(
                        nombre=dto.proyecto_nombre,
                        sector=dto.sector,
                        monto_usd=monto if monto > 0 else Decimal("1000000"),
                        empleo_directo=dto.proyecto_empleo_directo,
                        empleo_indirecto=dto.proyecto_empleo_indirecto or 0,
                        porcentaje_cl=dto.proyecto_porcentaje_cl,
                        exportacion_pct=dto.proyecto_exportacion_pct,
                        pais_origen_capital=user_profile.pais_origen,
                        empresa_razon_social=user_profile.razon_social,
                        descripcion=dto.proyecto_descripcion,
                    ),
                    user_id,
                )
                ProjectService(self.session).link_profile(
                    created.id, user_id, profile.id, dto.session_id
                )
                if dto.documento_perfil_url:
                    ProjectService(self.session).set_document_url(
                        created.id, user_id, dto.documento_perfil_url
                    )
        except Exception:
            pass  # migración 002 pendiente en entornos sin investment_projects

        return profile

    def get_profile(self, profile_id: uuid.UUID) -> Optional[InvestorProfile]:
        return self.session.get(InvestorProfile, profile_id)

    def update_profile(self, profile_id: uuid.UUID, dto: OnboardingUpdateDTO) -> Optional[InvestorProfile]:
        profile = self.session.get(InvestorProfile, profile_id)
        if not profile:
            return None

        for field, value in dto.model_dump(exclude_none=True).items():
            setattr(profile, field, value)

        profile.updated_at = datetime.utcnow()
        self.session.add(profile)
        self.session.commit()
        self.session.refresh(profile)
        return profile

    def _sync_documento_pdf_url(self, profile_id: uuid.UUID, url: str) -> None:
        """Propaga la URL del PDF al perfil inversor y al proyecto vinculado."""
        profile = self.session.get(InvestorProfile, profile_id)
        if not profile:
            return
        profile.proyecto_documento_pdf_url = url
        tech = dict(profile.perfil_tecnico or {})
        tech["documento_perfil_url"] = url
        profile.perfil_tecnico = tech
        profile.updated_at = datetime.utcnow()
        self.session.add(profile)

        try:
            from src.modules.projects.domain.entities import InvestmentProject
            from sqlmodel import select

            projects = self.session.exec(
                select(InvestmentProject).where(
                    InvestmentProject.investor_profile_id == profile_id
                )
            ).all()
            for proj in projects:
                proj.documento_perfil_url = url
                proj.updated_at = datetime.utcnow()
                self.session.add(proj)
        except Exception:
            pass

    def attach_document(
        self,
        profile_id: uuid.UUID,
        tipo: str,
        nombre_archivo: str,
        url_storage: str,
        size_bytes: int,
        mime_type: str,
        hash_sha256: str,
        user_id: uuid.UUID,
    ) -> DocumentoAdjunto:
        doc = DocumentoAdjunto(
            investor_profile_id=profile_id,
            tipo=tipo,
            nombre_archivo=nombre_archivo,
            url_storage=url_storage,
            size_bytes=size_bytes,
            mime_type=mime_type,
            hash_sha256=hash_sha256,
            subido_por=user_id,
        )
        self.session.add(doc)
        if tipo in ("perfil_proyecto", "perfil_proyecto_pdf"):
            self._sync_documento_pdf_url(profile_id, url_storage)
        self.session.commit()
        self.session.refresh(doc)

        LedgerService(self.session).append(
            LedgerEventCreateDTO(
                investor_profile_id=profile_id,
                event_type="DOCUMENTO_ADJUNTADO",
                payload={"documento_id": str(doc.id), "tipo": tipo},
                actor_id=user_id,
                actor_type="inversor",
            )
        )
        return doc

    def get_documents(self, profile_id: uuid.UUID) -> list[DocumentoAdjunto]:
        from sqlmodel import select

        return self.session.exec(
            select(DocumentoAdjunto).where(DocumentoAdjunto.investor_profile_id == profile_id)
        ).all()

    def get_roadmap_detail(self, profile_id: uuid.UUID) -> dict:
        profile = self.session.get(InvestorProfile, profile_id)
        if not profile:
            return {}
        docs = self.get_documents(profile_id)
        pendientes = []
        if not any(d.tipo == "evaluacion_ambiental" for d in docs):
            pendientes.append("evaluacion_ambiental")
        dias = sum(f.get("dias_estimados", 0) for f in profile.roadmap or [])
        return {
            "profile_id": str(profile_id),
            "fases": profile.roadmap or self._default_roadmap(),
            "dias_totales_estimados": dias,
            "documentos_pendientes": pendientes,
        }
