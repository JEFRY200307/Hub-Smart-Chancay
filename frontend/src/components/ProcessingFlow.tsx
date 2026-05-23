"use client";

import { useEffect, useState } from "react";
import { Link, useRouter } from "@/navigation";
import AgentOrchestratorPanel from "@/components/AgentOrchestratorPanel";
import { getRoadmap } from "@/lib/api/onboarding";
import { getAccessToken } from "@/lib/auth";
import { FLOW_KEYS, getInvestorProfileId } from "@/lib/flow";
import type { AgentId } from "@/lib/agents";

const STEPS = [
  "Validando simulación ZEEP…",
  "Agente financiero: proyección IR/IGV…",
  "Agente legal: checklist Ley 32449…",
  "Agente auditor: integridad de datos…",
  "Generando roadmap de habilitación…",
];

const CHAIN: AgentId[] = [
  "orquestador",
  "financiero",
  "legal",
  "tecnico",
  "auditor",
];

export default function ProcessingFlow() {
  const router = useRouter();
  const [stepIdx, setStepIdx] = useState(0);
  const [roadmap, setRoadmap] = useState<
    { fase: string; estado: string }[] | null
  >(null);
  const [phase, setPhase] = useState<"running" | "done" | "need_login">("running");
  const [activeAgent, setActiveAgent] = useState<AgentId>("orquestador");

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    STEPS.forEach((_, i) => {
      timers.push(
        setTimeout(() => {
          setStepIdx(i);
          if (i === 1) setActiveAgent("financiero");
          if (i === 2) setActiveAgent("legal");
          if (i === 3) setActiveAgent("auditor");
          if (i === 4) setActiveAgent("tecnico");
        }, i * 900)
      );
    });
    timers.push(
      setTimeout(async () => {
        const pid = getInvestorProfileId();
        if (pid && getAccessToken()) {
          try {
            const r = await getRoadmap(pid);
            setRoadmap(r.roadmap);
          } catch {
            setRoadmap([
              { fase: "elegibilidad", estado: "completado" },
              { fase: "validacion_legal", estado: "en_progreso" },
              { fase: "contratacion", estado: "pendiente" },
              { fase: "operacion", estado: "pendiente" },
            ]);
          }
        }

        if (getAccessToken()) {
          setPhase("done");
          timers.push(
            setTimeout(() => router.push("/dashboard/matchmaking"), 2500)
          );
        } else {
          setPhase("need_login");
        }
      }, STEPS.length * 900 + 400)
    );
    return () => timers.forEach(clearTimeout);
  }, [router]);

  return (
    <div className="min-h-screen pt-24 px-8 max-w-5xl mx-auto">
      <div className="grid md:grid-cols-3 gap-8">
        <AgentOrchestratorPanel chain={CHAIN} activeAgent={activeAgent} />
        <div className="md:col-span-2 bg-[#2A2A29] text-white rounded-2xl p-8">
          <p className="text-[#D7B56D] text-[10px] font-black uppercase tracking-widest mb-4">
            COMEX.AI Processing
          </p>
          <ul className="space-y-3 font-mono text-sm">
            {STEPS.map((s, i) => (
              <li
                key={s}
                className={
                  i <= stepIdx ? "text-green-400" : "text-white/30"
                }
              >
                {i <= stepIdx ? "✓" : "○"} {s}
              </li>
            ))}
          </ul>
          {roadmap && (
            <div className="mt-8 border-t border-white/20 pt-6">
              <p className="text-xs font-bold uppercase text-[#D7B56D] mb-3">
                Roadmap de habilitación
              </p>
              {roadmap.map((ph) => (
                <p key={ph.fase} className="text-sm capitalize">
                  {ph.fase.replace(/_/g, " ")}:{" "}
                  <span className="text-[#D7B56D]">{ph.estado}</span>
                </p>
              ))}
            </div>
          )}

          {phase === "done" && (
            <div className="mt-8 p-4 bg-green-900/40 border border-green-500/40 rounded-xl">
              <p className="text-green-300 font-bold text-sm">
                Proyecto registrado correctamente.
              </p>
              <p className="text-white/70 text-xs mt-2">
                Ya tiene sesión activa — redirigiendo al matchmaking…
              </p>
              <Link
                href="/dashboard/matchmaking"
                className="inline-block mt-4 text-xs font-black uppercase text-[#D7B56D]"
              >
                Ir ahora →
              </Link>
            </div>
          )}
        </div>
      </div>

      {phase === "need_login" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl text-center">
            <h3 className="font-black text-lg uppercase mb-2">
              Sesión requerida
            </h3>
            <p className="text-sm text-slate-600 mb-6">
              Su sesión expiró o no está iniciada. Inicie sesión para continuar al
              matchmaking con su proyecto.
            </p>
            <Link
              href={`/login?next=${encodeURIComponent("/dashboard/matchmaking")}`}
              className="inline-block w-full py-3 bg-[#E31E24] text-white text-xs font-black uppercase rounded-lg"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
