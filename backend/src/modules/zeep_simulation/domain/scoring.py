from __future__ import annotations
from abc import ABC, abstractmethod
from dataclasses import dataclass
from decimal import Decimal
from typing import Any


@dataclass
class ScoringInputs:
    monto_inversion_usd: Decimal
    empleo_directo: int
    porcentaje_cl: Decimal
    tiempo_instalacion_meses: int
    pais_origen: str
    exportacion_pct: Decimal
    variables_sector: dict[str, Any]


@dataclass
class ScoringResult:
    v_base: Decimal
    delta_cl: Decimal
    delta_sector: Decimal
    v_final: Decimal
    beneficio_cl_activo: bool
    clasificacion: str          # ClasificacionElegibilidad
    proyeccion_fiscal: dict
    alertas: list[dict]
    recomendaciones: list[str]


class SectorScoringStrategy(ABC):
    """Puerto (interfaz) del dominio — ADR-01-02 Strategy Pattern."""

    # Pesos base comunes a todos los sectores
    W1: Decimal = Decimal("0.45")   # Monto de inversión
    W2: Decimal = Decimal("0.25")   # Velocidad de instalación
    W3: Decimal = Decimal("0.30")   # Empleo generado

    CL_UMBRAL = Decimal("30.0")     # Ley N° 32449 Art. 18: CL ≥ 30% → IR = 0%
    IR_ESTANDAR_PCT = Decimal("29.5")

    @abstractmethod
    def calcular_delta_sector(self, inputs: ScoringInputs, weights: dict) -> Decimal:
        """Calcula el diferencial sectorial Δ_sector."""

    def calcular_v_base(self, inputs: ScoringInputs, weights: dict) -> Decimal:
        w1 = Decimal(str(weights.get("w1", self.W1)))
        w2 = Decimal(str(weights.get("w2", self.W2)))
        w3 = Decimal(str(weights.get("w3", self.W3)))

        # Normalización simple [0-1] para MVP (valores de referencia del spec02)
        A = min(inputs.monto_inversion_usd / Decimal("50_000_000"), Decimal("1"))  # ref: 50M USD
        import math
        t = float(inputs.tiempo_instalacion_meses)
        log_t = Decimal(str(math.log(1 + 1 / t))) if t > 0 else Decimal("0")
        Z = min(Decimal(inputs.empleo_directo) / Decimal("500"), Decimal("1"))     # ref: 500 empleos

        return (w1 * A + w2 * log_t + w3 * Z) * Decimal("100")

    def calcular_delta_cl(self, porcentaje_cl: Decimal) -> Decimal:
        if porcentaje_cl >= self.CL_UMBRAL:
            exceso = porcentaje_cl - self.CL_UMBRAL
            return min(exceso * Decimal("0.14"), Decimal("10"))  # máx. +10 puntos
        return Decimal("0")

    def calcular_proyeccion_fiscal(self, inputs: ScoringInputs, beneficio_cl: bool) -> dict:
        ir_zeep = Decimal("0") if beneficio_cl else self.IR_ESTANDAR_PCT
        ahorro_anual = inputs.monto_inversion_usd * (self.IR_ESTANDAR_PCT / Decimal("100")) if beneficio_cl else Decimal("0")
        return {
            "ir_estandar_pct": float(self.IR_ESTANDAR_PCT),
            "ir_zeep_pct": float(ir_zeep),
            "ahorro_5_anos_usd": float(ahorro_anual * 5),
            "igv_exonerado": beneficio_cl,
            "arancel_0": beneficio_cl,
        }

    def clasificar(self, v_final: Decimal) -> str:
        if v_final >= Decimal("80"):
            return "elegible"
        elif v_final >= Decimal("60"):
            return "viable_con_ajustes"
        return "no_elegible"

    def score(self, inputs: ScoringInputs, weights: dict) -> ScoringResult:
        v_base = self.calcular_v_base(inputs, weights)
        delta_cl = self.calcular_delta_cl(inputs.porcentaje_cl)
        delta_sector = self.calcular_delta_sector(inputs, weights)
        v_final = min(v_base + delta_cl + delta_sector, Decimal("100"))
        beneficio_cl = inputs.porcentaje_cl >= self.CL_UMBRAL

        alertas = []
        recomendaciones = []
        if not beneficio_cl:
            diff = self.CL_UMBRAL - inputs.porcentaje_cl
            alertas.append({
                "tipo": "cl_insuficiente",
                "descripcion": f"CL actual {inputs.porcentaje_cl}% está {diff}% por debajo del umbral del 30%.",
                "impacto_score": float(delta_cl),
            })
            recomendaciones.append(
                f"Incrementar CL de {inputs.porcentaje_cl}% a ≥30% activa 0% IR "
                f"(ganancia estimada: {self.calcular_delta_cl(self.CL_UMBRAL):.1f} puntos)."
            )

        return ScoringResult(
            v_base=v_base,
            delta_cl=delta_cl,
            delta_sector=delta_sector,
            v_final=v_final,
            beneficio_cl_activo=beneficio_cl,
            clasificacion=self.clasificar(v_final),
            proyeccion_fiscal=self.calcular_proyeccion_fiscal(inputs, beneficio_cl),
            alertas=alertas,
            recomendaciones=recomendaciones,
        )


