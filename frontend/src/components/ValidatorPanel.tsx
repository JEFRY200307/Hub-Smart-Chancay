"use client";

import { useEffect, useState } from "react";
import { Link } from "@/navigation";
import {
  getTimeline,
  getLedgerStats,
  verifyLedger,
  type LedgerEvent,
  type LedgerStats,
} from "@/lib/api/ledger";
import { getInvestorProfileId } from "@/lib/flow";
import AgentOrchestratorPanel from "@/components/AgentOrchestratorPanel";

const AUDITOR_CHAIN = ["orquestador", "auditor"] as const;

export default function ValidatorPanel() {
  const [events, setEvents] = useState<LedgerEvent[]>([]);
  const [stats, setStats] = useState<LedgerStats | null>(null);
  const [valid, setValid] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const profileId = getInvestorProfileId();

  useEffect(() => {
    if (!profileId) return;
    Promise.all([
      getTimeline(profileId),
      getLedgerStats(profileId),
      verifyLedger(profileId),
    ])
      .then(([tl, st, v]) => {
        setEvents(tl);
        setStats(st);
        setValid(v.is_valid);
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Error ledger")
      );
  }, [profileId]);

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto w-full">
      <div className="grid lg:grid-cols-3 gap-8">
        <AgentOrchestratorPanel chain={[...AUDITOR_CHAIN]} activeAgent="auditor" />
        <div className="lg:col-span-2">
          <h1 className="text-3xl font-black uppercase text-[#2A2A29] mb-2">
            Validador — Ledger inmutable
          </h1>
          {!profileId ? (
            <p className="text-sm text-slate-600">
              Cree un perfil en{" "}
              <Link href="/onboarding" className="text-[#E31E24] font-bold">
                onboarding
              </Link>
              .
            </p>
          ) : (
            <>
              {valid != null && (
                <div
                  className={`p-4 rounded-xl mb-6 ${
                    valid
                      ? "bg-green-50 text-green-800"
                      : "bg-red-50 text-red-800"
                  }`}
                >
                  <p className="font-black text-sm uppercase">
                    Integridad: {valid ? "VÁLIDA" : "COMPROMETIDA"}
                  </p>
                  {stats && (
                    <p className="text-xs mt-1">
                      {stats.total_events} eventos · Fase:{" "}
                      {stats.fase_actual ?? "—"}
                    </p>
                  )}
                </div>
              )}
              {error && <p className="text-sm text-[#E31E24]">{error}</p>}
              <ul className="space-y-3">
                {events.map((ev) => (
                  <li
                    key={ev.id}
                    className="bg-white border border-slate-200 rounded-lg p-4 text-sm"
                  >
                    <span className="font-bold text-[#E31E24]">
                      #{ev.sequence_number}
                    </span>{" "}
                    {ev.event_type}
                    <span className="text-slate-400 text-xs block mt-1">
                      {ev.created_at}
                    </span>
                  </li>
                ))}
                {events.length === 0 && !error && (
                  <p className="text-slate-400 text-sm">
                    Sin eventos aún — el ledger se poblará con match y reuniones.
                  </p>
                )}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
