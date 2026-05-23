"use client";

import { useEffect, useState } from "react";
import { Link } from "@/navigation";
import { apiFetch } from "@/lib/api";
import { getSimulationBySession } from "@/lib/simulation";
import type { ProviderItem, SimulationResponse } from "@/lib/types";
import { FLOW_KEYS, setFlowValue } from "@/lib/flow";

function clasificacionLabel(c: string) {
  const map: Record<string, string> = {
    elegible: "Elegible ZEEP",
    viable_con_ajustes: "Viable con ajustes",
    no_elegible: "No elegible",
  };
  return map[c] || c;
}

export default function EligibilityResults({ sessionId }: { sessionId: string }) {
  const [data, setData] = useState<SimulationResponse | null>(null);
  const [providers, setProviders] = useState<ProviderItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const sim = await getSimulationBySession(sessionId);
        if (cancelled) return;
        setData(sim);
        setFlowValue(FLOW_KEYS.simulationSession, sim.session_id);
        setFlowValue(FLOW_KEYS.sector, sim.sector);
        const sector = sim.sector === "tech" ? "tech" : sim.sector;
        const prov = await apiFetch<{ items: ProviderItem[] }>(
          `/marketplace/directory/providers?sector=${sector}&size=5&page=1`
        );
        if (!cancelled) setProviders(prov.items || []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "No se pudo cargar el análisis");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-[#E31E24] font-black uppercase tracking-widest text-sm">
          Analizando viabilidad ZEEP...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-12 text-center">
        <p className="text-[#E31E24] font-bold mb-4">{error || "Sin datos"}</p>
        <Link href="/simulacion" className="text-[#2A2A29] underline font-bold">
          Nueva simulación
        </Link>
      </div>
    );
  }

  const scorePct = Math.round(data.v_final * 100);
  const dashOffset = 251.2 * (1 - data.v_final);
  const fiscal = data.proyeccion_fiscal;

  return (
    <div className="font-body antialiased flex flex-col gap-12 max-w-[1440px] mx-auto w-full px-6 md:px-8 pb-24">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 pt-8">
        <div className="max-w-2xl">
          <p className="text-[#E31E24] font-bold tracking-widest uppercase text-sm mb-2">Análisis completado</p>
          <h1 className="font-headline font-extrabold text-[#2A2A29] text-4xl md:text-5xl leading-tight mb-4">
            Resultados de Elegibilidad ZEEP
          </h1>
          <p className="text-[#2A2A29]/70 text-lg">
            Clasificación: <strong>{clasificacionLabel(data.clasificacion)}</strong> · Sector {data.sector}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/onboarding"
            className="bg-[#2A2A29] text-white font-headline font-bold px-6 py-4 rounded-xl flex items-center gap-2"
          >
            <span className="material-symbols-outlined">assignment</span>
            Crear perfil inversor
          </Link>
          <Link
            href="/dashboard/matchmaking"
            className="bg-[#D7B56D] text-[#2A2A29] font-headline font-bold px-6 py-4 rounded-xl flex items-center gap-2"
          >
            <span className="material-symbols-outlined">handshake</span>
            Matchmaking
          </Link>
          <Link
            href="/legal-ai"
            className="bg-[#E31E24] text-white font-headline font-bold px-6 py-4 rounded-xl shadow-lg hover:opacity-90 flex items-center gap-2"
          >
            <span className="material-symbols-outlined">gavel</span>
            Asesor legal IA
          </Link>
        </div>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 bg-white rounded-2xl p-10 border border-[#D7B56D]/20 flex flex-col items-center">
          <h2 className="font-headline font-bold text-xl mb-8 w-full text-center text-[#2A2A29]">Score de elegibilidad</h2>
          <div className="relative w-64 h-64 flex items-center justify-center mb-6">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="8" />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="#E31E24"
                strokeWidth="8"
                strokeDasharray="251.2"
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="font-headline font-extrabold text-6xl text-[#2A2A29]">{scorePct}%</span>
              <span className="text-xs font-bold text-[#E31E24] bg-[#E31E24]/10 px-3 py-1 rounded-full mt-2">
                {clasificacionLabel(data.clasificacion)}
              </span>
            </div>
          </div>
          <div className="w-full space-y-2 text-sm text-[#2A2A29]/80">
            <div className="flex justify-between"><span>Base</span><strong>{(data.v_base * 100).toFixed(1)}%</strong></div>
            <div className="flex justify-between"><span>Δ contenido local</span><strong>+{(data.delta_cl * 100).toFixed(1)}%</strong></div>
            <div className="flex justify-between"><span>Δ sector</span><strong>+{(data.delta_sector * 100).toFixed(1)}%</strong></div>
            {data.beneficio_cl_activo && (
              <p className="text-[#D7B56D] font-bold text-xs uppercase tracking-wider pt-2">Beneficio CL activo</p>
            )}
          </div>
        </div>

        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <BenefitCard
            icon="account_balance"
            title={`IR ZEEP ${fiscal.ir_zeep_pct}%`}
            body={`Tasa estándar ${fiscal.ir_estandar_pct}%. Ahorro proyectado 5 años: USD ${fiscal.ahorro_5_anos_usd.toLocaleString()}.`}
            metric={fiscal.igv_exonerado ? "IGV exonerado" : "IGV estándar"}
          />
          <BenefitCard
            icon="local_shipping"
            title={fiscal.arancel_0 ? "Arancel 0% equipos" : "Arancel según NCM"}
            body="Beneficios aduaneros según Ley N° 32449 y régimen ZEEP Chancay."
            metric={`Exportación ${data.sector}`}
          />
        </div>
      </section>

      {data.alertas.length > 0 && (
        <section className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <h3 className="font-bold text-[#2A2A29] mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-600">warning</span>
            Alertas del motor de scoring
          </h3>
          <ul className="space-y-3">
            {data.alertas.map((a, i) => (
              <li key={i} className="text-sm text-[#2A2A29]/90">
                <span className="font-bold uppercase text-xs text-amber-700">{a.tipo}</span> — {a.descripcion}
              </li>
            ))}
          </ul>
        </section>
      )}

      {data.recomendaciones_agente.length > 0 && (
        <section className="bg-white rounded-2xl p-8 border border-slate-200">
          <h3 className="font-headline font-bold text-xl text-[#2A2A29] mb-4">Recomendaciones</h3>
          <ul className="list-disc list-inside space-y-2 text-[#2A2A29]/80">
            {data.recomendaciones_agente.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="bg-white rounded-2xl p-8 border border-[#D7B56D]/25">
        <h2 className="font-headline font-bold text-2xl text-[#2A2A29] mb-4">Proveedores locales (PadronRUC)</h2>
        <p className="text-[#2A2A29]/70 mb-6 text-sm">
          Candidatos desde la base de datos — sin mapa territorial (datos dinámicos).
        </p>
        {providers.length === 0 ? (
          <p className="text-sm text-slate-500">Ejecute el seed SQL en Supabase para cargar empresas del padrón.</p>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {providers.map((p) => (
              <li key={p.ruc} className="p-4 rounded-xl border border-slate-100 hover:border-[#E31E24]/30 transition-colors">
                <div className="font-bold text-[#2A2A29]">{p.razon_social}</div>
                <div className="text-xs text-slate-500 mt-1">RUC {p.ruc} · {p.sector_interno || "—"}</div>
                {p.trust_score != null && (
                  <div className="text-sm text-[#E31E24] font-bold mt-2">Trust {(p.trust_score * 100).toFixed(0)}%</div>
                )}
                {p.descripcion_publica && (
                  <p className="text-xs text-slate-600 mt-2 line-clamp-2">{p.descripcion_publica}</p>
                )}
              </li>
            ))}
          </ul>
        )}
        <Link href="/operators" className="inline-block mt-6 text-[#E31E24] font-bold text-sm uppercase tracking-wider hover:underline">
          Ver red completa de operadores →
        </Link>
      </section>
    </div>
  );
}

function BenefitCard({
  icon,
  title,
  body,
  metric,
}: {
  icon: string;
  title: string;
  body: string;
  metric: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-8 border border-slate-100 flex flex-col justify-between">
      <div>
        <span className="material-symbols-outlined text-[#E31E24] text-3xl mb-4">{icon}</span>
        <h3 className="font-headline font-bold text-2xl text-[#2A2A29] mb-3">{title}</h3>
        <p className="text-[#2A2A29]/70 leading-relaxed text-sm">{body}</p>
      </div>
      <div className="mt-6 pt-4 border-t border-slate-100 text-sm font-black text-[#2A2A29]">{metric}</div>
    </div>
  );
}
