import { apiFetch } from "../api";
import { getAccessToken } from "../auth";

export type DashboardSummary = {
  user: { email: string; full_name?: string; role: string };
  active_project: {
    id: string;
    codigo: string;
    nombre: string;
    sector: string;
    estado: string;
    investor_profile_id?: string | null;
    monto_usd: number;
  } | null;
  portfolio_count: number;
  simulation: {
    session_id: string;
    v_final: number | null;
    clasificacion: string | null;
  } | null;
  ledger: {
    fase_actual: string | null;
    total_events: number;
    has_dossier: boolean;
  };
  roadmap: { fase: string; estado: string }[];
  quick_actions: { label: string; href: string }[];
};

export async function fetchDashboardSummary() {
  return apiFetch<DashboardSummary>("/dashboard/summary", {
    token: getAccessToken(),
  });
}
