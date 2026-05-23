"use client";

import { useEffect, useState } from "react";
import { Link } from "@/navigation";
import {
  fetchEngineerDetail,
  fetchLawyerDetail,
  fetchProviderDetail,
  enrichProvider,
  type EngineerDetail,
  type LawyerDetail,
  type ProviderDetail,
} from "@/lib/api/marketplace";

type Props =
  | { kind: "engineer"; id: string }
  | { kind: "lawyer"; id: string }
  | { kind: "provider"; ruc: string };

export default function MarketplaceDetail(props: Props) {
  const [data, setData] = useState<
    EngineerDetail | LawyerDetail | ProviderDetail | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [enriching, setEnriching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const load =
      props.kind === "engineer"
        ? fetchEngineerDetail(props.id)
        : props.kind === "lawyer"
          ? fetchLawyerDetail(props.id)
          : fetchProviderDetail(props.ruc);
    load
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Error"))
      .finally(() => setLoading(false));
  }, [props]);

  async function onEnrich() {
    if (props.kind !== "provider") return;
    setEnriching(true);
    try {
      setData(await enrichProvider(props.ruc));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Enriquecimiento falló");
    } finally {
      setEnriching(false);
    }
  }

  const title =
    data && "nombre" in data
      ? data.nombre
      : data && "razon_social" in data
        ? data.razon_social
        : "";

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto w-full min-w-0">
      <Link
        href="/services"
        className="text-xs font-bold uppercase text-[#E31E24] mb-6 inline-block"
      >
        ← Marketplace
      </Link>

      {loading && (
        <p className="text-slate-400 text-sm uppercase font-bold">Cargando ficha…</p>
      )}
      {error && <p className="text-[#E31E24] font-semibold text-sm">{error}</p>}

      {data && (
        <article className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-6 py-5 bg-[#2A2A29] text-white">
            <p className="text-[10px] font-black uppercase text-[#D7B56D] mb-1">
              {props.kind === "engineer"
                ? "Ingeniero CIP"
                : props.kind === "lawyer"
                  ? "Abogado CAL"
                  : "Proveedor PadronRUC"}
            </p>
            <h1 className="text-2xl font-black uppercase tracking-tight">{title}</h1>
            {"numero_cip" in data && (
              <p className="text-sm opacity-80 mt-1">{data.numero_cip}</p>
            )}
            {"numero_cal" in data && (
              <p className="text-sm opacity-80 mt-1">{data.numero_cal}</p>
            )}
            {"ruc" in data && (
              <p className="text-sm opacity-80 mt-1">RUC {data.ruc}</p>
            )}
          </div>

          <div className="p-6 space-y-6">
            {data.enrichment && (
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <span className="text-2xl font-black text-[#E31E24]">
                  {(data.enrichment.completeness_score * 100).toFixed(0)}%
                </span>
                <div>
                  <p className="text-xs font-bold uppercase">Datos disponibles</p>
                  <p className="text-xs text-slate-500">
                    Fuentes: {data.enrichment.fuentes.join(", ")}
                  </p>
                </div>
              </div>
            )}

            {"descripcion_publica" in data && data.descripcion_publica && (
              <section>
                <h2 className="text-xs font-black uppercase text-slate-500 mb-2">
                  Resumen
                </h2>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {data.descripcion_publica}
                </p>
              </section>
            )}

            {"especialidad_principal" in data && data.especialidad_principal && (
              <section>
                <h2 className="text-xs font-black uppercase text-slate-500 mb-2">
                  Especialidad
                </h2>
                <p className="text-sm font-semibold text-[#2A2A29]">
                  {data.especialidad_principal}
                </p>
              </section>
            )}

            {"especializacion_principal" in data && data.especializacion_principal && (
              <section>
                <h2 className="text-xs font-black uppercase text-slate-500 mb-2">
                  Especialización
                </h2>
                <p className="text-sm font-semibold text-[#2A2A29]">
                  {data.especializacion_principal}
                </p>
              </section>
            )}

            {"servicios_principales" in data && data.servicios_principales?.length ? (
              <section>
                <h2 className="text-xs font-black uppercase text-slate-500 mb-2">
                  Servicios
                </h2>
                <ul className="text-sm text-slate-700 list-disc pl-5">
                  {data.servicios_principales.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            {"web_enrichment_data" in data && data.web_enrichment_data && (
              <section>
                <h2 className="text-xs font-black uppercase text-slate-500 mb-2">
                  Datos web
                </h2>
                <pre className="text-xs bg-slate-50 p-3 rounded-lg overflow-x-auto text-slate-600">
                  {JSON.stringify(data.web_enrichment_data, null, 2)}
                </pre>
              </section>
            )}

            {"habilitacion_vigente" in data && (
              <p className="text-xs font-bold uppercase text-green-700">
                {data.habilitacion_vigente ? "✓ Habilitación vigente" : "Habilitación pendiente"}
              </p>
            )}

            {props.kind === "provider" && (
              <button
                type="button"
                disabled={enriching}
                onClick={onEnrich}
                className="w-full py-3 border-2 border-[#D7B56D] text-xs font-black uppercase rounded-lg disabled:opacity-50"
              >
                {enriching ? "Buscando en web…" : "Enriquecer datos (Tavily)"}
              </button>
            )}

            <Link
              href="/dashboard/matchmaking"
              className="block text-center py-3 bg-[#E31E24] text-white text-xs font-black uppercase rounded-lg"
            >
              Ir a matchmaking institucional
            </Link>
          </div>
        </article>
      )}
    </div>
  );
}
