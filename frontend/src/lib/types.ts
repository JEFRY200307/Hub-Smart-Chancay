export type SimulationRequest = {
  session_id: string;
  sector: "manufactura" | "ckd" | "tech";
  monto_inversion_usd: number;
  empleo_directo: number;
  empleo_indirecto: number;
  porcentaje_cl: number;
  tiempo_instalacion_meses: number;
  pais_origen: string;
  exportacion_pct: number;
  variables_sector: Record<string, unknown>;
};

export type ProyeccionFiscal = {
  ir_estandar_pct: number;
  ir_zeep_pct: number;
  ahorro_5_anos_usd: number;
  igv_exonerado: boolean;
  arancel_0: boolean;
  condicion_cl_pct?: number;
  nota_beneficios?: string;
};

export type Alerta = {
  tipo: string;
  descripcion: string;
  impacto_score: number;
};

export type SimulationResponse = {
  id: string;
  session_id: string;
  sector: string;
  clasificacion: string;
  v_base: number;
  delta_cl: number;
  delta_sector: number;
  v_final: number;
  beneficio_cl_activo: boolean;
  razon_clasificacion?: string;
  factores_elegibilidad?: string[];
  proyeccion_fiscal: ProyeccionFiscal;
  alertas: Alerta[];
  recomendaciones_agente: string[];
  created_at: string;
};

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
};

export type EngineerItem = {
  id: string;
  nombre: string;
  numero_cip: string;
  especialidades: string[];
  disponibilidad: string;
  idiomas: string[];
  habilitacion_vigente: boolean;
  rating_promedio?: number;
  especialidad_principal?: string;
  descripcion_publica?: string;
};

export type LawyerItem = {
  id: string;
  nombre: string;
  numero_cal: string;
  especializaciones: string[];
  certificacion_zeep: boolean;
  idiomas: string[];
  habilitacion_vigente: boolean;
  rating_promedio?: number;
  especializacion_principal?: string;
  descripcion_publica?: string;
};

export type ProviderItem = {
  ruc: string;
  razon_social: string;
  sector_interno?: string;
  trust_score?: number;
  distancia_puerto_chancay_km?: number;
  descripcion_publica?: string;
};

export type ChatStreamEvent =
  | { type: "token"; content: string }
  | { type: "agent_chain"; agents: string[] }
  | { type: "agent_start"; agent: string }
  | {
      type: "done";
      session_id: string;
      message_id: string;
      confidence_score: number;
      requiere_visado_humano: boolean;
      sources: { titulo: string; tipo: string; url?: string | null }[];
      agentes_activados: string[];
      agent_chain?: string[];
      agente_principal?: string;
    };
