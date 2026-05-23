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
        self, dto: OnboardingCreateDTO, user_id: uuid.UUID
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

        sim_svc.calculate(
            SimulationRequestDTO(
                session_id=dto.session_id,
                sector=sector,
                monto_inversion_usd=dto.proyecto_monto_usd,
                empleo_directo=dto.proyecto_empleo_directo,
                empleo_indirecto=dto.proyecto_empleo_indirecto,
                porcentaje_cl=dto.proyecto_porcentaje_cl,
                tiempo_instalacion_meses=18,
                pais_origen=dto.empresa_pais_origen,
                exportacion_pct=dto.proyecto_exportacion_pct or Decimal("0"),
                variables_sector=variables,
            ),
            user_id=user_id,
        )

    def create_profile(self, dto: OnboardingCreateDTO, user_id: uuid.UUID) -> InvestorProfile:
        self._ensure_simulation_session(dto, user_id)
        roadmap = self._default_roadmap()
        profile = InvestorProfile(
            session_id=dto.session_id,
            user_id=user_id,
            roadmap=roadmap,
            empresa_razon_social=dto.empresa_razon_social,
            empresa_pais_origen=dto.empresa_pais_origen,
            empresa_registro_extranjero=dto.empresa_registro_extranjero,
            empresa_sector_ciiu=dto.empresa_sector_ciiu,
            empresa_capital_usd=dto.empresa_capital_usd,
            rep_nombre=dto.rep_nombre,
            rep_documento_tipo=dto.rep_documento_tipo,
            rep_documento_num=dto.rep_documento_num,
            rep_cargo=dto.rep_cargo,
            proyecto_nombre=dto.proyecto_nombre,
            proyecto_descripcion=dto.proyecto_descripcion,
            proyecto_monto_usd=dto.proyecto_monto_usd,
            proyecto_empleo_directo=dto.proyecto_empleo_directo,
            proyecto_empleo_indirecto=dto.proyecto_empleo_indirecto,
            proyecto_porcentaje_cl=dto.proyecto_porcentaje_cl,
            proyecto_duracion_meses=dto.proyecto_duracion_meses,
            proyecto_exportacion_pct=dto.proyecto_exportacion_pct,
            sector=dto.sector,
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
                        monto_usd=dto.proyecto_monto_usd,
                        empleo_directo=dto.proyecto_empleo_directo,
                        empleo_indirecto=dto.proyecto_empleo_indirecto or 0,
                        porcentaje_cl=dto.proyecto_porcentaje_cl,
                        exportacion_pct=dto.proyecto_exportacion_pct,
                        pais_origen_capital=dto.empresa_pais_origen,
                        empresa_razon_social=dto.empresa_razon_social,
                        descripcion=dto.proyecto_descripcion,
                    ),
                    user_id,
                )
                ProjectService(self.session).link_profile(
                    created.id, user_id, profile.id, dto.session_id
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
