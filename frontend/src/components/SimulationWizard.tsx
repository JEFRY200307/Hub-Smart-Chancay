"use client";

import { useMemo, useState } from "react";
import { useRouter } from "@/navigation";
import {
  buildVariablesSector,
  calculateSimulation,
  newSessionId,
} from "@/lib/simulation";
import { FLOW_KEYS, setFlowValue } from "@/lib/flow";
import type { SimulationRequest } from "@/lib/types";

const PAISES = [
  { code: "CN", label: "China" },
  { code: "US", label: "Estados Unidos" },
  { code: "DE", label: "Alemania" },
  { code: "JP", label: "Japón" },
  { code: "KR", label: "Corea del Sur" },
  { code: "PE", label: "Perú" },
];

type Sector = SimulationRequest["sector"];

export default function SimulationWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionId = useMemo(() => newSessionId(), []);

  const [sector, setSector] = useState<Sector>("manufactura");
  const [form, setForm] = useState({
    monto_inversion_usd: 5_000_000,
    empleo_directo: 120,
    empleo_indirecto: 80,
    porcentaje_cl: 35,
    tiempo_instalacion_meses: 18,
    pais_origen: "CN",
    exportacion_pct: 40,
    tipo_proceso: "continuo",
    requiere_anexo_4: false,
    va_estimado_pct: 38,
    tipo_impacto_ambiental: "medio",
    producto_ensamblado: "vehiculo_comercial",
    ratio_ckd_importado: 45,
    mercado_destino: "regional",
    tipo_servicio: "software",
    pct_servicios_exportables: 55,
    requiere_datacenter: true,
    ratio_empleos_tech: 0.65,
  });

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const payload: SimulationRequest = {
        session_id: sessionId,
        sector,
        monto_inversion_usd: form.monto_inversion_usd,
        empleo_directo: form.empleo_directo,
        empleo_indirecto: form.empleo_indirecto,
        porcentaje_cl: form.porcentaje_cl,
        tiempo_instalacion_meses: form.tiempo_instalacion_meses,
        pais_origen: form.pais_origen,
        exportacion_pct: form.exportacion_pct,
        variables_sector: buildVariablesSector(sector, form),
      };

      const result = await calculateSimulation(payload);
      setFlowValue(FLOW_KEYS.simulationSession, result.session_id);
      setFlowValue(FLOW_KEYS.sector, result.sector);
      if (typeof window !== "undefined") {
        localStorage.setItem("last_simulation_session", result.session_id);
        localStorage.setItem("last_simulation_sector", result.sector);
      }
      router.push(`/dashboard/results?session=${result.session_id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al calcular elegibilidad");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-[#D7B56D]/30 shadow-xl overflow-hidden">
      <div className="bg-[#2A2A29] text-white px-8 py-6 flex justify-between items-center">
        <div>
          <p className="text-[#D7B56D] text-[10px] font-black uppercase tracking-[0.3em]">COMEX.AI · ZEEP</p>
          <h2 className="text-2xl font-black uppercase tracking-tight">Diagnóstico de Viabilidad</h2>
        </div>
        <span className="text-sm font-bold text-[#D7B56D]">Paso {step}/3</span>
      </div>

      <div className="p-8 space-y-6">
        {step === 1 && (
          <>
            <p className="text-[#2A2A29]/70 text-sm">Seleccione el sector de inversión según su proyecto en Chancay.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(
                [
                  ["manufactura", "Manufactura", "precision_manufacturing"],
                  ["ckd", "CKD / Automotriz", "directions_car"],
                  ["tech", "Tecnología / IDI", "memory"],
                ] as const
              ).map(([id, label, icon]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSector(id)}
                  className={`p-5 rounded-xl border-2 text-left transition-all ${
                    sector === id
                      ? "border-[#E31E24] bg-[#E31E24]/5"
                      : "border-slate-200 hover:border-[#D7B56D]"
                  }`}
                >
                  <span className="material-symbols-outlined text-[#E31E24] mb-2">{icon}</span>
                  <div className="font-black text-[#2A2A29] uppercase text-sm">{label}</div>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Inversión (USD)" type="number" value={form.monto_inversion_usd} onChange={(v) => update("monto_inversion_usd", Number(v))} />
            <Field label="Empleo directo" type="number" value={form.empleo_directo} onChange={(v) => update("empleo_directo", Number(v))} />
            <Field label="Empleo indirecto" type="number" value={form.empleo_indirecto} onChange={(v) => update("empleo_indirecto", Number(v))} />
            <Field label="% contenido local" type="number" value={form.porcentaje_cl} onChange={(v) => update("porcentaje_cl", Number(v))} />
            <Field label="Meses de instalación" type="number" value={form.tiempo_instalacion_meses} onChange={(v) => update("tiempo_instalacion_meses", Number(v))} />
            <Field label="% exportación" type="number" value={form.exportacion_pct} onChange={(v) => update("exportacion_pct", Number(v))} />
            <label className="block md:col-span-2">
              <span className="text-[10px] font-black uppercase text-slate-500">País de origen</span>
              <select
                className="mt-1 w-full border border-slate-200 rounded-lg px-4 py-3 font-bold"
                value={form.pais_origen}
                onChange={(e) => update("pais_origen", e.target.value)}
              >
                {PAISES.map((p) => (
                  <option key={p.code} value={p.code}>{p.label}</option>
                ))}
              </select>
            </label>
          </div>
        )}

        {step === 3 && sector === "manufactura" && (
          <SectorFields>
            <SelectField label="Tipo de proceso" value={form.tipo_proceso} options={[["batch","Batch"],["continuo","Continuo"],["discreto","Discreto"]]} onChange={(v) => update("tipo_proceso", v)} />
            <Field label="Valor agregado local (%)" type="number" value={form.va_estimado_pct} onChange={(v) => update("va_estimado_pct", Number(v))} />
            <SelectField label="Impacto ambiental" value={form.tipo_impacto_ambiental} options={[["bajo","Bajo"],["medio","Medio"],["alto","Alto"]]} onChange={(v) => update("tipo_impacto_ambiental", v)} />
            <label className="flex items-center gap-2 md:col-span-2">
              <input type="checkbox" checked={form.requiere_anexo_4} onChange={(e) => update("requiere_anexo_4", e.target.checked)} />
              <span className="text-sm font-semibold">Requiere cumplimiento Anexo 4 (impacto ambiental)</span>
            </label>
          </SectorFields>
        )}

        {step === 3 && sector === "ckd" && (
          <SectorFields>
            <Field label="Producto ensamblado" value={form.producto_ensamblado} onChange={(v) => update("producto_ensamblado", String(v))} />
            <Field label="Ratio CKD importado (%)" type="number" value={form.ratio_ckd_importado} onChange={(v) => update("ratio_ckd_importado", Number(v))} />
            <SelectField label="Mercado destino" value={form.mercado_destino} options={[["exportacion","Exportación"],["regional","Regional"],["interno","Interno"]]} onChange={(v) => update("mercado_destino", v)} />
          </SectorFields>
        )}

        {step === 3 && sector === "tech" && (
          <SectorFields>
            <SelectField label="Tipo de servicio" value={form.tipo_servicio} options={[["software","Software"],["ia","IA"],["cloud","Cloud"],["idi","IDI"],["logistica","Logística digital"]]} onChange={(v) => update("tipo_servicio", v)} />
            <Field label="% servicios exportables" type="number" value={form.pct_servicios_exportables} onChange={(v) => update("pct_servicios_exportables", Number(v))} />
            <Field label="Ratio empleos tech (0-1)" type="number" value={form.ratio_empleos_tech} onChange={(v) => update("ratio_empleos_tech", Number(v))} />
            <label className="flex items-center gap-2 md:col-span-2">
              <input type="checkbox" checked={form.requiere_datacenter} onChange={(e) => update("requiere_datacenter", e.target.checked)} />
              <span className="text-sm font-semibold">Requiere datacenter en ZEEP</span>
            </label>
          </SectorFields>
        )}

        {error && <p className="text-[#E31E24] text-sm font-semibold">{error}</p>}
      </div>

      <div className="px-8 py-5 bg-slate-50 border-t flex justify-between">
        <button
          type="button"
          disabled={step === 1}
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          className="px-5 py-2 font-bold text-sm uppercase text-[#2A2A29] disabled:opacity-40"
        >
          Atrás
        </button>
        {step < 3 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            className="px-6 py-3 bg-[#E31E24] text-white font-black uppercase text-xs tracking-widest rounded-lg"
          >
            Continuar
          </button>
        ) : (
          <button
            type="button"
            disabled={loading}
            onClick={submit}
            className="px-6 py-3 bg-[#E31E24] text-white font-black uppercase text-xs tracking-widest rounded-lg disabled:opacity-60"
          >
            {loading ? "Calculando..." : "Calcular elegibilidad"}
          </button>
        )}
      </div>
    </div>
  );
}

function SectorFields({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>;
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string | number;
  onChange: (v: string | number) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-black uppercase text-slate-500">{label}</span>
      <input
        type={type}
        className="mt-1 w-full border border-slate-200 rounded-lg px-4 py-3 font-bold"
        value={value}
        onChange={(e) => onChange(type === "number" ? Number(e.target.value) : e.target.value)}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: [string, string][];
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-black uppercase text-slate-500">{label}</span>
      <select
        className="mt-1 w-full border border-slate-200 rounded-lg px-4 py-3 font-bold"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
    </label>
  );
}
