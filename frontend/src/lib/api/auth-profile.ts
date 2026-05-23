import { apiFetch } from "../api";
import { getAccessToken } from "../auth";

export type UserProfile = {
  profile_type: string;
  numero_cip?: string | null;
  numero_cal?: string | null;
  razon_social?: string | null;
  ruc?: string | null;
  pais_origen?: string | null;
  tax_id_internacional?: string | null;
  rep_legal_nombre_pasaporte?: string | null;
  profile_completed: boolean;
  can_access_onboarding: boolean;
};

export type MeResponse = {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  profile?: UserProfile | null;
};

export async function fetchMe() {
  return apiFetch<MeResponse>("/auth/me", { token: getAccessToken() });
}

export async function updateInvestorProfile(body: {
  pais_origen?: string;
  tax_id_internacional?: string;
  rep_legal_nombre_pasaporte?: string;
}) {
  return apiFetch<MeResponse>("/auth/me/profile", {
    method: "PATCH",
    token: getAccessToken(),
    body: JSON.stringify(body),
  });
}

export type RegisterPayload = {
  email: string;
  password: string;
  full_name: string;
  profile_type: "ingeniero" | "abogado" | "empresa_inversora" | "empresa_local";
  numero_cip?: string;
  numero_cal?: string;
  razon_social?: string;
  ruc?: string;
  pais_origen?: string;
};
