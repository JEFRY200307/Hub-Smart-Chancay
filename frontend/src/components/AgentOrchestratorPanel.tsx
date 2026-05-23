"use client";

import { AGENT_META, type AgentId } from "@/lib/agents";

type Props = {
  chain: AgentId[];
  activeAgent?: AgentId | null;
  compact?: boolean;
};

export default function AgentOrchestratorPanel({
  chain,
  activeAgent,
  compact = false,
}: Props) {
  if (!chain.length) return null;

  return (
    <div
      className={`rounded-xl border border-[#D7B56D]/25 bg-white ${
        compact ? "p-3" : "p-4"
      }`}
    >
      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#2A2A29]/60 mb-3">
        Cadena de agentes COMEX.AI
      </p>
      <div className={`flex flex-col ${compact ? "gap-2" : "gap-3"}`}>
        {chain.map((id, i) => {
          const meta = AGENT_META[id];
          const isActive = activeAgent === id;
          const isDone =
            activeAgent &&
            chain.indexOf(activeAgent) > i &&
            id !== activeAgent;
          return (
            <div key={`${id}-${i}`} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                    isActive
                      ? "bg-[#E31E24] text-white ring-2 ring-[#E31E24]/40"
                      : isDone
                        ? "bg-[#D7B56D]/30 text-[#2A2A29]"
                        : "bg-slate-100 text-slate-400"
                  }`}
                >
                  <span className="material-symbols-outlined text-base">
                    {meta.icon}
                  </span>
                </div>
                {i < chain.length - 1 && (
                  <div
                    className={`w-0.5 flex-1 min-h-[12px] my-1 ${
                      isDone ? "bg-[#D7B56D]" : "bg-slate-200"
                    }`}
                  />
                )}
              </div>
              <div className="flex-1 pb-1">
                <p
                  className={`text-xs font-black uppercase tracking-wide ${
                    isActive ? "text-[#E31E24]" : "text-[#2A2A29]"
                  }`}
                >
                  {meta.label}
                </p>
                {!compact && (
                  <p className="text-[10px] text-slate-500 leading-snug">
                    {meta.role}
                  </p>
                )}
              </div>
              {isActive && (
                <span className="text-[9px] font-bold text-[#E31E24] uppercase animate-pulse">
                  Activo
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
