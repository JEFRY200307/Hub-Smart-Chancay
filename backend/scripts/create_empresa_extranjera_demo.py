#!/usr/bin/env python3
"""Crea o verifica la cuenta demo empresa extranjera vía API (requiere API en marcha)."""
from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request

API = os.getenv("API_BASE", "http://localhost:8000/api/v1").rstrip("/")

DEMO = {
    "email": "extranjera.cn@comex-ai.test",
    "password": "ComexExtranjera2025!",
    "full_name": "Li Wei Zhang — Shanghai Pacific Logistics Holdings",
    "preferred_lang": "zh",
}

PROFILE_ID = "c3333333-3333-4333-8333-333333333301"
SESSION_ID = "b2222222-2222-4222-8222-222222222201"


def post(path: str, body: dict, token: str | None = None) -> dict:
    req = urllib.request.Request(
        f"{API}{path}",
        data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json", **({"Authorization": f"Bearer {token}"} if token else {})},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read())


def main() -> int:
    print("API:", API)
    print("\n--- Credenciales demo empresa extranjera ---")
    print(f"Email:    {DEMO['email']}")
    print(f"Password: {DEMO['password']}")
    print(f"Profile:  {PROFILE_ID}")
    print(f"Session:  {SESSION_ID}")
    print("\nSi el login falla, ejecute en Supabase: scripts/seed_empresa_extranjera_demo.sql\n")

    try:
        data = post("/auth/register", DEMO)
        print("OK: cuenta creada vía /auth/register")
        print("user_id:", data.get("user_id"))
        token = data["access_token"]
    except urllib.error.HTTPError as e:
        if e.code == 409:
            data = post("/auth/login", {"email": DEMO["email"], "password": DEMO["password"]})
            print("OK: login con cuenta existente")
            token = data["access_token"]
        else:
            body = e.read().decode()
            print(f"Error {e.code}: {body}", file=sys.stderr)
            print("Use seed_empresa_extranjera_demo.sql en Supabase.", file=sys.stderr)
            return 1

    # Perfil solo si no existe en BD (SQL seed es la fuente de verdad)
    try:
        prof = post(
            "/onboarding/profiles",
            {
                "session_id": SESSION_ID,
                "empresa_razon_social": "Shanghai Pacific Logistics Holdings Ltd.",
                "empresa_pais_origen": "CN",
                "empresa_registro_extranjero": "91310000MA1FL2XXXX",
                "rep_nombre": "Li Wei Zhang",
                "rep_cargo": "Director de Inversión Internacional",
                "proyecto_nombre": "Planta de ensamblaje ZEEP Chancay",
                "proyecto_monto_usd": 12500000,
                "proyecto_empleo_directo": 280,
                "proyecto_empleo_indirecto": 150,
                "proyecto_porcentaje_cl": 42,
                "sector": "manufactura",
            },
            token=token,
        )
        print("Perfil creado:", prof.get("id"))
    except urllib.error.HTTPError as e:
        if e.code in (409, 422, 500):
            print("(Perfil: use SQL seed si session_id no existe en simulation_records)")
        else:
            print("Onboarding:", e.read().decode())

    print("\nFrontend (consola navegador tras login):")
    print(f"localStorage.setItem('hub_investor_profile_id', '{PROFILE_ID}');")
    print(f"localStorage.setItem('hub_simulation_session', '{SESSION_ID}');")
    return 0


if __name__ == "__main__":
    sys.exit(main())
