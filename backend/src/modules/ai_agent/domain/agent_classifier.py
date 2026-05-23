"""Clasificación de cadena de agentes (ADR-02 / spec09)."""

from __future__ import annotations


def classify_agents(query: str) -> list[str]:
    q = query.lower()
    chain = ["orquestador"]

    legal_kw = ["ley", "legal", "32449", "arancel", "igv", "norma", "decreto", "zeep"]
    match_kw = ["match", "ingeniero", "abogado", "proveedor", "cip", "cal", "socio", "aliado"]
    tech_kw = ["técnico", "tecnico", "ambiental", "anexo", "instalación", "infraestructura"]
    fin_kw = ["fiscal", "ir ", "inversión", "inversion", "ahorro", "roi", "beneficio"]
    idi_kw = ["idi", "concycit", "innovación", "innovacion", "i+d", "cite"]

    if any(k in q for k in legal_kw):
        chain.append("legal")
    if any(k in q for k in match_kw):
        chain.append("matchmaker")
    if any(k in q for k in tech_kw):
        chain.append("tecnico")
    if any(k in q for k in fin_kw):
        chain.append("financiero")
    if any(k in q for k in idi_kw):
        chain.append("idi")

    if "legal" not in chain and "matchmaker" not in chain:
        chain.append("legal")

    chain.append("auditor")
    return chain