# ── Estrategias por sector ────────────────────────────────────────────────────

class ManufacturaScoringStrategy(SectorScoringStrategy):
    """Δ_mfg = f(VA_norm, EG_norm, IA_risk) — spec02."""

    def calcular_delta_sector(self, inputs: ScoringInputs, weights: dict) -> Decimal:
        w5 = Decimal(str(weights.get("w5", "0.15")))
        w6 = Decimal(str(weights.get("w6", "0.10")))
        w7 = Decimal(str(weights.get("w7", "0.10")))

        va_pct = Decimal(str(inputs.variables_sector.get("va_estimado_pct", 0)))
        VA_norm = min(va_pct / Decimal("100"), Decimal("1"))

        empleo_total = Decimal(inputs.empleo_directo) + Decimal(inputs.variables_sector.get("empleo_indirecto_estimado", 0))
        EG_norm = min(empleo_total / Decimal("1000"), Decimal("1"))

        impacto = inputs.variables_sector.get("tipo_impacto_ambiental", "medio")
        IA_risk = {"bajo": Decimal("1"), "medio": Decimal("0.6"), "alto": Decimal("0.2")}.get(impacto, Decimal("0.5"))

        return (w5 * VA_norm + w6 * EG_norm + w7 * IA_risk) * Decimal("100")


class CKDScoringStrategy(SectorScoringStrategy):
    """Δ_ckd = f(RCKD, DE, CERT_norm) — spec02."""

    def calcular_delta_sector(self, inputs: ScoringInputs, weights: dict) -> Decimal:
        w5 = Decimal(str(weights.get("w5", "0.15")))
        w6 = Decimal(str(weights.get("w6", "0.12")))
        w7 = Decimal(str(weights.get("w7", "0.08")))

        ratio_ckd = Decimal(str(inputs.variables_sector.get("ratio_ckd_importado", 0)))
        RCKD = min(ratio_ckd / Decimal("100"), Decimal("1"))

        mercado = inputs.variables_sector.get("mercado_destino", "interno")
        DE = {"exportacion": Decimal("1"), "regional": Decimal("0.7"), "interno": Decimal("0.3")}.get(mercado, Decimal("0.5"))

        certs = inputs.variables_sector.get("certificaciones", [])
        CERT_norm = min(Decimal(len(certs)) / Decimal("3"), Decimal("1"))

        return (w5 * RCKD + w6 * DE + w7 * CERT_norm) * Decimal("100")


class TechScoringStrategy(SectorScoringStrategy):
    """Δ_tech = f(RD_score, SE_factor, EAV_norm) — spec02."""

    def calcular_delta_sector(self, inputs: ScoringInputs, weights: dict) -> Decimal:
        w5 = Decimal(str(weights.get("w5", "0.18")))
        w6 = Decimal(str(weights.get("w6", "0.14")))
        w7 = Decimal(str(weights.get("w7", "0.08")))

        # RD_score: proporción de empleos tech sobre total
        ratio_tech = Decimal(str(inputs.variables_sector.get("ratio_empleos_tech", 0)))
        RD_score = min(ratio_tech, Decimal("1"))

        # SE_factor: % servicios exportables
        pct_export = Decimal(str(inputs.variables_sector.get("pct_servicios_exportables", 0)))
        SE_factor = min(pct_export / Decimal("100"), Decimal("1"))

        # EAV_norm: valor agregado estimado
        va_pct = Decimal(str(inputs.variables_sector.get("va_estimado_pct", 0)))
        EAV_norm = min(va_pct / Decimal("100"), Decimal("1"))

        return (w5 * RD_score + w6 * SE_factor + w7 * EAV_norm) * Decimal("100")


# Factory
STRATEGY_MAP: dict[str, SectorScoringStrategy] = {
    "manufactura": ManufacturaScoringStrategy(),
    "ckd": CKDScoringStrategy(),
    "tech": TechScoringStrategy(),
}


def get_strategy(sector: str) -> SectorScoringStrategy:
    strategy = STRATEGY_MAP.get(sector)
    if strategy is None:
        raise ValueError(f"Sector desconocido: {sector}. Válidos: {list(STRATEGY_MAP.keys())}")
    return strategy
