"use client";

import { useCallback, useEffect, useState } from "react";
import { Link } from "@/navigation";
import AuthGuard from "@/components/AuthGuard";
import {
  fetchProjects,
  activateProject,
  type InvestmentProject,
} from "@/lib/api/projects";
import { FLOW_KEYS, setFlowValue } from "@/lib/flow";

export default function PortfolioPanel() {
  const [projects, setProjects] = useState<InvestmentProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setProjects(await fetchProjects());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar portafolio");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function onActivate(id: string) {
    const p = await activateProject(id);
    setFlowValue(FLOW_KEYS.activeProjectId, p.id);
    if (p.investor_profile_id) {
      setFlowValue(FLOW_KEYS.investorProfileId, p.investor_profile_id);
    }
    await load();
  }

  return (
    <AuthGuard>
      <div className="p-6 md:p-10 max-w-5xl mx-auto w-full min-w-0">
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#E31E24] mb-2">
              Portafolio
            </p>
            <h1 className="text-3xl font-black text-[#2A2A29] uppercase">
              Proyectos de inversión
            </h1>
            <p className="text-slate-600 mt-2 text-sm">
              Una empresa puede registrar varios proyectos ZEEP. Active el que desea
              trabajar en matchmaking y Legal AI.
            </p>
          </div>
          <Link
            href="/onboarding"
            className="shrink-0 px-5 py-3 bg-[#E31E24] text-white text-xs font-black uppercase rounded-lg text-center"
          >
            + Nuevo proyecto
          </Link>
        </header>

        {error && <p className="text-[#E31E24] text-sm font-semibold mb-4">{error}</p>}
        {loading && (
          <p className="text-slate-400 text-sm uppercase font-bold">Cargando…</p>
        )}

        <div className="space-y-4">
          {projects.map((p) => (
            <article
              key={p.id}
              className={`p-6 rounded-xl border ${
                p.is_active
                  ? "border-[#E31E24] bg-[#E31E24]/5"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold text-[#E31E24] uppercase">
                      {p.codigo}
                    </span>
                    {p.is_active && (
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-[#E31E24] text-white rounded">
                        Activo
                      </span>
                    )}
                    <span className="text-[10px] font-bold uppercase text-slate-500">
                      {p.estado.replace("_", " ")}
                    </span>
                  </div>
                  <h2 className="font-bold text-lg text-[#2A2A29] mt-1">{p.nombre}</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    {p.empresa_razon_social} · {p.sector} · USD{" "}
                    {Number(p.monto_usd).toLocaleString()}
                  </p>
                  {p.completion_pct > 0 && (
                    <p className="text-xs text-slate-500 mt-2">
                      Perfil {p.completion_pct}% completo
                    </p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  {!p.is_active && (
                    <button
                      type="button"
                      onClick={() => onActivate(p.id)}
                      className="px-4 py-2 text-xs font-black uppercase border-2 border-[#D7B56D] rounded-lg hover:bg-[#D7B56D]/10"
                    >
                      Activar
                    </button>
                  )}
                  <Link
                    href="/dashboard/matchmaking"
                    className="px-4 py-2 text-xs font-black uppercase bg-[#2A2A29] text-white rounded-lg"
                  >
                    Match
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        {!loading && projects.length === 0 && (
          <p className="text-center text-slate-400 py-16 text-sm uppercase font-bold">
            Sin proyectos — cree uno desde onboarding
          </p>
        )}
      </div>
    </AuthGuard>
  );
}
