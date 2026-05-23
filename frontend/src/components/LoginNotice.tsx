"use client";

import { useSearchParams } from "next/navigation";

export default function LoginNotice() {
  const params = useSearchParams();
  const reason = params.get("reason");

  if (reason === "expired") {
    return (
      <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-6">
        Su sesión expiró o el token ya no es válido. Inicie sesión de nuevo para continuar.
      </p>
    );
  }
  if (reason === "logout") {
    return (
      <p className="text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 mb-6">
        Sesión cerrada correctamente.
      </p>
    );
  }
  return null;
}
