"use client";

import { useState } from "react";
import { useRouter } from "@/navigation";
import { login, register, type LoginResponse } from "@/lib/auth";
import { fetchMe } from "@/lib/api/auth-profile";
import type { RegisterPayload } from "@/lib/api/auth-profile";

type ProfileType = RegisterPayload["profile_type"];

const PROFILE_OPTIONS: { id: ProfileType; label: string; hint: string }[] = [
  { id: "empresa_inversora", label: "Empresa inversora", hint: "Capital extranjero ZEEP" },
  { id: "empresa_local", label: "Empresa local", hint: "Proveedor / operador Perú" },
  { id: "ingeniero", label: "Ingeniero CIP", hint: "Colegio de Ingenieros" },
  { id: "abogado", label: "Abogado CAL", hint: "Colegio de Abogados de Lima" },
];

type Props = {
  labels: {
    email: string;
    password: string;
    submit: string;
    register: string;
    error: string;
  };
  redirectTo?: string;
};

export default function LoginForm({ labels, redirectTo = "/legal-ai" }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [profileType, setProfileType] = useState<ProfileType>("empresa_inversora");
  const [numeroCip, setNumeroCip] = useState("");
  const [numeroCal, setNumeroCal] = useState("");
  const [razonSocial, setRazonSocial] = useState("");
  const [ruc, setRuc] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function afterAuth(data: LoginResponse, fromRegister: boolean) {
    const explicitNext =
      redirectTo && redirectTo !== "/legal-ai" ? redirectTo : null;

    if (explicitNext) {
      router.push(explicitNext);
      return;
    }
    if (fromRegister && profileType === "empresa_inversora") {
      router.push("/onboarding");
      return;
    }
    if (data.role === "inversor") {
      router.push("/onboarding");
      return;
    }
    try {
      const me = await fetchMe();
      if (me.profile?.can_access_onboarding) {
        router.push("/onboarding");
        return;
      }
    } catch {
      /* ignore */
    }
    router.push(redirectTo);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      let data: LoginResponse;
      if (mode === "login") {
        data = await login(email, password);
      } else {
        data = await register(email, password, fullName, {
          profile_type: profileType,
          numero_cip: profileType === "ingeniero" ? numeroCip : undefined,
          numero_cal: profileType === "abogado" ? numeroCal : undefined,
          razon_social:
            profileType === "empresa_inversora" || profileType === "empresa_local"
              ? razonSocial
              : undefined,
          ruc: profileType === "empresa_local" ? ruc : undefined,
        });
      }
      await afterAuth(data, mode === "register");
    } catch (err) {
      setError(err instanceof Error ? err.message : labels.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {mode === "register" && (
        <>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
              Nombre completo
            </label>
            <input
              className="w-full px-4 py-4 bg-slate-50 border border-slate-200 focus:border-[#E31E24] rounded-sm outline-none font-bold"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
              Tipo de perfil
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PROFILE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setProfileType(opt.id)}
                  className={`text-left p-3 rounded-lg border-2 transition-all ${
                    profileType === opt.id
                      ? "border-[#E31E24] bg-[#E31E24]/5"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <p className="text-xs font-black uppercase text-[#2A2A29]">
                    {opt.label}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{opt.hint}</p>
                </button>
              ))}
            </div>
          </div>

          {profileType === "ingeniero" && (
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                Código CIP *
              </label>
              <input
                required
                placeholder="Ej. CIP-058423"
                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-sm font-bold"
                value={numeroCip}
                onChange={(e) => setNumeroCip(e.target.value)}
              />
            </div>
          )}

          {profileType === "abogado" && (
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                Código CAL *
              </label>
              <input
                required
                placeholder="Ej. CAL-12345"
                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-sm font-bold"
                value={numeroCal}
                onChange={(e) => setNumeroCal(e.target.value)}
              />
            </div>
          )}

          {(profileType === "empresa_inversora" || profileType === "empresa_local") && (
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                Razón social *
              </label>
              <input
                required
                placeholder="Nombre legal de la empresa"
                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-sm font-bold"
                value={razonSocial}
                onChange={(e) => setRazonSocial(e.target.value)}
              />
            </div>
          )}

          {profileType === "empresa_local" && (
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                RUC (11 dígitos) *
              </label>
              <input
                required
                pattern="\d{11}"
                maxLength={11}
                placeholder="20123456789"
                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-sm font-bold"
                value={ruc}
                onChange={(e) => setRuc(e.target.value.replace(/\D/g, "").slice(0, 11))}
              />
            </div>
          )}
        </>
      )}

      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 italic">
          {labels.email}
        </label>
        <input
          type="email"
          className="w-full px-4 py-4 bg-slate-50 border border-slate-200 focus:border-[#E31E24] rounded-sm outline-none font-bold"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 italic">
          {labels.password}
        </label>
        <input
          type="password"
          className="w-full px-4 py-4 bg-slate-50 border border-slate-200 focus:border-[#E31E24] rounded-sm outline-none font-bold"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />
      </div>
      {error && (
        <p className="text-sm text-[#E31E24] font-semibold bg-red-50 px-3 py-2 rounded">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-5 bg-[#E31E24] text-white font-black uppercase tracking-[0.3em] text-[12px] rounded-sm hover:opacity-90 disabled:opacity-60 transition-all"
      >
        {loading ? "..." : labels.submit}
      </button>
      <button
        type="button"
        onClick={() => setMode(mode === "login" ? "register" : "login")}
        className="w-full py-3 text-[11px] font-bold uppercase tracking-widest text-[#2A2A29]/70 hover:text-[#E31E24]"
      >
        {mode === "login" ? labels.register : "Ya tengo cuenta"}
      </button>
    </form>
  );
}
