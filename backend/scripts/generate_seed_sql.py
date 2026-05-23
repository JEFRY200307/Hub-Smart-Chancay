"""Genera backend/scripts/seed_cip_cal_padron.sql para Supabase."""
from __future__ import annotations

import csv
import json
import re
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CSV_PATH = ROOT / "PadronRUC_202603.csv"
OUT_PATH = Path(__file__).resolve().parent / "seed_cip_cal_padron.sql"

ENGINEERS = [
    ("Carlos Fidel Ponce Sánchez", "Ingeniería Industrial", "Director Procurador Nacional del Colegio de Ingenieros del Perú", "CIP-LIM-0001", ["Doctorado UNI", "Gobierno corporativo CIP"], ["es", "en"]),
    ("Norman Jesús Beltrán Castañón", "Ingeniería Mecánica Eléctrica", "Director Tesorero del Consejo Nacional del CIP", "CIP-LIM-0002", ["Consejo Nacional CIP"], ["es"]),
    ("Carlos Manuel Burgos Montenegro", "Ingeniería Civil", "Vicedecano Nacional del CIP", "CIP-LIM-0003", ["Infraestructura", "ZEEP"], ["es", "en"]),
    ("Azucena Liliana Santa María Muro", "Ingeniería Civil", "Directora Secretaria Nacional del Colegio de Ingenieros", "CIP-LIM-0004", ["Gestión institucional"], ["es"]),
    ("Jorge Alva Hurtado", "Ingeniería Civil", "Consultor Principal en Ingeniería Geotécnica — ex Rector UNI", "CIP-LIM-0005", ["Geotecnia", "Puertos"], ["es", "en"]),
    ("Gustavo Luyo Velit", "Ingeniería de Minas / Civil", "Vicedecano del Consejo Departamental de Lima", "CIP-LIM-0006", ["Minería", "CIP Lima"], ["es"]),
    ("Luis Mendizábal Flores", "Ingeniería de Sistemas", "Lead Cloud Architect — egresado UNI", "CIP-LIM-0007", ["Cloud", "Software"], ["es", "en"]),
    ("Mariana Costa Checa", "Emprendimiento Tecnológico", "Fundadora de Laboratoria — referente Tech Lima", "CIP-LIM-0008", ["Software", "Innovación"], ["es", "en"]),
    ("César Gallegos Chávez", "Ingeniería Electrónica y Telecomunicaciones", "Gerente de Proyectos de Infraestructura y Conectividad", "CIP-LIM-0009", ["Telecom", "Infraestructura"], ["es"]),
    ("Diana Rojas Milla", "Ingeniería Ambiental", "Especialista en Evaluaciones de Impacto Ambiental — CIP Lima", "CIP-LIM-0010", ["EIA", "Sostenibilidad ZEEP"], ["es", "en"]),
]

LAWYERS = [
    ("Raúl Canelo Rabanal", "Derecho Civil y Procesal", "Decano en funciones del Ilustre Colegio de Abogados de Lima", "CAL-LIM-0001"),
    ("Francisco Miró Quesada Rada", "Derecho Constitucional", "Exdirector académico y constitucionalista CAL", "CAL-LIM-0002"),
    ("Aníbal Torres Vásquez", "Derecho Civil / Arbitraje", "Catedrático principal y miembro del CAL", "CAL-LIM-0003"),
    ("Beatriz Merino Lucero", "Derecho Corporativo", "Ex-defensora del Pueblo y asesora legal corporativa", "CAL-LIM-0004"),
    ("Enrique Ghersi Silva", "Derecho Económico", "Socio Principal en Ghersi Abogados (Lima)", "CAL-LIM-0005"),
    ("Walter Gutiérrez Camacho", "Derecho Civil y Contractual", "Ex-decano del Colegio de Abogados de Lima", "CAL-LIM-0006"),
    ("Marisol Pérez Tello", "Derecho de DD.HH.", "Ex-ministra de Justicia y miembro activo del CAL", "CAL-LIM-0007"),
    ("Alfredo Bullard González", "Arbitraje Internacional", "Socio fundador Bullard Falla Ezcurra +", "CAL-LIM-0008"),
    ("Delia Muñoz Muñoz", "Derecho Internacional", "Abogada procesalista y consultora senior", "CAL-LIM-0009"),
    ("César Nakazaki Servigón", "Derecho Penal", "Litigante en casos de alta complejidad penal económico", "CAL-LIM-0010"),
]


def esc(s: str) -> str:
    return s.replace("'", "''")


def map_sector(actividad: str) -> str:
    a = actividad.upper()
    if any(k in a for k in ("VEHICUL", "AUTOMOT", "CKD", "ENSAMBL")):
        return "ckd"
    if any(k in a for k in ("SOFTWARE", "TECNOLOG", "INFORM", "DATOS", "TELECOM")):
        return "tech"
    if any(k in a for k in ("FABRIC", "MANUFACT", "INDUSTRI", "METAL", "QUIMIC")):
        return "manufactura"
    if any(k in a for k in ("TRANSPORT", "ALMACEN", "LOGIST", "CARGA")):
        return "logistica"
    return "otros"


