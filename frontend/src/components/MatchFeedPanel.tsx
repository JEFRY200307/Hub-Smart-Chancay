"use client";

import { useEffect, useState } from "react";
import { Link } from "@/navigation";
import { fetchOpportunities, type Opportunity } from "@/lib/api/marketplace";
import { getInvestorProfileId } from "@/lib/flow";

export default function MatchFeedPanel() {
  const [items, setItems] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOpportunities(20)
      .then(setItems)
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Error cargando oportunidades")
      )
      .finally(() => setLoading(false));
  }, []);

  const profilePct = getInvestorProfileId() ? 84 : 42;

  return (
    <main className="p-6 md:p-8 bg-surface w-full max-w-7xl mx-auto">
      <header className="mb-12 max-w-6xl">
        <span className="font-label text-[#E31E24] text-[0.6875rem] font-bold tracking-[0.2em] uppercase">
          Intelligence Engine
        </span>
        <h1 className="text-5xl font-extrabold tracking-tight text-[#2A2A29] leading-tight mt-2">
          Match Feed
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mt-4">
          Oportunidades ZEEP desde ingestion — vincule su perfil para match
          institucional.
        </p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 max-w-7xl">
        <div className="xl:col-span-8 space-y-6">
          {loading && (
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
              Cargando…
            </p>
          )}
          {error && <p className="text-sm text-[#E31E24]">{error}</p>}
          {items.map((opp) => (
            <div
              key={opp.id}
              className="bg-white rounded-lg border-l-4 border-[#D7B56D] p-8 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-[#2A2A29]">
                    {opp.title}
                  </h3>
                  <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">
                    {opp.company_name} · {opp.category}
                  </p>
                </div>
                {opp.match_score != null && (
                  <span className="bg-[#E31E24]/10 text-[#E31E24] text-xs font-black px-3 py-1 rounded uppercase">
                    {opp.match_score}% Match
                  </span>
                )}
              </div>
              <p className="text-slate-600 mb-4">{opp.description}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {opp.tags.map((t) => (
                  <span
                    key={t}
                    className="px-3 py-1 bg-slate-100 text-xs font-bold uppercase rounded-full"
                  >
                    {t}
                  </span>
                ))}
              </div>
              <Link
                href="/dashboard/matchmaking"
                className="inline-block bg-[#2A2A29] text-white px-6 py-2.5 text-xs font-bold uppercase tracking-widest rounded-md hover:bg-[#E31E24] transition-colors"
              >
                Match institucional
              </Link>
            </div>
          ))}
        </div>

        <div className="xl:col-span-4">
          <section className="bg-[#2A2A29] p-8 text-white rounded-xl">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] mb-4">
              Perfil de servicio
            </h2>
            <span className="text-4xl font-black">{profilePct}%</span>
            <div className="w-full bg-white/10 h-1.5 my-4 rounded-full">
              <div
                className="bg-[#D7B56D] h-full rounded-full"
                style={{ width: `${profilePct}%` }}
              />
            </div>
            <Link
              href="/onboarding"
              className="block w-full text-center bg-white text-[#2A2A29] py-3 text-xs font-bold uppercase mt-4 rounded-md"
            >
              Actualizar perfil
            </Link>
          </section>
        </div>
      </div>
    </main>
  );
}
