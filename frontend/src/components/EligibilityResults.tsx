"use client";

import { useEffect, useState } from "react";
import { Link } from "@/navigation";
import { apiFetch } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
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

function clasificacionColor(c: string) {
  if (c === "elegible") return "text-green-700 bg-green-100";
  if (c === "viable_con_ajustes") return "text-amber-800 bg-amber-100";
  return "text-[#E31E24] bg-[#E31E24]/10";
}

function fallbackRazon(data: SimulationResponse): string {
  const s = Math.round(data.v_final);
  if (s >= 80) return `Score ${s}/100 — umbral de elegibilidad cumplido (≥80).`;
  if (s >= 60) return `Score ${s}/100 — viable con ajustes (60–79).`;
  return `Score ${s}/100 — por debajo del mínimo (60).`;
}

function fmtPts(n: number) {
  return `${n.toFixed(1)} pts`;
}

export default function EligibilityResults({ sessionId }: { sessionId: string }) {
  const [data, setData] = useState<SimulationResponse | null>(null);
  const [providers, setProviders] = useState<ProviderItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [showContinue, setShowContinue] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(!!getAccessToken());
  }, []);

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

  function submitFeedback(value: "up" | "down") {
    setFeedback(value);
    setFeedbackSent(true);
    if (typeof window !== "undefined") {
      localStorage.setItem(
        `sim_feedback_${sessionId}`,
        JSON.stringify({ value, at: new Date().toISOString() })
      );
    }
    setShowContinue(true);
  }

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

  const scorePct = Math.round(data.v_final);
  const dashOffset = 251.2 * (1 - Math.min(data.v_final, 100) / 100);
  const fiscal = data.proyeccion_fiscal;
  const razon = data.razon_clasificacion || fallbackRazon(data);
  const factores = data.factores_elegibilidad ?? [];
  const clUmbral = fiscal.condicion_cl_pct ?? 30;

  return (
    <div className="font-body antialiased flex flex-col gap-12 max-w-[1440px] mx-auto w-full px-6 md:px-8 pb-24">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 pt-8">
        <div className="max-w-2xl">
          <p className="text-[#E31E24] font-bold tracking-widest uppercase text-sm mb-2">
            Análisis completado
          </p>
          <h1 className="font-headline font-extrabold text-[#2A2A29] text-4xl md:text-5xl leading-tight mb-4">
            Resultados de Elegibilidad ZEEP
          </h1>
          <p className="text-[#2A2A29]/70 text-lg">
            Clasificación: <strong>{clasificacionLabel(data.clasificacion)}</strong> · Sector{" "}
            {data.sector}
          </p>
        </div>
        <Link
          href="/legal-ai"
          className="bg-[#E31E24] text-white font-headline font-bold px-6 py-4 rounded-xl shadow-lg hover:opacity-90 flex items-center gap-2"
        >
          <span className="material-symbols-outlined">gavel</span>
          Asesor legal IA
        </Link>
      </header>

      <section className="bg-white rounded-2xl p-6 border border-slate-200">
        <h3 className="font-headline font-bold text-lg text-[#2A2A29] mb-2">
          ¿Por qué esta clasificación?
        </h3>
        <p className="text-[#2A2A29]/85 text-sm leading-relaxed">{razon}</p>
        {factores.length > 0 && (
          <ul className="mt-3 space-y-1.5 text-sm text-[#2A2A29]/75 list-disc list-inside">
            {factores.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        )}
        {fiscal.nota_beneficios && (
          <p className="mt-3 text-xs text-[#D7B56D] font-bold uppercase tracking-wide">
            {fiscal.nota_beneficios}
          </p>
        )}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 bg-white rounded-2xl p-10 border border-[#D7B56D]/20 flex flex-col items-center">
          <h2 className="font-headline font-bold text-xl mb-8 w-full text-center text-[#2A2A29]">
            Score de elegibilidad
          </h2>
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
              <span className="font-headline font-extrabold text-6xl text-[#2A2A29]">
                {scorePct}%
              </span>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full mt-2 ${clasificacionColor(data.clasificacion)}`}
              >
                {clasificacionLabel(data.clasificacion)}
              </span>
            </div>
          </div>
          <div className="w-full space-y-2 text-sm text-[#2A2A29]/80">
            <div className="flex justify-between">
              <span>Base (inversión, plazo, empleo)</span>
              <strong>{fmtPts(data.v_base)}</strong>
            </div>
            <div className="flex justify-between">
              <span>Δ contenido local</span>
              <strong>+{fmtPts(data.delta_cl)}</strong>
            </div>
            <div className="flex justify-between">
              <span>Δ sector ({data.sector})</span>
              <strong>+{fmtPts(data.delta_sector)}</strong>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-2 font-bold">
              <span>Total (tope 100)</span>
              <strong>{fmtPts(data.v_final)}</strong>
            </div>
            {data.beneficio_cl_activo && (
              <p className="text-[#D7B56D] font-bold text-xs uppercase tracking-wider pt-2">
                Beneficio CL activo (≥{clUmbral}%)
              </p>
            )}
          </div>
        </div>

        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <BenefitCard
            icon="account_balance"
            title={`IR ZEEP ${fiscal.ir_zeep_pct}%`}
            body={
              data.beneficio_cl_activo
                ? `Tasa estándar ${fiscal.ir_estandar_pct}%. Con CL ≥${clUmbral}% aplica 0% IR. Ahorro proyectado 5 años: USD ${fiscal.ahorro_5_anos_usd.toLocaleString()}.`
                : `Tasa estándar ${fiscal.ir_estandar_pct}% (sin beneficio ZEEP hasta alcanzar CL ≥${clUmbral}%).`
            }
            metric={fiscal.igv_exonerado ? "IGV exonerado" : `IGV estándar (requiere CL ≥${clUmbral}%)`}
            varies={!fiscal.igv_exonerado}
          />
          <BenefitCard
            icon="local_shipping"
            title={fiscal.arancel_0 ? "Arancel 0% equipos" : "Arancel según NCM"}
            body={
              fiscal.arancel_0
                ? "Importación de equipos al régimen ZEEP con arancel 0% (condicionado a CL ≥30%)."
                : `Arancel según partida NCM hasta cumplir contenido local ≥${clUmbral}%.`
            }
            metric={fiscal.arancel_0 ? "Activo con beneficio CL" : "No activo — suba integración local"}
            varies={!fiscal.arancel_0}
          />
        </div>
      </section>

      {!feedbackSent && (
        <section className="bg-slate-50 border border-slate-200 rounded-2xl px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[#2A2A29]/80 font-medium">
            ¿Le resultó claro este análisis?
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => submitFeedback("up")}
              className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-bold hover:border-green-500 hover:text-green-700 transition-colors"
              aria-label="Útil"
            >
              👍 Sí
            </button>
            <button
              type="button"
              onClick={() => submitFeedback("down")}
              className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-bold hover:border-amber-500 hover:text-amber-700 transition-colors"
              aria-label="Poco claro"
            >
              👎 Podría mejorar
            </button>
          </div>
        </section>
      )}

      {showContinue && (
        <section className="rounded-2xl border-2 border-[#D7B56D] bg-gradient-to-br from-[#2A2A29] to-[#1a1a19] text-white p-8 md:p-10">
          <p className="text-[#D7B56D] text-[10px] font-black uppercase tracking-[0.3em] mb-3">
            Siguiente paso
          </p>
          <h2 className="font-headline font-extrabold text-2xl md:text-3xl mb-4">
            Continúe su expediente de inversión
          </h2>
          <p className="text-white/75 text-sm max-w-2xl mb-8">
            Registre su empresa inversora, vincule esta simulación y complete el perfil de proyecto
            para acceder al matchmaking con operadores locales del padrón RUC.
          </p>
          <ol className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[
              { n: "1", t: "Cuenta", d: "Registro o acceso" },
              { n: "2", t: "Perfil", d: "Datos empresa + proyecto" },
              { n: "3", t: "Match", d: "Operadores ZEEP" },
            ].map((step) => (
              <li
                key={step.n}
                className="flex items-start gap-3 bg-white/5 rounded-xl p-4 border border-white/10"
              >
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#E31E24] flex items-center justify-center text-xs font-black">
                  {step.n}
                </span>
                <div>
                  <p className="font-bold text-sm">{step.t}</p>
                  <p className="text-xs text-white/60">{step.d}</p>
                </div>
              </li>
            ))}
          </ol>
          {loggedIn ? (
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 bg-[#E31E24] text-white font-headline font-bold px-8 py-4 rounded-xl hover:opacity-90"
            >
              <span className="material-symbols-outlined">arrow_forward</span>
              Continuar onboarding
            </Link>
          ) : (
            <Link
              href="/login?next=onboarding"
              className="inline-flex items-center gap-2 bg-[#D7B56D] text-[#2A2A29] font-headline font-bold px-8 py-4 rounded-xl hover:opacity-90"
            >
              <span className="material-symbols-outlined">login</span>
              Iniciar sesión y continuar
            </Link>
          )}
          <p className="text-xs text-white/50 mt-4">
            Simulación guardada · sesión {sessionId.slice(0, 8)}…
            {feedback === "down" && " · Gracias, mejoraremos las explicaciones."}
          </p>
        </section>
      )}

      {data.alertas.length > 0 && (
        <section className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <h3 className="font-bold text-[#2A2A29] mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-600">warning</span>
            Alertas del motor de scoring
          </h3>
          <ul className="space-y-3">
            {data.alertas.map((a, i) => (
              <li key={i} className="text-sm text-[#2A2A29]/90">
                <span className="font-bold uppercase text-xs text-amber-700">{a.tipo}</span> —{" "}
                {a.descripcion}
                {a.impacto_score > 0 && (
                  <span className="text-slate-500"> ({fmtPts(a.impacto_score)})</span>
                )}
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
        <h2 className="font-headline font-bold text-2xl text-[#2A2A29] mb-4">
          Proveedores locales (PadronRUC)
        </h2>
        <p className="text-[#2A2A29]/70 mb-6 text-sm">
          Vista previa — complete el onboarding para matchmaking personalizado.
        </p>
        {providers.length === 0 ? (
          <p className="text-sm text-slate-500">Sin proveedores en catálogo para este sector.</p>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {providers.map((p) => (
              <li
                key={p.ruc}
                className="p-4 rounded-xl border border-slate-100 hover:border-[#E31E24]/30 transition-colors"
              >
                <div className="font-bold text-[#2A2A29]">{p.razon_social}</div>
                <div className="text-xs text-slate-500 mt-1">
                  RUC {p.ruc} · {p.sector_interno || "—"}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function BenefitCard({
  icon,
  title,
  body,
  metric,
  varies = false,
}: {
  icon: string;
  title: string;
  body: string;
  metric: string;
  varies?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl p-8 border border-slate-100 flex flex-col justify-between">
      <div>
        <span className="material-symbols-outlined text-[#E31E24] text-3xl mb-4">{icon}</span>
        <h3 className="font-headline font-bold text-2xl text-[#2A2A29] mb-3">{title}</h3>
        <p className="text-[#2A2A29]/70 leading-relaxed text-sm">{body}</p>
      </div>
      <div className="mt-6 pt-4 border-t border-slate-100">
        <p className="text-sm font-black text-[#2A2A29]">{metric}</p>
        {varies && (
          <p className="text-[10px] text-amber-700 font-bold uppercase mt-1 tracking-wide">
            Varía según contenido local ≥30%
          </p>
        )}
      </div>
    </div>
  );
}
