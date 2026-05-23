/** Persistencia del flujo inversor (localStorage) */
export const FLOW_KEYS = {
  simulationSession: "hub_simulation_session",
  investorProfileId: "hub_investor_profile_id",
  activeProjectId: "hub_active_project_id",
  matchId: "hub_match_id",
  sector: "hub_sector",
  empresaNombre: "hub_empresa_nombre",
  projectPdfUrl: "hub_project_pdf_url",
} as const;

export function getFlowValue(key: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(key);
}

export function setFlowValue(key: string, value: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, value);
}

export function clearFlow() {
  if (typeof window === "undefined") return;
  Object.values(FLOW_KEYS).forEach((k) => localStorage.removeItem(k));
}

export function getInvestorProfileId(): string | null {
  return getFlowValue(FLOW_KEYS.investorProfileId);
}

export function getSimulationSession(): string | null {
  return getFlowValue(FLOW_KEYS.simulationSession);
}
