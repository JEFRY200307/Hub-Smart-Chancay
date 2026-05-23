"use client";

import { useState } from "react";
import { useRouter } from "@/navigation";
import { login, register } from "@/lib/auth";

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
  const [email, setEmail] = useState("inversor@hubchancay.pe");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("Inversor Demo");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, password, fullName);
      }
      router.push(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : labels.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {mode === "register" && (
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
        <p className="text-sm text-[#E31E24] font-semibold bg-red-50 px-3 py-2 rounded">{error}</p>
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
