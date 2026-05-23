"use client";

import { useEffect, useState } from "react";
import { Link } from "@/navigation";
import {
  fetchEngineers,
  fetchLawyers,
  fetchProviders,
  fetchOperators,
} from "@/lib/api/marketplace";

export default function ServicesDirectory() {
  const [tab, setTab] = useState<"all" | "eng" | "law" | "prov">("all");
  const [engineers, setEngineers] = useState<
    Awaited<ReturnType<typeof fetchEngineers>>["items"]
  >([]);
  const [lawyers, setLawyers] = useState<
    Awaited<ReturnType<typeof fetchLawyers>>["items"]
  >([]);
  const [providers, setProviders] = useState<
    Awaited<ReturnType<typeof fetchProviders>>["items"]
  >([]);
  const [operators, setOperators] = useState<
    Awaited<ReturnType<typeof fetchOperators>>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchEngineers({ size: 12 }),
      fetchLawyers({ size: 12 }),
      fetchProviders({ size: 12 }),
      fetchOperators().catch(() => []),
    ])
      .then(([e, l, p, o]) => {
        setEngineers(e.items);
        setLawyers(l.items);
        setProviders(p.items);
        setOperators(o);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="p-6 md:p-8 max-w-7xl mx-auto w-full">
      <header className="mb-10">
        <h1 className="text-4xl font-black text-[#2A2A29] uppercase">
          Marketplace de servicios
        </h1>
        <p className="text-slate-600 mt-2">
          Directorio CIP / CAL / PadronRUC + operadores ZEEP
        </p>
        <div className="flex gap-2 mt-6 flex-wrap">
          {(["all", "eng", "law", "prov"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-xs font-bold uppercase rounded-full ${
                tab === t
                  ? "bg-[#E31E24] text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {t === "all"
                ? "Todos"
                : t === "eng"
                  ? "CIP"
                  : t === "law"
                    ? "CAL"
                    : "Proveedores"}
            </button>
          ))}
          <Link
            href="/dashboard/matchmaking"
            className="ml-auto px-4 py-2 text-xs font-bold uppercase text-[#D7B56D] border-2 border-[#D7B56D] rounded-full"
          >
            Match institucional →
          </Link>
        </div>
      </header>

      {loading && (
        <p className="text-sm text-slate-400 uppercase font-bold">Cargando…</p>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(tab === "all" || tab === "eng") &&
          engineers.map((e) => (
            <Link
              key={e.id}
              href={`/services/engineers/${e.id}`}
              className="block bg-white p-6 rounded-xl border border-slate-200 hover:border-[#E31E24] hover:shadow-md transition-all"
            >
              <span className="text-[10px] font-bold text-[#E31E24] uppercase">
                CIP {e.numero_cip}
              </span>
              <h3 className="font-bold mt-2 text-[#2A2A29]">{e.nombre}</h3>
              <p className="text-sm text-slate-500 mt-1">
                {e.especialidad_principal ?? e.especialidades[0]}
              </p>
              <p className="text-[10px] font-black uppercase text-[#D7B56D] mt-4">
                Ver detalle →
              </p>
            </Link>
          ))}
        {(tab === "all" || tab === "law") &&
          lawyers.map((l) => (
            <Link
              key={l.id}
              href={`/services/lawyers/${l.id}`}
              className="block bg-white p-6 rounded-xl border border-slate-200 hover:border-[#D7B56D] hover:shadow-md transition-all"
            >
              <span className="text-[10px] font-bold text-[#D7B56D] uppercase">
                CAL {l.numero_cal}
              </span>
              <h3 className="font-bold mt-2 text-[#2A2A29]">{l.nombre}</h3>
              <p className="text-sm text-slate-500 mt-1">
                {l.especializacion_principal ?? "ZEEP"}
              </p>
              <p className="text-[10px] font-black uppercase text-[#D7B56D] mt-4">
                Ver detalle →
              </p>
            </Link>
          ))}
        {(tab === "all" || tab === "prov") &&
          providers.map((p) => (
            <Link
              key={p.ruc}
              href={`/services/providers/${p.ruc}`}
              className="block bg-white p-6 rounded-xl border border-slate-200 hover:border-[#E31E24] hover:shadow-md transition-all"
            >
              <span className="text-[10px] font-bold text-slate-500 uppercase">
                RUC {p.ruc}
              </span>
              <h3 className="font-bold mt-2 text-[#2A2A29]">{p.razon_social}</h3>
              <p className="text-sm text-slate-500">{p.sector_interno}</p>
              <p className="text-[10px] font-black uppercase text-[#D7B56D] mt-4">
                Ver detalle →
              </p>
            </Link>
          ))}
        {tab === "all" &&
          operators.map((o) => (
            <article
              key={o.id}
              className="bg-[#2A2A29] text-white p-6 rounded-xl"
            >
              <h3 className="font-bold">{o.name}</h3>
              <p className="text-sm text-white/70 mt-2">{o.description}</p>
              <span className="text-[10px] text-[#D7B56D] font-bold uppercase mt-2 block">
                {o.tier}
              </span>
            </article>
          ))}
      </div>
    </main>
  );
}
