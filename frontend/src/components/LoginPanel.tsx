"use client";

import { useSearchParams } from "next/navigation";
import LoginForm from "./LoginForm";

function resolveRedirect(next: string | null): string {
  if (!next) return "/legal-ai";
  if (next.startsWith("/")) return next;
  const map: Record<string, string> = {
    onboarding: "/onboarding",
    matchmaking: "/dashboard/matchmaking",
    "legal-ai": "/legal-ai",
    dashboard: "/dashboard",
  };
  return map[next] || `/${next}`;
}

export default function LoginPanel() {
  const params = useSearchParams();
  const redirectTo = resolveRedirect(params.get("next"));

  return (
    <LoginForm
      redirectTo={redirectTo}
      labels={{
        email: "Correo corporativo",
        password: "Contraseña",
        submit: "Acceso seguro",
        register: "Crear cuenta inversor",
        error: "Credenciales inválidas",
      }}
    />
  );
}
