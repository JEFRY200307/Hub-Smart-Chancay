"use client";

import { useState } from "react";
import { useRouter } from "@/navigation";
import AgentOrchestratorPanel from "@/components/AgentOrchestratorPanel";
import { createProfile } from "@/lib/api/onboarding";
import { calculateSimulation, buildVariablesSector, newSessionId } from "@/lib/simulation";
import { ApiError } from "@/lib/api";
import { FLOW_KEYS, setFlowValue } from "@/lib/flow";
import { getAccessToken } from "@/lib/auth";
import type { AgentId } from "@/lib/agents";
import type { SimulationRequest } from "@/lib/types";

const SECTORS = [
  { id: "manufactura", label: "Manufactura", icon: "precision_manufacturing" },
  { id: "ckd", label: "CKD / Automotriz", icon: "directions_car" },
  { id: "tech", label: "Tecnología & I+D", icon: "biotech" },
] as const;

const ONBOARD_CHAIN: AgentId[] = ["orquestador", "financiero", "legal", "auditor"];

function formatUsd(n: number) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function OnboardingForm() {
  const router = useRouter();
  const [sector, setSector] = useState<SimulationRequest["sector"]>("tech");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    empresa_razon_social: "",
    empresa_pais_origen: "CN",
    proyecto_nombre: "",
    proyecto_monto_usd: 5_000_000,
    proyecto_empleo_directo: 100,
    proyecto_empleo_indirecto: 50,
    proyecto_porcentaje_cl: 35,
    tiempo_instalacion_meses: 18,
    exportacion_pct: 40,
  });

  /** Nueva sesión por envío para evitar colisión con simulaciones previas en BD. */
  const [sessionId] = useState(() => newSessionId());

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!getAccessToken()) {
      router.push("/login?next=onboarding");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const simPayload: SimulationRequest = {
        session_id: sessionId,
        sector,
        monto_inversion_usd: form.proyecto_monto_usd,
        empleo_directo: form.proyecto_empleo_directo,
        empleo_indirecto: form.proyecto_empleo_indirecto,
        porcentaje_cl: form.proyecto_porcentaje_cl,
        tiempo_instalacion_meses: form.tiempo_instalacion_meses,
        pais_origen: form.empresa_pais_origen,
        exportacion_pct: form.exportacion_pct,
        variables_sector: buildVariablesSector(sector, {
          tipo_proceso: "continuo",
          requiere_anexo_4: false,
          va_estimado_pct: 35,
          tipo_impacto_ambiental: "medio",
        }),
      };

      const sim = await calculateSimulation(simPayload);
      setFlowValue(FLOW_KEYS.simulationSession, sim.session_id);

      const profile = await createProfile({
        session_id: sim.session_id,
        sector,
        empresa_razon_social: form.empresa_razon_social,
        empresa_pais_origen: form.empresa_pais_origen,
        proyecto_nombre: form.proyecto_nombre,
        proyecto_monto_usd: form.proyecto_monto_usd,
        proyecto_empleo_directo: form.proyecto_empleo_directo,
        proyecto_empleo_indirecto: form.proyecto_empleo_indirecto,
        proyecto_porcentaje_cl: form.proyecto_porcentaje_cl,
        proyecto_exportacion_pct: form.exportacion_pct,
      });
      setFlowValue(FLOW_KEYS.investorProfileId, profile.id);
      setFlowValue(FLOW_KEYS.sector, profile.sector);
      setFlowValue(FLOW_KEYS.empresaNombre, profile.empresa_razon_social);
      router.push("/onboarding/processing");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return;
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "No se pudo crear el perfil. Verifique su sesión e intente de nuevo."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <aside className="lg:col-span-4">
        <AgentOrchestratorPanel chain={ONBOARD_CHAIN} compact />
        <p className="text-xs text-slate-500 mt-4 leading-relaxed">
          Los montos están en <strong>dólares estadounidenses (USD)</strong>, como exige
          la normativa de inversión en la ZEEP.
        </p>
      </aside>
      <section className="lg:col-span-8 space-y-6">
        <div className="bg-white p-8 rounded-xl border border-slate-100">
          <h4 className="font-black uppercase mb-1 text-[#2A2A29]">Sector ZEEP</h4>
          <p className="text-xs text-slate-500 mb-4">
            Clasificación de su proyecto según Ley N° 32449 (manufactura, CKD o tecnología).
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {SECTORS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSector(s.id)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  sector === s.id
                    ? "border-[#E31E24] bg-[#E31E24]/5"
                    : "border-transparent bg-slate-50"
                }`}
              >
                <span className="material-symbols-outlined text-[#E31E24]">
                  {s.icon}
                </span>
                <p className="font-bold text-sm mt-2">{s.label}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-xl border border-slate-100 space-y-5">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
              Razón social de la empresa
            </label>
            <input
              required
              placeholder="Ej. Shanghai Pacific Logistics Holdings Ltd."
              value={form.empresa_razon_social}
              onChange={(e) =>
                setForm((f) => ({ ...f, empresa_razon_social: e.target.value }))
              }
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
              Nombre del proyecto en Chancay
            </label>
            <input
              required
              placeholder="Ej. Planta de ensamblaje y hub logístico ZEEP"
              value={form.proyecto_nombre}
              onChange={(e) =>
                setForm((f) => ({ ...f, proyecto_nombre: e.target.value }))
              }
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                Inversión estimada (USD)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#E31E24] font-bold text-sm">
                  $
                </span>
                <input
                  type="number"
                  required
                  min={100000}
                  step={100000}
                  value={form.proyecto_monto_usd}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      proyecto_monto_usd: Number(e.target.value) || 0,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 pl-8 pr-4 py-3 text-sm"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Monto total del proyecto en{" "}
                <strong>dólares estadounidenses</strong>. Ejemplo:{" "}
                {formatUsd(form.proyecto_monto_usd)} — usado para elegibilidad ZEEP e
                incentivos fiscales.
              </p>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                País de origen del capital
              </label>
              <select
                value={form.empresa_pais_origen}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    empresa_pais_origen: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
              >
                <option value="CN">China</option>
                <option value="US">Estados Unidos</option>
                <option value="DE">Alemania</option>
                <option value="JP">Japón</option>
                <option value="KR">Corea del Sur</option>
                <option value="PE">Perú</option>
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                Código ISO del país de la empresa inversora.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                Empleo directo
              </label>
              <input
                type="number"
                min={0}
                value={form.proyecto_empleo_directo}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    proyecto_empleo_directo: Number(e.target.value),
                  }))
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
              />
              <p className="text-[11px] text-slate-500 mt-1">Puestos en planta/operación.</p>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                Empleo indirecto
              </label>
              <input
                type="number"
                min={0}
                value={form.proyecto_empleo_indirecto}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    proyecto_empleo_indirecto: Number(e.target.value),
                  }))
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
              />
              <p className="text-[11px] text-slate-500 mt-1">Cadena de proveedores locales.</p>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                Contenido local (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={form.proyecto_porcentaje_cl}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    proyecto_porcentaje_cl: Number(e.target.value),
                  }))
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Porcentaje de insumos o mano de obra peruana (0–100).
              </p>
            </div>
          </div>
        </div>

        {error && (
          <p className="text-sm text-[#E31E24] font-semibold bg-red-50 border border-red-100 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full md:w-auto px-10 py-4 bg-[#E31E24] text-white font-black text-xs uppercase tracking-widest rounded-lg disabled:opacity-50"
        >
          {loading ? "Guardando perfil…" : "Continuar al siguiente paso"}
        </button>
      </section>
    </form>
  );
}
