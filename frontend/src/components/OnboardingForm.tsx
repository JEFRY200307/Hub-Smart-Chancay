"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/navigation";
import AgentOrchestratorPanel from "@/components/AgentOrchestratorPanel";
import { createProfile, uploadDocument } from "@/lib/api/onboarding";
import { fetchMe, updateInvestorProfile } from "@/lib/api/auth-profile";
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

export default function OnboardingForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meLoading, setMeLoading] = useState(true);
  const [denied, setDenied] = useState<string | null>(null);

  const [empresaDisplay, setEmpresaDisplay] = useState({
    razon_social: "",
    pais_origen: "",
    tax_id_internacional: "",
    rep_nombre: "",
    rep_pasaporte: "",
  });

  const [sector, setSector] = useState<SimulationRequest["sector"]>("tech");
  const [proyectoFile, setProyectoFile] = useState<File | null>(null);
  const [projectForm, setProjectForm] = useState({
    proyecto_nombre: "",
    proyecto_monto_usd: "" as string | number,
    area_terreno_m2: "" as string | number,
    teus_estimados: "" as string | number,
  });

  const [sessionId] = useState(() => newSessionId());

  useEffect(() => {
    if (!getAccessToken()) {
      router.push("/login?next=onboarding");
      return;
    }
    fetchMe()
      .then((me) => {
        if (!me.profile?.can_access_onboarding) {
          setDenied(
            "El onboarding ZEEP es solo para empresas inversoras. Use el dashboard o marketplace según su perfil."
          );
          return;
        }
        const rep = (me.profile.rep_legal_nombre_pasaporte || "").split("|");
        setEmpresaDisplay({
          razon_social: me.profile.razon_social || "",
          pais_origen: me.profile.pais_origen || "",
          tax_id_internacional: me.profile.tax_id_internacional || "",
          rep_nombre: rep[0]?.trim() || "",
          rep_pasaporte: rep[1]?.trim() || "",
        });
      })
      .catch(() => setDenied("No se pudo cargar su perfil."))
      .finally(() => setMeLoading(false));
  }, [router]);

  const empresaOk =
    empresaDisplay.razon_social.trim().length > 1 &&
    empresaDisplay.pais_origen.length === 2;

  async function saveEmpresaStep(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const repCombined =
        empresaDisplay.rep_nombre || empresaDisplay.rep_pasaporte
          ? `${empresaDisplay.rep_nombre}|${empresaDisplay.rep_pasaporte}`
          : undefined;
      await updateInvestorProfile({
        pais_origen: empresaDisplay.pais_origen,
        tax_id_internacional: empresaDisplay.tax_id_internacional || undefined,
        rep_legal_nombre_pasaporte: repCombined,
      });
      setStep(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar perfil");
    } finally {
      setLoading(false);
    }
  }

  async function submitProject(e: React.FormEvent) {
    e.preventDefault();
    if (!proyectoFile) {
      setError("Adjunte el perfil del proyecto (PDF o Word).");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const monto =
        projectForm.proyecto_monto_usd === "" ||
        projectForm.proyecto_monto_usd === undefined
          ? undefined
          : Number(projectForm.proyecto_monto_usd);

      const simPayload: SimulationRequest = {
        session_id: sessionId,
        sector,
        monto_inversion_usd: monto && monto > 0 ? monto : 1_000_000,
        empleo_directo: 0,
        empleo_indirecto: 0,
        porcentaje_cl: 0,
        tiempo_instalacion_meses: 18,
        pais_origen: empresaDisplay.pais_origen,
        exportacion_pct: 0,
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
        proyecto_nombre: projectForm.proyecto_nombre,
        proyecto_monto_usd: monto,
        proyecto_area_terreno_m2:
          projectForm.area_terreno_m2 === ""
            ? undefined
            : Number(projectForm.area_terreno_m2),
        proyecto_teus_estimados:
          projectForm.teus_estimados === ""
            ? undefined
            : Number(projectForm.teus_estimados),
        proyecto_empleo_directo: 0,
        proyecto_empleo_indirecto: 0,
        proyecto_porcentaje_cl: 0,
      });

      const up = await uploadDocument(profile.id, proyectoFile, "perfil_proyecto");
      setFlowValue(FLOW_KEYS.investorProfileId, profile.id);
      setFlowValue(FLOW_KEYS.sector, profile.sector);
      setFlowValue(FLOW_KEYS.empresaNombre, profile.empresa_razon_social);
      if (up?.url) {
        /* document stored */
      }
      router.push("/onboarding/processing");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return;
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "No se pudo crear el proyecto."
      );
    } finally {
      setLoading(false);
    }
  }

  if (meLoading) {
    return (
      <p className="text-center py-20 text-slate-400 font-bold uppercase text-sm">
        Cargando perfil…
      </p>
    );
  }

  if (denied) {
    return (
      <div className="max-w-lg mx-auto p-8 bg-amber-50 border border-amber-200 rounded-xl">
        <p className="text-amber-900 font-semibold">{denied}</p>
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="mt-4 text-[#E31E24] font-bold text-xs uppercase"
        >
          Ir al dashboard →
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <aside className="lg:col-span-4">
        <AgentOrchestratorPanel chain={ONBOARD_CHAIN} compact />
        <div className="mt-4 flex gap-2 text-[10px] font-black uppercase">
          <span className={step === 0 ? "text-[#E31E24]" : "text-slate-400"}>
            1. Empresa
          </span>
          <span className="text-slate-300">→</span>
          <span className={step === 1 ? "text-[#E31E24]" : "text-slate-400"}>
            2. Proyecto
          </span>
        </div>
      </aside>

      <section className="lg:col-span-8 space-y-6">
        {step === 0 && (
          <form onSubmit={saveEmpresaStep} className="space-y-6">
            <div className="bg-white p-8 rounded-xl border border-slate-100">
              <h4 className="font-black uppercase text-[#2A2A29] mb-1">
                Perfil de la empresa inversora
              </h4>
              <p className="text-xs text-slate-500 mb-6">
                Datos registrados al crear su cuenta. Complete país de origen si aún
                no lo indicó.
              </p>

              <div className="p-4 bg-slate-50 rounded-lg mb-6 border border-slate-100">
                <p className="text-[10px] font-bold uppercase text-slate-500">
                  Razón social internacional
                </p>
                <p className="font-bold text-[#2A2A29] mt-1">
                  {empresaDisplay.razon_social || "—"}
                </p>
                <p className="text-[10px] text-slate-400 mt-2">
                  (Definida en el registro — no se vuelve a pedir)
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                    País de origen *
                  </label>
                  <select
                    required
                    value={empresaDisplay.pais_origen}
                    onChange={(e) =>
                      setEmpresaDisplay((f) => ({
                        ...f,
                        pais_origen: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                  >
                    <option value="">Seleccione…</option>
                    <option value="CN">China</option>
                    <option value="US">Estados Unidos</option>
                    <option value="DE">Alemania</option>
                    <option value="JP">Japón</option>
                    <option value="KR">Corea del Sur</option>
                    <option value="PE">Perú</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                    Tax ID internacional (opcional)
                  </label>
                  <input
                    value={empresaDisplay.tax_id_internacional}
                    onChange={(e) =>
                      setEmpresaDisplay((f) => ({
                        ...f,
                        tax_id_internacional: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                    placeholder="Registro fiscal en país de origen"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                      Representante legal (opcional)
                    </label>
                    <input
                      value={empresaDisplay.rep_nombre}
                      onChange={(e) =>
                        setEmpresaDisplay((f) => ({
                          ...f,
                          rep_nombre: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                      placeholder="Nombre completo"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                      Pasaporte (opcional)
                    </label>
                    <input
                      value={empresaDisplay.rep_pasaporte}
                      onChange={(e) =>
                        setEmpresaDisplay((f) => ({
                          ...f,
                          rep_pasaporte: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                      placeholder="N.º pasaporte"
                    />
                  </div>
                </div>
              </div>
            </div>
            {error && <p className="text-sm text-[#E31E24] font-semibold">{error}</p>}
            <button
              type="submit"
              disabled={loading || !empresaOk}
              className="px-10 py-4 bg-[#E31E24] text-white font-black text-xs uppercase rounded-lg disabled:opacity-50"
            >
              {loading ? "Guardando…" : "Continuar al proyecto →"}
            </button>
          </form>
        )}

        {step === 1 && (
          <form onSubmit={submitProject} className="space-y-6">
            <div className="bg-white p-8 rounded-xl border border-slate-100">
              <h4 className="font-black uppercase mb-4 text-[#2A2A29]">
                Datos del proyecto de inversión
              </h4>
              <p className="text-xs text-slate-500 mb-4">
                Empresa: <strong>{empresaDisplay.razon_social}</strong> ·{" "}
                {empresaDisplay.pais_origen}
              </p>

              <p className="text-[10px] font-black uppercase text-slate-500 mb-2">
                Sector industrial / rubro *
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                {SECTORS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSector(s.id)}
                    className={`p-4 rounded-xl border-2 text-left ${
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

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                    Nombre del proyecto en Chancay *
                  </label>
                  <input
                    required
                    value={projectForm.proyecto_nombre}
                    onChange={(e) =>
                      setProjectForm((f) => ({
                        ...f,
                        proyecto_nombre: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                    placeholder="Ej. Planta de ensamblaje ZEEP"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                    Archivo perfil del proyecto (PDF / Word) *
                  </label>
                  <input
                    type="file"
                    required
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={(e) =>
                      setProyectoFile(e.target.files?.[0] ?? null)
                    }
                    className="w-full text-sm"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Contexto para los agentes de IA (obligatorio).
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                      Inversión proyectada (USD)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={projectForm.proyecto_monto_usd}
                      onChange={(e) =>
                        setProjectForm((f) => ({
                          ...f,
                          proyecto_monto_usd: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                      placeholder="Opcional"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                      Área terreno (m²)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={projectForm.area_terreno_m2}
                      onChange={(e) =>
                        setProjectForm((f) => ({
                          ...f,
                          area_terreno_m2: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                      placeholder="Opcional"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                      TEUs estimados
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={projectForm.teus_estimados}
                      onChange={(e) =>
                        setProjectForm((f) => ({
                          ...f,
                          teus_estimados: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                      placeholder="Opcional"
                    />
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <p className="text-sm text-[#E31E24] font-semibold bg-red-50 px-4 py-3 rounded-lg">
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(0)}
                className="px-6 py-3 border border-slate-300 text-xs font-black uppercase rounded-lg"
              >
                ← Volver
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-10 py-4 bg-[#E31E24] text-white font-black text-xs uppercase rounded-lg disabled:opacity-50"
              >
                {loading ? "Procesando…" : "Crear proyecto y continuar"}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
