"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { API_BASE } from "@/lib/api";
import { apiFetch } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import type { ChatStreamEvent } from "@/lib/types";
import AgentOrchestratorPanel from "@/components/AgentOrchestratorPanel";
import { classifyAgentsForQuery, type AgentId } from "@/lib/agents";
import { getInvestorProfileId } from "@/lib/flow";
import { handleSessionExpired } from "@/lib/session";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
  sources?: { titulo: string; tipo: string }[];
  confidence?: number;
};

const SUGGESTIONS = [
  "¿Cuáles son los beneficios tributarios en ZEEP para manufactura?",
  "Requisitos de contenido local mínimo Ley 32449",
  "Proceso de habilitación ambiental en Chancay",
];

export default function LegalChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [lastAssistantMessageId, setLastAssistantMessageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agentChain, setAgentChain] = useState<AgentId[]>([]);
  const [activeAgent, setActiveAgent] = useState<AgentId | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const scrollDown = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollDown();
  }, [messages, scrollDown]);

  async function streamQuery(query: string) {
    const token = getAccessToken();
    if (!token) {
      setError("Inicie sesión para usar el asesor legal.");
      return;
    }

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: query,
    };
    const assistantId = `a-${Date.now()}`;
    setMessages((m) => [
      ...m,
      userMsg,
      { id: assistantId, role: "assistant", content: "", streaming: true },
    ]);
    setLoading(true);
    setError(null);
    const chain = classifyAgentsForQuery(query);
    setAgentChain(chain);
    setActiveAgent("orquestador");

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`${API_BASE}/ai/query/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query,
          lang: "es",
          session_id: sessionId,
          investor_profile_id: getInvestorProfileId() ?? undefined,
        }),
        signal: controller.signal,
      });

      if (res.status === 401) {
        handleSessionExpired();
        return;
      }
      if (!res.ok || !res.body) {
        throw new Error(`Error ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;
          let event: ChatStreamEvent;
          try {
            event = JSON.parse(raw) as ChatStreamEvent;
          } catch {
            continue;
          }
          if (event.type === "agent_chain") {
            setAgentChain(event.agents as AgentId[]);
          } else if (event.type === "agent_start") {
            setActiveAgent(event.agent as AgentId);
          } else if (event.type === "token") {
            full += event.content;
            setMessages((m) =>
              m.map((msg) =>
                msg.id === assistantId ? { ...msg, content: full } : msg
              )
            );
          } else if (event.type === "done") {
            setActiveAgent(null);
            if (event.agent_chain?.length) {
              setAgentChain(event.agent_chain as AgentId[]);
            }
            setSessionId(event.session_id);
            setLastAssistantMessageId(event.message_id);
            setMessages((m) =>
              m.map((msg) =>
                msg.id === assistantId
                  ? {
                      ...msg,
                      content: full,
                      streaming: false,
                      sources: event.sources,
                      confidence: event.confidence_score,
                    }
                  : msg
              )
            );
          }
        }
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setError(e instanceof Error ? e.message : "Error de streaming");
        setMessages((m) => m.filter((msg) => msg.id !== assistantId));
      }
    } finally {
      setLoading(false);
    }
  }

  function handleSend(text?: string) {
    const q = (text ?? input).trim();
    if (!q || loading) return;
    setInput("");
    streamQuery(q);
  }

  function newConversation() {
    abortRef.current?.abort();
    setSessionId(null);
    setMessages([]);
    setError(null);
  }

  async function escalateLast() {
    if (!lastAssistantMessageId) return;
    const token = getAccessToken();
    if (!token) return;
    try {
      await apiFetch("/ai/escalate", {
        method: "POST",
        token,
        body: JSON.stringify({
          message_id: lastAssistantMessageId,
          motivo: "Solicitud de visado humano desde UI",
        }),
      });
      setError(null);
      alert("Solicitud de visado registrada. Un asesor CAL/CIP responderá en 24h.");
    } catch {
      setError("No se pudo escalar (use mensaje con ID válido tras respuesta completa).");
    }
  }

  return (
    <div className="flex h-[calc(100vh-120px)] max-w-6xl mx-auto w-full gap-4">
      <aside className="hidden md:flex w-64 flex-col gap-4">
        {agentChain.length > 0 && (
          <AgentOrchestratorPanel
            chain={agentChain}
            activeAgent={activeAgent}
            compact
          />
        )}
        <div className="flex flex-col bg-white rounded-2xl border border-[#D7B56D]/20 p-4">
        <button
          type="button"
          onClick={newConversation}
          className="w-full py-3 bg-[#E31E24] text-white text-xs font-black uppercase tracking-wider rounded-lg mb-4"
        >
          + Nueva conversación
        </button>
        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">Sugerencias</p>
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => handleSend(s)}
            className="text-left text-xs text-[#2A2A29]/80 py-2 px-2 rounded hover:bg-slate-50 mb-1"
          >
            {s}
          </button>
        ))}
        <button
          type="button"
          onClick={escalateLast}
          className="mt-auto text-xs font-bold text-[#D7B56D] border border-[#D7B56D] rounded-lg py-2 hover:bg-[#D7B56D]/10"
        >
          Escalar a visado humano
        </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-[#2A2A29] text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#D7B56D]">gavel</span>
            <div>
              <h2 className="font-black text-sm uppercase tracking-wider">Asesor Legal ZEEP</h2>
              <p className="text-[10px] text-white/60">Streaming · Ley N° 32449</p>
            </div>
          </div>
          <span className="flex items-center gap-1 text-[10px] text-green-400 font-bold uppercase">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            En línea
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && (
            <div className="text-center py-16 text-[#2A2A29]/50">
              <p className="font-bold uppercase tracking-widest text-sm mb-2">COMEX.AI Legal Gateway</p>
              <p className="text-sm max-w-md mx-auto">
                Pregunte sobre normativa ZEEP, incentivos y cumplimiento. Las respuestas se generan en tiempo real.
              </p>
            </div>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 max-w-[90%] ${m.role === "user" ? "ml-auto flex-row-reverse" : ""}`}
            >
              <div
                className={`w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center ${
                  m.role === "user" ? "bg-[#E31E24] text-white" : "bg-slate-100 text-[#E31E24]"
                }`}
              >
                <span className="material-symbols-outlined text-lg">
                  {m.role === "user" ? "person" : "smart_toy"}
                </span>
              </div>
              <div className={`space-y-1 ${m.role === "user" ? "text-right" : ""}`}>
                <div
                  className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-[#E31E24] text-white rounded-tr-sm"
                      : "bg-slate-50 text-[#2A2A29] rounded-tl-sm"
                  }`}
                >
                  {m.content}
                  {m.streaming && (
                    <span className="inline-block w-2 h-4 ml-1 bg-[#E31E24] animate-pulse align-middle" />
                  )}
                </div>
                {m.sources && m.sources.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {m.sources.map((s, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-bold uppercase px-2 py-1 bg-[#D7B56D]/20 text-[#2A2A29] rounded"
                      >
                        {s.titulo}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {error && (
          <p className="px-6 text-sm text-[#E31E24] font-semibold">{error}</p>
        )}

        <div className="p-4 border-t bg-slate-50">
          <div className="flex gap-2 max-w-3xl mx-auto">
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Pregunte sobre Ley ZEEP, aranceles, contenido local..."
              className="flex-1 resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#E31E24]/30"
            />
            <button
              type="button"
              disabled={loading || !input.trim()}
              onClick={() => handleSend()}
              className="w-12 h-12 bg-[#2A2A29] text-white rounded-xl flex items-center justify-center disabled:opacity-40 hover:bg-[#E31E24] transition-colors"
            >
              <span className="material-symbols-outlined">send</span>
            </button>
          </div>
          <p className="text-center text-[10px] text-slate-400 mt-3 uppercase tracking-widest">
            Orientación preliminar · No sustituye asesoría CAL/CIP certificada
          </p>
        </div>
      </div>
    </div>
  );
}
