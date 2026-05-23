import { apiFetch } from "../api";
import { getAccessToken } from "../auth";
import type { EngineerItem, LawyerItem, ProviderItem, Paginated } from "../types";

export type MatchCandidato = {
  candidato_id: string;
  nombre: string;
  numero_cip?: string;
  numero_cal?: string;
  score_compatibilidad: number;
  especialidad_principal?: string;
  disponibilidad: string;
  idiomas: string[];
  validacion_institucional: string;
  justificacion?: string;
};

export type MatchCategoria = {
  categoria: string;
  score_promedio: number;
  justificacion_agente: string;
  candidatos: MatchCandidato[];
};

export type MatchResponse = {
  match_id: string;
  investor_profile_id: string;
  resultados: MatchCategoria[];
  created_at: string;
};

export type Opportunity = {
  id: string;
  title: string;
  category: string;
  match_score?: number;
  description: string;
  tags: string[];
  company_name: string;
  posted_ago: string;
};

export type Operator = {
  id: string;
  name: string;
  tier: string;
  description: string;
  services: string[];
  rating: number;
  verified: boolean;
};

export async function runMatchmaking(
  investorProfileId: string,
  categorias?: string[]
) {
  return apiFetch<MatchResponse>("/marketplace/matches", {
    method: "POST",
    token: getAccessToken(),
    body: JSON.stringify({
      investor_profile_id: investorProfileId,
      categorias: categorias ?? [
        "ingeniero_cip",
        "abogado_cal",
        "proveedor_local",
      ],
    }),
  });
}

export async function getMatch(matchId: string) {
  return apiFetch<MatchResponse>(`/marketplace/matches/${matchId}`, {
    token: getAccessToken(),
  });
}

export async function requestReunion(
  matchId: string,
  body: {
    candidato_id: string;
    categoria: string;
    modalidad?: string;
    fecha_preferida: string;
    agenda?: string;
  }
) {
  return apiFetch<{
    reunion_id: string;
    estado: string;
    mensaje: string;
  }>(`/marketplace/matches/${matchId}/reuniones`, {
    method: "POST",
    token: getAccessToken(),
    body: JSON.stringify({
      modalidad: "virtual",
      ...body,
    }),
  });
}

export async function fetchEngineers(params?: {
  page?: number;
  size?: number;
}) {
  const q = new URLSearchParams({
    page: String(params?.page ?? 1),
    size: String(params?.size ?? 20),
  });
  return apiFetch<Paginated<EngineerItem>>(
    `/marketplace/directory/engineers?${q}`
  );
}

export async function fetchLawyers(params?: { page?: number; size?: number }) {
  const q = new URLSearchParams({
    page: String(params?.page ?? 1),
    size: String(params?.size ?? 20),
  });
  return apiFetch<Paginated<LawyerItem>>(
    `/marketplace/directory/lawyers?${q}`
  );
}

export async function fetchProviders(params?: {
  sector?: string;
  page?: number;
  size?: number;
}) {
  const q = new URLSearchParams({
    page: String(params?.page ?? 1),
    size: String(params?.size ?? 20),
  });
  if (params?.sector) q.set("sector", params.sector);
  return apiFetch<Paginated<ProviderItem>>(
    `/marketplace/directory/providers?${q}`
  );
}

export async function fetchOpportunities(limit = 20) {
  return apiFetch<Opportunity[]>(
    `/marketplace/opportunities?limit=${limit}`,
    { token: getAccessToken() }
  );
}

export async function fetchOperators(sector?: string) {
  const q = sector ? `?sector=${sector}` : "";
  return apiFetch<Operator[]>(`/marketplace/operators${q}`, {
    token: getAccessToken(),
  });
}

export type EnrichmentMeta = {
  completeness_score: number;
  fuentes: string[];
  ultima_actualizacion?: string | null;
};

export type EngineerDetail = EngineerItem & {
  region?: string;
  ciudad?: string;
  experiencia_zeep?: boolean;
  anos_experiencia?: number;
  certificaciones?: string[];
  enrichment?: EnrichmentMeta;
};

export type LawyerDetail = LawyerItem & {
  region?: string;
  ciudad?: string;
  anos_experiencia?: number;
  enrichment?: EnrichmentMeta;
};

export type ProviderDetail = ProviderItem & {
  ciiu_principal?: string;
  servicios_principales?: string[];
  web_enrichment_data?: Record<string, unknown>;
  directorio?: unknown[];
  enrichment?: EnrichmentMeta;
};

export async function fetchEngineerDetail(id: string) {
  return apiFetch<EngineerDetail>(`/marketplace/directory/engineers/${id}`);
}

export async function fetchLawyerDetail(id: string) {
  return apiFetch<LawyerDetail>(`/marketplace/directory/lawyers/${id}`);
}

export async function fetchProviderDetail(ruc: string) {
  return apiFetch<ProviderDetail>(`/marketplace/directory/providers/${ruc}`);
}

export async function enrichProvider(ruc: string) {
  return apiFetch<ProviderDetail>(
    `/marketplace/directory/providers/${ruc}/enrich`,
    { method: "POST", token: getAccessToken() }
  );
}
