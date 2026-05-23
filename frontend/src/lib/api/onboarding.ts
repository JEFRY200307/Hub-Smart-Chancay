import { apiFetch } from "../api";
import { getAccessToken } from "../auth";

export type InvestorProfile = {
  id: string;
  session_id: string;
  user_id: string;
  estado: string;
  completion_pct: number;
  empresa_razon_social: string;
  proyecto_nombre: string;
  proyecto_monto_usd: number;
  sector: string;
  created_at: string;
};

export type RoadmapPhase = {
  fase: string;
  estado: string;
  dias_estimados?: number;
  hitos?: string[];
};

export async function createProfile(payload: Record<string, unknown>) {
  return apiFetch<InvestorProfile>("/onboarding/profiles", {
    method: "POST",
    token: getAccessToken(),
    body: JSON.stringify(payload),
  });
}

export async function getProfile(profileId: string) {
  return apiFetch<InvestorProfile>(`/onboarding/profiles/${profileId}`, {
    token: getAccessToken(),
  });
}

export async function getRoadmap(profileId: string) {
  return apiFetch<{
    profile_id: string;
    roadmap: RoadmapPhase[];
    completion_pct: number;
    estado: string;
  }>(`/onboarding/profiles/${profileId}/roadmap`, {
    token: getAccessToken(),
  });
}

export async function uploadDocument(
  profileId: string,
  file: File,
  tipoDocumento: string
) {
  const token = getAccessToken();
  const form = new FormData();
  form.append("file", file);
  form.append("tipo_documento", tipoDocumento);

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8000/api/v1"}/onboarding/profiles/${profileId}/documents`,
    {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    }
  );
  if (!res.ok) throw new Error(`Upload ${res.status}`);
  return res.json();
}
