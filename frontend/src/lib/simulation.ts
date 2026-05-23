import { apiFetch } from "./api";
import type { SimulationRequest, SimulationResponse } from "./types";

export function newSessionId(): string {
  return crypto.randomUUID();
}

export async function calculateSimulation(payload: SimulationRequest) {
  return apiFetch<SimulationResponse>("/simulation/calculate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getSimulationBySession(sessionId: string) {
  return apiFetch<SimulationResponse>(`/simulation/${sessionId}`);
}

export function buildVariablesSector(
  sector: SimulationRequest["sector"],
  form: Record<string, string | number | boolean | string[]>
): Record<string, unknown> {
  if (sector === "manufactura") {
    return {
      tipo_proceso: form.tipo_proceso || "continuo",
      requiere_anexo_4: Boolean(form.requiere_anexo_4),
      va_estimado_pct: Number(form.va_estimado_pct ?? 35),
      tipo_impacto_ambiental: form.tipo_impacto_ambiental || "medio",
    };
  }
  if (sector === "ckd") {
    return {
      producto_ensamblado: form.producto_ensamblado || "vehiculo",
      ratio_ckd_importado: Number(form.ratio_ckd_importado ?? 40),
      mercado_destino: form.mercado_destino || "regional",
      certificaciones: Array.isArray(form.certificaciones)
        ? form.certificaciones
        : [],
    };
  }
  return {
    tipo_servicio: form.tipo_servicio || "software",
    pct_servicios_exportables: Number(form.pct_servicios_exportables ?? 50),
    requiere_datacenter: Boolean(form.requiere_datacenter),
    ratio_empleos_tech: Number(form.ratio_empleos_tech ?? 0.6),
  };
}
