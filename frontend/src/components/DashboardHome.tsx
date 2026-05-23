"use client";

import { useEffect, useState } from "react";
import { Link } from "@/navigation";
import AuthGuard from "@/components/AuthGuard";
import { fetchDashboardSummary, type DashboardSummary } from "@/lib/api/dashboard";
import { FLOW_KEYS, setFlowValue } from "@/lib/flow";

const FASE_LABELS: Record<string, string> = {
  elegibilidad: "Elegibilidad",
  validacion_legal: "Validación legal",
  contratacion: "Contratación",
  operacion: "Operación",
};

export default function DashboardHome() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardSummary()
      .then((d) => {
        setData(d);
        if (d.active_project?.investor_profile_id) {
          setFlowValue(
            FLOW_KEYS.investorProfileId,
            d.active_project.investor_profile_id
          );
        }
        if (d.active_project?.id) {
          setFlowValue(FLOW_KEYS.activeProjectId, d.active_project.id);
        }
        if (d.simulation?.session_id) {
          setFlowValue(FLOW_KEYS.simulationSession, d.simulation.session_id);
        }
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "No se pudo cargar el dashboard")
      );
  }, []);

  return (
    <AuthGuard>
      <div className="p-6 md:p-10 max-w-6xl mx-auto w-full min-w-0">
        <header className="mb-10">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#E31E24] mb-2">
            Panel del inversor
          </p>
          <h1 className="text-3xl md:text-4xl font-black text-[#2A2A29] uppercase tracking-tight">
            Dashboard institucional
          </h1>
          <p className="text-slate-600 mt-2 max-w-2xl">
            Resumen de su expediente ZEEP: proyecto activo, elegibilidad, fase del
            ledger y accesos rápidos.
          </p>
        </header>

        {error && (
          <p className="text-sm text-[#E31E24] font-semibold mb-6">{error}</p>
        )}

        {!data && !error && (
          <p className="text-slate-400 text-sm uppercase font-bold">Cargando…</p>
        )}

        {data && (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              <StatCard
                label="Score ZEEP"
                value={
                  data.simulation?.v_final != null
                    ? `${(data.simulation.v_final * 100).toFixed(0)}%`
                    : "—"
                }
                sub={data.simulation?.clasificacion ?? "Sin simulación"}
              />
              <StatCard
                label="Fase actual"
                value={
                  FASE_LABELS[data.ledger.fase_actual ?? ""] ??
                  data.ledger.fase_actual ??
                  "—"
                }
                sub={`${data.ledger.total_events} eventos ledger`}
              />
              <StatCard
                label="Proyectos"
                value={String(data.portfolio_count)}
                sub="En portafolio"
              />
              <StatCard
                label="Proyecto activo"
                value={data.active_project?.codigo ?? "—"}
                sub={data.active_project?.nombre ?? "Crear proyecto"}
              />
            </div>

            {!data.active_project && (
              <div className="mb-8 p-6 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="font-bold text-amber-900 mb-2">
                  Aún no tiene un proyecto ZEEP
                </p>
                <Link
                  href="/onboarding"
                  className="text-[#E31E24] text-xs font-black uppercase"
                >
                  Iniciar onboarding →
                </Link>
              </div>
            )}

            <section className="mb-10">
              <h2 className="text-sm font-black uppercase text-[#2A2A29] mb-4">
                Roadmap de instalación
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {data.roadmap.map((r) => (
                  <div
                    key={r.fase}
                    className={`p-4 rounded-xl border ${
                      r.estado === "completado"
                        ? "bg-green-50 border-green-200"
                        : r.estado === "en_progreso"
                          ? "bg-[#E31E24]/5 border-[#E31E24]/30"
                          : "bg-white border-slate-200"
                    }`}
                  >
                    <p className="text-[10px] font-bold uppercase text-slate-500">
                      {FASE_LABELS[r.fase] ?? r.fase}
                    </p>
                    <p className="text-xs font-black uppercase mt-1 text-[#2A2A29]">
                      {r.estado.replace("_", " ")}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <div className="grid md:grid-cols-2 gap-8">
              <section>
                <h2 className="text-sm font-black uppercase mb-4">Accesos rápidos</h2>
                <ul className="space-y-2">
                  {data.quick_actions.map((a) => (
                    <li key={a.href}>
                      <Link
                        href={a.href}
                        className="block px-4 py-3 rounded-lg border border-slate-200 hover:border-[#E31E24] hover:text-[#E31E24] text-sm font-bold transition-colors"
                      >
                        {a.label} →
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
              <section className="p-6 bg-[#2A2A29] text-white rounded-2xl">
                <p className="text-[#D7B56D] text-[10px] font-black uppercase mb-2">
                  COMEX.AI
                </p>
                <p className="text-sm leading-relaxed opacity-90">
                  Bienvenido{data.user.full_name ? `, ${data.user.full_name}` : ""}.
                  Su rol es <strong>{data.user.role}</strong>. Use el portafolio para
                  gestionar varios proyectos en la ZEEP Chancay.
                </p>
                <Link
                  href="/dashboard/portfolio"
                  className="inline-block mt-4 text-xs font-black uppercase text-[#D7B56D]"
                >
                  Ver portafolio →
                </Link>
              </section>
            </div>
          </>
        )}
      </div>
    </AuthGuard>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <p className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
        {label}
      </p>
      <p className="text-2xl font-black text-[#2A2A29] mt-1">{value}</p>
      <p className="text-xs text-slate-500 mt-1 capitalize">{sub}</p>
    </div>
  );
}
