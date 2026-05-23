import { apiFetch } from "../api";
import { login, register, saveAuth } from "../auth";

export async function registerCompany(payload: {
  nombre_empresa: string;
  pais_origen: string;
  sector_interes: string;
  email_corporativo: string;
  nombre_representante: string;
}) {
  return apiFetch<{
    user_id: string;
    email: string;
    otp_enviado: boolean;
    mensaje: string;
  }>("/auth/register/company", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function verifyEmailOtp(email: string, otp_code: string) {
  const data = await apiFetch<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }>("/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ email, otp_code }),
  });
  saveAuth({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    user_id: "",
    email,
    role: "inversor",
  });
  return data;
}

export async function fetchMe() {
  return apiFetch<{
    id: string;
    email: string;
    full_name?: string;
    role: string;
  }>("/auth/me", { token: (await import("../auth")).getAccessToken() });
}

export { login, register };
