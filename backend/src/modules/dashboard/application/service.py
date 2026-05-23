from __future__ import annotations

import uuid

from sqlmodel import Session

from src.modules.projects.application.service import ProjectService
from src.modules.projects.domain.entities import InvestmentProject
from src.modules.onboarding.domain.entities import InvestorProfile
from src.modules.zeep_simulation.domain.entities import SimulationRecord
from src.modules.ledger.application.ledger_service import LedgerService
from src.modules.identity.domain.entities import User


class DashboardService:
    def __init__(self, session: Session) -> None:
        self._session = session

    def summary(self, user: User) -> dict:
        project_svc = ProjectService(self._session)
        active = project_svc.get_active(user.id)
        portfolio = project_svc.list_for_user(user.id)

        simulation = None
        ledger = None
        roadmap: list[dict] = []
        profile: InvestorProfile | None = None

        if active and active.investor_profile_id:
            profile = self._session.get(InvestorProfile, active.investor_profile_id)
            ledger = LedgerService(self._session).get_stats(active.investor_profile_id)
            roadmap = list(profile.roadmap) if profile and profile.roadmap else self._default_roadmap(ledger)

        session_id = active.session_id if active else None
        if session_id:
            sim = self._session.get(SimulationRecord, session_id)
            if sim:
                simulation = {
                    "session_id": str(sim.session_id),
                    "v_final": float(sim.v_final) if sim.v_final is not None else None,
                    "clasificacion": sim.clasificacion,
                }

        if not roadmap:
            roadmap = self._default_roadmap(ledger)

        return {
            "user": {
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role,
            },
            "active_project": self._project_summary(active) if active else None,
            "portfolio_count": len(portfolio),
            "simulation": simulation,
            "ledger": {
                "fase_actual": ledger.fase_actual if ledger else None,
                "total_events": ledger.total_events if ledger else 0,
                "has_dossier": ledger.has_dossier if ledger else False,
            }
            if ledger
            else {"fase_actual": None, "total_events": 0, "has_dossier": False},
            "roadmap": roadmap,
            "quick_actions": self._quick_actions(active, profile),
        }

    @staticmethod
    def _project_summary(p: InvestmentProject | None) -> dict | None:
        if not p:
            return None
        return {
            "id": str(p.id),
            "codigo": p.codigo,
            "nombre": p.nombre,
            "sector": p.sector,
            "estado": p.estado,
            "investor_profile_id": str(p.investor_profile_id) if p.investor_profile_id else None,
            "monto_usd": float(p.monto_usd),
        }

    @staticmethod
    def _default_roadmap(ledger) -> list[dict]:
        fase = ledger.fase_actual if ledger else "elegibilidad"
        phases = ["elegibilidad", "validacion_legal", "contratacion", "operacion"]
        idx = phases.index(fase) if fase in phases else 0
        out = []
        for i, ph in enumerate(phases):
            if i < idx:
                estado = "completado"
            elif i == idx:
                estado = "en_progreso"
            else:
                estado = "pendiente"
            out.append({"fase": ph, "estado": estado})
        return out

    @staticmethod
    def _quick_actions(active: InvestmentProject | None, profile: InvestorProfile | None) -> list[dict]:
        actions = []
        if not active:
            actions.append({"label": "Crear proyecto", "href": "/onboarding"})
            return actions
        if not profile:
            actions.append({"label": "Completar onboarding", "href": "/onboarding"})
        else:
            actions.append({"label": "Ejecutar match", "href": "/dashboard/matchmaking"})
            actions.append({"label": "Legal AI", "href": "/legal-ai"})
        actions.append({"label": "Marketplace", "href": "/services"})
        actions.append({"label": "Portafolio", "href": "/dashboard/portfolio"})
        return actions
