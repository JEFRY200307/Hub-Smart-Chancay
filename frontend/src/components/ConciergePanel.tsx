"use client";

import { useEffect, useState } from "react";
import { Link } from "@/navigation";
import { getMatch, type MatchResponse } from "@/lib/api/marketplace";
import { FLOW_KEYS, getFlowValue } from "@/lib/flow";
import { getAccessToken } from "@/lib/auth";

export default function ConciergePanel() {
  const [match, setMatch] = useState<MatchResponse | null>(null);

  useEffect(() => {
    const mid = getFlowValue(FLOW_KEYS.matchId);
    if (!mid || !getAccessToken()) return;
    getMatch(mid).then(setMatch).catch(() => null);
  }, []);

  const experts =
    match?.resultados.flatMap((cat) =>
      cat.candidatos.slice(0, 2).map((c) => ({
        ...c,
        categoria: cat.categoria,
      }))
    ) ?? [];

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto w-full">
      <h1 className="text-3xl font-black text-[#2A2A29] uppercase mb-2">
        Concierge — Red de expertos
      </h1>
      <p className="text-slate-600 mb-8">
        Expertos de su último match — solicite reuniones desde Matchmaking.
      </p>

      {!match && (
        <div className="p-6 bg-slate-50 rounded-xl">
          <p className="text-sm mb-4">Aún no hay match guardado.</p>
          <Link
            href="/dashboard/matchmaking"
            className="text-[#E31E24] font-bold text-xs uppercase"
          >
            Ejecutar matchmaking →
          </Link>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {experts.map((e) => (
          <div
            key={e.candidato_id}
            className="bg-white border border-slate-200 rounded-2xl p-6"
          >
            <p className="text-[10px] font-bold uppercase text-[#D7B56D]">
              {e.categoria.replace("_", " ")}
            </p>
            <h3 className="text-xl font-bold mt-2">{e.nombre}</h3>
            <p className="text-sm text-slate-500 mt-2">{e.disponibilidad}</p>
            <p className="text-2xl font-black text-[#E31E24] mt-4">
              {(e.score_compatibilidad * 100).toFixed(0)}% match
            </p>
            <Link
              href="/dashboard/matchmaking"
              className="inline-block mt-4 text-xs font-black uppercase text-[#2A2A29] border-b-2 border-[#E31E24]"
            >
              Gestionar reunión
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
