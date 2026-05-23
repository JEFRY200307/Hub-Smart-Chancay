"use client";

import { useEffect, useState } from "react";
import { Link, useRouter } from "@/navigation";
import AgentOrchestratorPanel from "@/components/AgentOrchestratorPanel";
import { getRoadmap } from "@/lib/api/onboarding";
import { verifyEmailOtp } from "@/lib/api/auth-extended";
import { login } from "@/lib/auth";
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
  const [showAuth, setShowAuth] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [loginEmail, setLoginEmail] = useState("inversor@hubchancay.pe");
  const [loginPass, setLoginPass] = useState("HubChancay2025!");
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
        if (pid) {
          try {
            const r = await getRoadmap(pid);
            setRoadmap(r.roadmap);
          } catch {
            setRoadmap([
              { fase: "Documentación", estado: "pendiente" },
              { fase: "Matchmaking", estado: "listo" },
              { fase: "Habilitación ZEEP", estado: "en_progreso" },
            ]);
          }
        }
        setShowAuth(true);
      }, STEPS.length * 900 + 400)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    await login(loginEmail, loginPass);
    router.push("/dashboard/matchmaking");
  }

  async function handleOtp(e: React.FormEvent) {
    e.preventDefault();
    await verifyEmailOtp(otpEmail, otpCode);
    router.push("/onboarding");
  }

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
                Roadmap API
              </p>
              {roadmap.map((ph) => (
                <p key={ph.fase} className="text-sm">
                  {ph.fase}: <span className="text-[#D7B56D]">{ph.estado}</span>
                </p>
              ))}
            </div>
          )}
        </div>
      </div>

      {showAuth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="font-black text-lg uppercase mb-4">
              Acceso institucional
            </h3>
            <form onSubmit={handleLogin} className="space-y-3 mb-6">
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="Email"
              />
              <input
                type="password"
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="Contraseña"
              />
              <button
                type="submit"
                className="w-full py-3 bg-[#E31E24] text-white text-xs font-black uppercase rounded-lg"
              >
                Iniciar sesión demo
              </button>
            </form>
            <p className="text-xs text-slate-500 mb-2">O verificar OTP empresa:</p>
            <form onSubmit={handleOtp} className="space-y-2">
              <input
                type="email"
                value={otpEmail}
                onChange={(e) => setOtpEmail(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="Email corporativo"
              />
              <input
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="Código OTP"
              />
              <button
                type="submit"
                className="w-full py-2 border-2 border-[#D7B56D] text-xs font-bold uppercase rounded-lg"
              >
                Verificar email
              </button>
            </form>
            <Link
              href="/dashboard/matchmaking"
              className="block text-center mt-4 text-xs font-bold text-[#E31E24]"
            >
              Continuar al matchmaking →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