def load_companies(limit: int = 50) -> list[dict]:
    rows: list[dict] = []
    with CSV_PATH.open(encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row.get("Estado") != "ACTIVO":
                continue
            if row.get("Condicion") != "HABIDO":
                continue
            tipo = (row.get("Tipo") or "").upper()
            if "JURIDICA" not in tipo and "SOCIEDAD" not in tipo:
                continue
            ruc = (row.get("RUC") or "").strip()
            if not re.fullmatch(r"\d{11}", ruc):
                continue
            act = (row.get("Actividad_Economica_CIIU_revision3_Principal") or "Actividad empresarial")[:200]
            rows.append(
                {
                    "ruc": ruc,
                    "razon_social": f"Contribuyente {ruc} — {act[:80]}",
                    "actividad": act,
                    "departamento": row.get("Departamento") or "LIMA",
                    "provincia": row.get("Provincia") or "LIMA",
                    "distrito": row.get("Distrito") or "LIMA",
                    "ubigeo": (row.get("UBIGEO") or "150101")[:6],
                    "sector": map_sector(act),
                }
            )
            if len(rows) >= limit:
                break
    return rows


def main() -> None:
    lines = [
        "-- Seed CIP Lima / CAL / PadronRUC (50 empresas desde PadronRUC_202603.csv)",
        "-- Ejecutar en Supabase SQL Editor (después de init-db.sql)",
        "-- fuente_empresa válido: padron_ruc (no usar padron_ruc_seed)",
        "BEGIN;",
        "",
        "DELETE FROM engineers_cip WHERE numero_cip LIKE 'CIP-LIM-%';",
        "DELETE FROM lawyers_cal WHERE numero_cal LIKE 'CAL-LIM-%';",
        "DELETE FROM companies WHERE fuente_principal = 'padron_ruc';",
        "",
    ]

    for nombre, esp, cargo, numero, tags, idiomas in ENGINEERS:
        eid = str(uuid.uuid4())
        cv = json.dumps({"cargo_linkedin": cargo, "institucion": "CIP Lima / UNI"}, ensure_ascii=False)
        esp_json = json.dumps(tags, ensure_ascii=False)
        idiomas_sql = "ARRAY[" + ",".join(f"'{i}'" for i in idiomas) + "]"
        lines.append(
            f"""INSERT INTO engineers_cip (
  id, numero_cip, nombre_completo, habilitacion_vigente, especialidad_principal,
  especialidades, experiencia_zeep, idiomas, marketplace_visible, validado_plataforma,
  rating_promedio, descripcion_publica, cv_data, region, ciudad, disponibilidad
) VALUES (
  '{eid}', '{numero}', '{esc(nombre)}', true, '{esc(esp)}',
  '{esc(esp_json)}'::jsonb, true, {idiomas_sql}, true, true,
  4.85, '{esc(cargo)}', '{esc(cv)}'::jsonb, 'LIMA', 'Lima', 'disponible'
) ON CONFLICT (numero_cip) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  descripcion_publica = EXCLUDED.descripcion_publica,
  marketplace_visible = true;"""
        )

    for nombre, esp, cargo, numero in LAWYERS:
        lid = str(uuid.uuid4())
        lines.append(
            f"""INSERT INTO lawyers_cal (
  id, numero_cal, nombre_completo, habilitacion_vigente, especializacion_principal,
  certificacion_zeep, idiomas, marketplace_visible, validado_plataforma,
  rating_promedio, descripcion_publica, cv_data, region, ciudad
) VALUES (
  '{lid}', '{numero}', '{esc(nombre)}', true, '{esc(esp)}',
  true, ARRAY['es','en'], true, true,
  4.80, '{esc(cargo)}', '{{"institucion": "CAL Lima"}}'::jsonb, 'LIMA', 'Lima'
) ON CONFLICT (numero_cal) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  descripcion_publica = EXCLUDED.descripcion_publica,
  marketplace_visible = true;"""
        )

    companies = load_companies(50)
    for c in companies:
        trust = round(0.55 + (int(c["ruc"][-2:]) % 40) / 100, 2)
        dist = round(15 + (int(c["ruc"][-3:]) % 80), 1)
        lines.append(
            f"""INSERT INTO companies (
  ruc, razon_social, estado_sunarp, condicion_contribuyente, estado_contribuyente,
  sector_interno, trust_score, capacidad_operativa, distancia_puerto_chancay_km,
  marketplace_visible, descripcion_publica, fuente_principal, ubigeo, servicios_principales
) VALUES (
  '{c["ruc"]}', '{esc(c["razon_social"])}', 'ACTIVA', 'HABIDO', 'ACTIVO',
  '{c["sector"]}', {trust}, 'media', {dist},
  true, '{esc(c["actividad"][:500])}', 'padron_ruc', '{c["ubigeo"]}',
  ARRAY['Servicios ZEEP', '{esc(c["sector"].title())}']
) ON CONFLICT (ruc) DO UPDATE SET
  razon_social = EXCLUDED.razon_social,
  marketplace_visible = true,
  last_padron_sync = CURRENT_DATE;"""
        )

    try:
        from passlib.context import CryptContext

        demo_hash = CryptContext(schemes=["bcrypt"], deprecated="auto").hash("HubChancay2025!")
    except Exception:
        demo_hash = "$2b$12$placeholder_use_register_endpoint"

    demo_id = str(uuid.uuid4())
    lines.extend(
        [
            "",
            f"""INSERT INTO users (id, email, hashed_password, role, full_name, is_active, is_verified, preferred_lang)
VALUES (
  '{demo_id}', 'inversor@hubchancay.pe', '{demo_hash}', 'inversor',
  'Inversor Demo ZEEP', true, true, 'es'
) ON CONFLICT (email) DO UPDATE SET is_verified = true, is_active = true;""",
            "-- Login demo: inversor@hubchancay.pe / HubChancay2025!",
        ]
    )

    lines.extend(["", "COMMIT;", f"-- Ingenieros: {len(ENGINEERS)} | Abogados: {len(LAWYERS)} | Empresas: {len(companies)}"])
    OUT_PATH.write_text("\n\n".join(lines), encoding="utf-8")
    print(f"Generado: {OUT_PATH} ({len(companies)} empresas)")


if __name__ == "__main__":
    main()
