import { apiFetch } from "../api";
import { getAccessToken } from "../auth";

export type InvestmentProject = {
  id: string;
  codigo: string;
  nombre: string;
  sector: string;
  estado: string;
  monto_usd: number;
  empleo_directo: number;
  empleo_indirecto: number;
  porcentaje_cl: number;
  exportacion_pct?: number | null;
  pais_origen_capital: string;
  empresa_razon_social: string;
  is_active: boolean;
  investor_profile_id?: string | null;
  session_id?: string | null;
  completion_pct: number;
};

export async function fetchProjects() {
  return apiFetch<InvestmentProject[]>("/projects", {
    token: getAccessToken(),
  });
}

export async function activateProject(projectId: string) {
  return apiFetch<InvestmentProject>(`/projects/${projectId}/activate`, {
    method: "POST",
    token: getAccessToken(),
  });
}

export async function createProject(body: {
  nombre: string;
  sector: string;
  monto_usd: number;
  empleo_directo: number;
  empleo_indirecto: number;
  porcentaje_cl: number;
  exportacion_pct?: number;
  pais_origen_capital: string;
  empresa_razon_social: string;
}) {
  return apiFetch<InvestmentProject>("/projects", {
    method: "POST",
    token: getAccessToken(),
    body: JSON.stringify(body),
  });
}
