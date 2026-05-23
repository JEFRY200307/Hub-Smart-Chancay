/** Jerarquía Supervisor-Worker — ADR-02-04 / spec09 */

export type AgentId =
  | "orquestador"
  | "legal"
  | "matchmaker"
  | "tecnico"
  | "financiero"
  | "idi"
  | "auditor";

export const AGENT_META: Record<
  AgentId,
  { label: string; icon: string; color: string; role: string }
> = {
  orquestador: {
    label: "Orquestador",
    icon: "hub",
    color: "#2A2A29",
    role: "Supervisor — clasifica intención y delega",
  },
  legal: {
    label: "Agente Legal",
    icon: "gavel",
    color: "#E31E24",
    role: "Ley N° 32449, normativa ZEEP",
  },
  matchmaker: {
    label: "Matchmaker",
    icon: "handshake",
    color: "#D7B56D",
    role: "CIP / CAL / proveedores PadronRUC",
  },
  tecnico: {
    label: "Agente Técnico",
    icon: "engineering",
    color: "#64748b",
    role: "Requisitos técnicos y ambientales",
  },
  financiero: {
    label: "Agente Financiero",
    icon: "account_balance",
    color: "#0f766e",
    role: "Proyección fiscal IR/IGV/arancel",
  },
  idi: {
    label: "Agente I+D+i",
    icon: "biotech",
    color: "#7c3aed",
    role: "CONCYTEC, CITE, innovación",
  },
  auditor: {
    label: "Agente Auditor",
    icon: "verified_user",
    color: "#1d4ed8",
    role: "Alucinación cero — valida vigencia",
  },
};

export function classifyAgentsForQuery(query: string): AgentId[] {
  const q = query.toLowerCase();
  const chain: AgentId[] = ["orquestador"];

  const legalKw = ["ley", "legal", "32449", "arancel", "igv", "norma", "decreto", "zeep"];
  const matchKw = ["match", "ingeniero", "abogado", "proveedor", "cip", "cal", "socio", "aliado"];
  const techKw = ["técnico", "tecnico", "ambiental", "anexo", "instalación", "infraestructura"];
  const finKw = ["fiscal", "ir ", "inversión", "inversion", "ahorro", "roi", "beneficio"];
  const idiKw = ["idi", "concycit", "innovación", "innovacion", "i+d", "cite"];

  if (legalKw.some((k) => q.includes(k))) chain.push("legal");
  if (matchKw.some((k) => q.includes(k))) chain.push("matchmaker");
  if (techKw.some((k) => q.includes(k))) chain.push("tecnico");
  if (finKw.some((k) => q.includes(k))) chain.push("financiero");
  if (idiKw.some((k) => q.includes(k))) chain.push("idi");

  if (!chain.includes("legal") && !chain.includes("matchmaker")) {
    chain.push("legal");
  }

  chain.push("auditor");
  return chain;
}
