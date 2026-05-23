"use client";

import { useCallback, useEffect, useState } from "react";
import { Link, useRouter } from "@/navigation";
import AgentOrchestratorPanel from "@/components/AgentOrchestratorPanel";
import {
  runMatchmaking,
  getMatch,
  requestReunion,
  type MatchResponse,
  type MatchCandidato,
} from "@/lib/api/marketplace";
import {
  FLOW_KEYS,
  getInvestorProfileId,
  getFlowValue,
  setFlowValue,
} from "@/lib/flow";
import { getAccessToken } from "@/lib/auth";
import type { AgentId } from "@/lib/agents";

const MATCH_AGENT_CHAIN: AgentId[] = [
  "orquestador",
  "matchmaker",
  "legal",
  "auditor",
];

const CAT_LABELS: Record<string, string> = {
  ingeniero_cip: "Ingenieros CIP",
  abogado_cal: "Abogados CAL",
  proveedor_local: "Proveedores PadronRUC",
};

export default function MatchmakingPanel() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [match, setMatch] = useState<MatchResponse | null>(null);
  const [activeAgent, setActiveAgent] = useState<AgentId | null>(null);
  const profileId = getInvestorProfileId();

  const loadExisting = useCallback(async (matchId: string) => {
    try {
      const data = await getMatch(matchId);
      setMatch(data);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const saved = getFlowValue(FLOW_KEYS.matchId);
    if (saved) loadExisting(saved);
  }, [loadExisting]);

  async function ejecutarMatch() {
    if (!getAccessToken()) {
      router.push("/login?next=matchmaking");
      return;
    }
    const pid = getInvestorProfileId();
    if (!pid) {
      setError(
        "Complete el onboarding para crear su perfil de inversor antes del matchmaking."
      );
      return;
    }

    setLoading(true);
    setError(null);
    setMatch(null);
    setActiveAgent("orquestador");

    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(
      setTimeout(() => setActiveAgent("matchmaker"), 600),
      setTimeout(() => setActiveAgent("legal"), 1400),
      setTimeout(() => setActiveAgent("auditor"), 2200)
    );

    try {
      const result = await runMatchmaking(pid);
      setMatch(result);
      setFlowValue(FLOW_KEYS.matchId, result.match_id);
      setActiveAgent(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error en matchmaking");
      setActiveAgent(null);
    } finally {
      setLoading(false);
      timers.forEach(clearTimeout);
    }
  }

  async function solicitarReunion(
    candidato: MatchCandidato,
    categoria: string
  ) {
    const mid = match?.match_id ?? getFlowValue(FLOW_KEYS.matchId);
    if (!mid) return;
    try {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() + 7);
      await requestReunion(mid, {
        candidato_id: candidato.candidato_id,
        categoria,
        fecha_preferida: fecha.toISOString().slice(0, 10),
        agenda: `Reunión institucional — ${candidato.nombre}`,
      });
      alert("Reunión solicitada. Revise Concierge para seguimiento.");
    } catch (e) {
      alert(e instanceof Error ? e.message : "No se pudo solicitar reunión");
    }
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full min-w-0">
      <div className="mb-10">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#E31E24] mb-2">
          Matchmaker institucional
        </p>
        <h1 className="text-4xl font-black text-[#2A2A29] uppercase tracking-tight">
          Ecosistema de Matchmaking
        </h1>
        <p className="text-slate-600 mt-2 max-w-2xl">
          POST /marketplace/matches — CIP, CAL y proveedores validados con
          justificación del agente matchmaker.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-4">
          <AgentOrchestratorPanel
            chain={MATCH_AGENT_CHAIN}
            activeAgent={loading ? activeAgent : null}
          />
          {!profileId && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm">
              <p className="font-bold text-amber-900 mb-2">Perfil requerido</p>
              <Link
                href="/onboarding"
                className="text-[#E31E24] font-bold text-xs uppercase"
              >
                Ir a onboarding →
              </Link>
            </div>
          )}
          <button
            type="button"
            disabled={loading}
            onClick={ejecutarMatch}
            className="w-full py-4 bg-[#E31E24] text-white font-black text-xs uppercase tracking-widest rounded-xl disabled:opacity-50 hover:bg-[#c4191f] transition-colors"
          >
            {loading ? "Ejecutando match…" : "Ejecutar match institucional"}
          </button>
          <Link
            href="/match"
            className="block text-center text-xs font-bold text-[#D7B56D] uppercase"
          >
            Ver feed de oportunidades →
          </Link>
        </div>

        <div className="lg:col-span-8 space-y-6">
          {error && (
            <p className="text-sm text-[#E31E24] font-semibold">{error}</p>
          )}

          {match?.resultados.map((cat) => (
            <section
              key={cat.categoria}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
            >
              <div className="px-6 py-4 bg-[#2A2A29] text-white flex justify-between items-center">
                <h2 className="font-black text-sm uppercase tracking-wider">
                  {CAT_LABELS[cat.categoria] ?? cat.categoria}
                </h2>
                <span className="text-[#D7B56D] text-xs font-bold">
                  Score prom. {(cat.score_promedio * 100).toFixed(0)}%
                </span>
              </div>
              <p className="px-6 py-3 text-sm text-slate-600 border-b bg-slate-50 italic">
                {cat.justificacion_agente}
              </p>
              <div className="divide-y">
                {cat.candidatos.map((c) => (
                  <div
                    key={c.candidato_id}
                    className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <h3 className="font-bold text-[#2A2A29]">{c.nombre}</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {c.especialidad_principal ?? "Especialista ZEEP"} ·{" "}
                        {c.numero_cip || c.numero_cal || "Proveedor"}
                      </p>
                      {c.justificacion && (
                        <p className="text-sm text-slate-600 mt-2">
                          {c.justificacion}
                        </p>
                      )}
                      <span className="inline-block mt-2 text-[10px] font-bold uppercase px-2 py-1 bg-green-100 text-green-800 rounded">
                        {c.validacion_institucional}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-2xl font-black text-[#E31E24]">
                        {(c.score_compatibilidad * 100).toFixed(0)}%
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          solicitarReunion(c, cat.categoria)
                        }
                        className="px-4 py-2 border-2 border-[#D7B56D] text-[#2A2A29] text-xs font-black uppercase rounded-lg hover:bg-[#D7B56D]/10"
                      >
                        Solicitar reunión
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}

          {!match && !loading && (
            <p className="text-center text-slate-400 py-16 text-sm uppercase tracking-widest font-bold">
              Pulse ejecutar match para ver candidatos CIP / CAL / proveedor
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
