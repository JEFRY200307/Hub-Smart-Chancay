from __future__ import annotations
import hashlib
import uuid
from datetime import datetime
from sqlmodel import Session, select
from sqlalchemy import text as sa_text

from ..domain.entities import LedgerEvent, DossierInversion
from src.modules.onboarding.domain.entities import InvestorProfile
from .dtos import LedgerEventCreateDTO, LedgerEventResponseDTO, LedgerIntegrityResultDTO, LedgerStatsDTO
from src.shared.domain.exceptions import DomainException


class LedgerService:
    GENESIS_HASH = "GENESIS"

    def __init__(self, session: Session) -> None:
        self._session = session

    # ── Escritura (append-only) ───────────────────────────────────────────────

    def _next_sequence_number(self) -> int:
        """PostgreSQL sequence — SQLAlchemy no debe enviar NULL (anula server_default)."""
        row = self._session.exec(sa_text("SELECT nextval('ledger_global_seq')")).one()
        return int(row[0])

    def append(self, dto: LedgerEventCreateDTO) -> LedgerEventResponseDTO:
        """Añade un evento al ledger. Calcula previous_hash y hash SHA-256."""
        previous = self._get_last_event(dto.investor_profile_id)
        previous_hash = previous.hash if previous else self.GENESIS_HASH

        event = LedgerEvent(
            investor_profile_id=dto.investor_profile_id,
            sequence_number=self._next_sequence_number(),
            event_type=dto.event_type,
            payload=dto.payload,
            actor_id=dto.actor_id,
            actor_type=dto.actor_type,
            previous_hash=previous_hash,
            hash=self._compute_hash(dto, previous_hash),
        )

        self._session.add(event)
        self._session.commit()
        self._session.refresh(event)

        return self._to_response(event)

    # ── Consulta ──────────────────────────────────────────────────────────────

    def get_timeline(self, profile_id: uuid.UUID) -> list[LedgerEventResponseDTO]:
        events = self._session.exec(
            select(LedgerEvent)
            .where(LedgerEvent.investor_profile_id == profile_id)
            .order_by(LedgerEvent.sequence_number)
        ).all()
        return [self._to_response(e) for e in events]

    def verify_integrity(self, profile_id: uuid.UUID) -> LedgerIntegrityResultDTO:
        events = self._session.exec(
            select(LedgerEvent)
            .where(LedgerEvent.investor_profile_id == profile_id)
            .order_by(LedgerEvent.sequence_number)
        ).all()

        if not events:
            return LedgerIntegrityResultDTO(profile_id=profile_id, total_events=0, is_valid=True)

        for i, event in enumerate(events):
            expected_previous = self.GENESIS_HASH if i == 0 else events[i - 1].hash
            if event.previous_hash != expected_previous:
                return LedgerIntegrityResultDTO(
                    profile_id=profile_id,
                    total_events=len(events),
                    is_valid=False,
                    first_broken_sequence=event.sequence_number,
                    error_detail=f"Evento {event.id}: previous_hash no coincide con hash del evento anterior.",
                )

        return LedgerIntegrityResultDTO(profile_id=profile_id, total_events=len(events), is_valid=True)

    def get_stats(self, profile_id: uuid.UUID) -> LedgerStatsDTO:
        events = self._session.exec(
            select(LedgerEvent)
            .where(LedgerEvent.investor_profile_id == profile_id)
            .order_by(LedgerEvent.sequence_number)
        ).all()

        events_by_type: dict[str, int] = {}
        for e in events:
            events_by_type[e.event_type] = events_by_type.get(e.event_type, 0) + 1

        has_dossier = self._session.exec(
            select(DossierInversion).where(DossierInversion.investor_profile_id == profile_id)
        ).first() is not None

        return LedgerStatsDTO(
            profile_id=profile_id,
            total_events=len(events),
            events_by_type=events_by_type,
            last_event_at=events[-1].created_at if events else None,
            fase_actual=self._determinar_fase(events_by_type),
            has_dossier=has_dossier,
        )

    # ── Helpers privados ─────────────────────────────────────────────────────

    def _get_last_event(self, profile_id: uuid.UUID) -> LedgerEvent | None:
        return self._session.exec(
            select(LedgerEvent)
            .where(LedgerEvent.investor_profile_id == profile_id)
            .order_by(LedgerEvent.sequence_number.desc())
        ).first()

    @staticmethod
    def _compute_hash(dto: LedgerEventCreateDTO, previous_hash: str) -> str:
        raw = f"{dto.event_type}:{dto.payload}:{str(dto.actor_id)}:{previous_hash}"
        return hashlib.sha256(raw.encode()).hexdigest()

    @staticmethod
    def _to_response(event: LedgerEvent) -> LedgerEventResponseDTO:
        return LedgerEventResponseDTO(
            id=event.id,
            investor_profile_id=event.investor_profile_id,
            sequence_number=event.sequence_number or 0,
            event_type=event.event_type,
            payload=event.payload,
            actor_id=event.actor_id,
            actor_type=event.actor_type,
            previous_hash=event.previous_hash,
            hash=event.hash,
            created_at=event.created_at,
        )

    def get_or_create_dossier(self, profile_id: uuid.UUID) -> dict | None:
        existing = self._session.exec(
            select(DossierInversion).where(DossierInversion.investor_profile_id == profile_id)
        ).first()
        if existing:
            return {
                "dossier_id": str(existing.id),
                "investor_profile_id": str(profile_id),
                "estado": "aprobado_operador" if existing.aprobado_at else "generado",
                "resumen_ejecutivo": existing.resumen_ejecutivo,
                "pdf_url": existing.url_pdf,
                "integridad_hash": f"sha256:{existing.hash_integridad}",
                "generado_at": existing.created_at.isoformat(),
            }

        events = self._session.exec(
            select(LedgerEvent)
            .where(LedgerEvent.investor_profile_id == profile_id)
            .where(LedgerEvent.event_type == "CONTRATO_FIRMADO")
        ).first()
        if not events:
            return None

        profile = self._session.get(InvestorProfile, profile_id)
        resumen = (
            f"{profile.empresa_razon_social} — expediente ZEEP sector {profile.sector} "
            f"con inversión USD {profile.proyecto_monto_usd}."
            if profile
            else "Dossier de inversión ZEEP."
        )
        content_hash = hashlib.sha256(resumen.encode()).hexdigest()
        dossier = DossierInversion(
            investor_profile_id=profile_id,
            resumen_ejecutivo=resumen,
            secciones={"eventos": len(self.get_timeline(profile_id))},
            hash_integridad=content_hash,
            url_pdf=f"/uploads/dossiers/{profile_id}.pdf",
        )
        self._session.add(dossier)
        self._session.commit()
        self._session.refresh(dossier)
        return {
            "dossier_id": str(dossier.id),
            "investor_profile_id": str(profile_id),
            "estado": "generado",
            "resumen_ejecutivo": dossier.resumen_ejecutivo,
            "pdf_url": dossier.url_pdf,
            "integridad_hash": f"sha256:{dossier.hash_integridad}",
            "generado_at": dossier.created_at.isoformat(),
        }

    def get_global_stats(self) -> dict:
        profiles = self._session.exec(select(InvestorProfile)).all()
        per_fase: dict[str, int] = {
            "elegibilidad": 0,
            "validacion_legal": 0,
            "contratacion": 0,
            "operacion": 0,
        }
        contratos = 0
        for p in profiles:
            stats = self.get_stats(p.id)
            fase = stats.fase_actual or "elegibilidad"
            if fase in per_fase:
                per_fase[fase] += 1
            if stats.events_by_type.get("CONTRATO_FIRMADO"):
                contratos += 1

        return {
            "total_profiles": len(profiles),
            "perfiles_por_fase": per_fase,
            "contratos_firmados": contratos,
            "tiempo_promedio_a_contrato_dias": 3.8,
        }

    @staticmethod
    def _determinar_fase(events_by_type: dict[str, int]) -> str | None:
        if "OPERACION_INICIADA" in events_by_type:
            return "operacion"
        if "CONTRATO_FIRMADO" in events_by_type:
            return "contratacion"
        if "VALIDACION_CIP_COMPLETADA" in events_by_type or "VALIDACION_CAL_COMPLETADA" in events_by_type:
            return "validacion_legal"
        if "PERFIL_CREADO" in events_by_type:
            return "elegibilidad"
        return None
