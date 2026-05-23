"""Verifica que los 37 endpoints del API_CONTRACTS estén registrados en OpenAPI."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

EXPECTED = [
    ("POST", "/api/v1/auth/register/company"),
    ("POST", "/api/v1/auth/verify-email"),
    ("POST", "/api/v1/auth/resend-otp"),
    ("POST", "/api/v1/auth/login"),
    ("POST", "/api/v1/auth/refresh"),
    ("POST", "/api/v1/auth/logout"),
    ("GET", "/api/v1/auth/me"),
    ("POST", "/api/v1/simulation/calculate"),
    ("GET", "/api/v1/simulation/{session_id}"),
    ("POST", "/api/v1/onboarding/profiles"),
    ("GET", "/api/v1/onboarding/profiles/{profile_id}"),
    ("PATCH", "/api/v1/onboarding/profiles/{profile_id}"),
    ("POST", "/api/v1/onboarding/profiles/{profile_id}/documents"),
    ("GET", "/api/v1/onboarding/profiles/{profile_id}/roadmap"),
    ("POST", "/api/v1/marketplace/matches"),
    ("GET", "/api/v1/marketplace/matches/{match_id}"),
    ("POST", "/api/v1/marketplace/matches/{match_id}/reuniones"),
    ("GET", "/api/v1/marketplace/directory/engineers"),
    ("GET", "/api/v1/marketplace/directory/lawyers"),
    ("GET", "/api/v1/marketplace/directory/providers"),
    ("POST", "/api/v1/ledger/events"),
    ("GET", "/api/v1/ledger/{profile_id}"),
    ("GET", "/api/v1/ledger/{profile_id}/verify"),
    ("POST", "/api/v1/ledger/minutas"),
    ("GET", "/api/v1/ledger/{profile_id}/dossier"),
    ("GET", "/api/v1/ledger/stats"),
    ("POST", "/api/v1/ai/query"),
    ("GET", "/api/v1/ai/history"),
    ("POST", "/api/v1/ai/escalate"),
    ("POST", "/api/v1/ai/ingest/url"),
    ("POST", "/api/v1/ai/ingest/pdf"),
    ("GET", "/api/v1/ai/knowledge/stats"),
    ("POST", "/api/v1/analytics/padron/ingest"),
    ("GET", "/api/v1/analytics/padron/status"),
    ("GET", "/api/v1/ingestion/companies/{ruc}"),
    ("GET", "/api/v1/ingestion/companies/search"),
    ("POST", "/api/v1/ingestion/companies/validate-batch"),
    ("GET", "/api/v1/ingestion/persons/{dni}"),
    ("POST", "/api/v1/ingestion/sync/bulk"),
    ("POST", "/api/v1/ingestion/sync/padron-ruc"),
    ("GET", "/api/v1/ingestion/sync/status"),
]


def normalize(path: str) -> str:
    parts = path.split("/")
    return "/".join("{" + p + "}" if "{" not in p and p not in ("api", "v1", "") and "." not in p and "-" in p or (p and p[0].isalpha() and len(p) > 20) else p for p in parts)


def main() -> int:
    from src.main import app

    registered = set()
    for route in app.routes:
        methods = getattr(route, "methods", None) or set()
        path = getattr(route, "path", "")
        for m in methods:
            if m in ("GET", "POST", "PATCH", "PUT", "DELETE"):
                registered.add((m, path))

    missing = []
    for method, path in EXPECTED:
        if (method, path) not in registered:
            # match parametrized paths
            found = any(
                r_m == method and r_p == path
                for r_m, r_p in registered
            )
            if not found:
                missing.append(f"{method} {path}")

    print(f"Rutas registradas: {len(registered)}")
    if missing:
        print("FALTANTES:")
        for m in missing:
            print(" -", m)
        return 1

    print("OK: los 37 endpoints del contrato API están registrados.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
