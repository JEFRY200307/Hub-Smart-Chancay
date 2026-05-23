"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { EngineerItem, LawyerItem, ProviderItem } from "@/lib/types";

type Tab = "engineers" | "lawyers" | "providers";

export default function OperatorsPage() {
  const [tab, setTab] = useState<Tab>("engineers");
  const [engineers, setEngineers] = useState<EngineerItem[]>([]);
  const [lawyers, setLawyers] = useState<LawyerItem[]>([]);
  const [providers, setProviders] = useState<ProviderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    (async () => {
      try {
        const [e, l, p] = await Promise.all([
          apiFetch<{ items: EngineerItem[] }>("/marketplace/directory/engineers?size=20"),
          apiFetch<{ items: LawyerItem[] }>("/marketplace/directory/lawyers?size=20"),
          apiFetch<{ items: ProviderItem[] }>("/marketplace/directory/providers?size=20"),
        ]);
        setEngineers(e.items || []);
        setLawyers(l.items || []);
        setProviders(p.items || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <main className="lg:ml-64 p-8 pt-28 min-h-screen bg-slate-50">
      <header className="mb-8">
        <p className="text-[#D7B56D] text-[10px] font-black uppercase tracking-[0.3em]">Red institucional</p>
        <h1 className="text-3xl font-black text-[#2A2A29]">Operadores CIP / CAL / Empresas</h1>
        <p className="text-slate-600 text-sm mt-2">Datos en vivo desde Supabase (sin contenido estático).</p>
      </header>

      <div className="flex gap-2 mb-8">
        {(
          [
            ["engineers", "Ingenieros CIP"],
            ["lawyers", "Abogados CAL"],
            ["providers", "Empresas PadronRUC"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider ${
              tab === id ? "bg-[#E31E24] text-white" : "bg-white text-[#2A2A29] border"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="animate-pulse text-[#E31E24] font-bold uppercase text-sm">Cargando directorio...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {tab === "engineers" &&
            engineers.map((e) => (
              <Card
                key={e.id}
                title={e.nombre}
                badge={e.numero_cip}
                subtitle={e.especialidad_principal || e.especialidades?.join(", ")}
                desc={e.descripcion_publica}
                rating={e.rating_promedio}
              />
            ))}
          {tab === "lawyers" &&
            lawyers.map((l) => (
              <Card
                key={l.id}
                title={l.nombre}
                badge={l.numero_cal}
                subtitle={l.especializacion_principal}
                desc={l.descripcion_publica}
                rating={l.rating_promedio}
                extra={l.certificacion_zeep ? "Certificado ZEEP" : undefined}
              />
            ))}
          {tab === "providers" &&
            providers.map((p) => (
              <Card
                key={p.ruc}
                title={p.razon_social}
                badge={`RUC ${p.ruc}`}
                subtitle={p.sector_interno || "—"}
                desc={p.descripcion_publica}
                rating={p.trust_score ? p.trust_score * 5 : undefined}
              />
            ))}
          {tab === "engineers" && engineers.length === 0 && <EmptySeed />}
          {tab === "lawyers" && lawyers.length === 0 && <EmptySeed />}
          {tab === "providers" && providers.length === 0 && <EmptySeed />}
        </div>
      )}
    </main>
  );
}

function Card({
  title,
  badge,
  subtitle,
  desc,
  rating,
  extra,
}: {
  title: string;
  badge: string;
  subtitle?: string;
  desc?: string;
  rating?: number;
  extra?: string;
}) {
  return (
    <article className="bg-white rounded-2xl p-6 border border-[#D7B56D]/20 shadow-sm hover:border-[#E31E24]/30 transition-colors">
      <span className="text-[10px] font-black text-[#E31E24] uppercase tracking-wider">{badge}</span>
      <h3 className="font-bold text-[#2A2A29] mt-2 text-lg">{title}</h3>
      {subtitle && <p className="text-xs text-slate-500 mt-1 uppercase font-semibold">{subtitle}</p>}
      {desc && <p className="text-sm text-slate-600 mt-3 line-clamp-3">{desc}</p>}
      <div className="mt-4 flex gap-2 items-center">
        {rating != null && (
          <span className="text-sm font-black text-[#D7B56D]">★ {rating.toFixed(1)}</span>
        )}
        {extra && (
          <span className="text-[10px] bg-[#E31E24]/10 text-[#E31E24] px-2 py-1 rounded font-bold uppercase">
            {extra}
          </span>
        )}
      </div>
    </article>
  );
}

function EmptySeed() {
  return (
    <p className="col-span-full text-slate-500 text-sm">
      Sin registros visibles. Ejecute <code className="bg-slate-100 px-1">seed_cip_cal_padron.sql</code> en Supabase.
    </p>
  );
}
