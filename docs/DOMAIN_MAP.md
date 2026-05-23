# DOMAIN MAP — COMEX.AI / Sovereign Gateway

**Versión:** 2.0 | **Fecha:** 2026-05-22 | **Basado en:** spec01–spec07, ADR-01, ADR-02

---

## 1. Lenguaje Ubicuo (Ubiquitous Language)

Términos que deben usarse de forma consistente en código, documentación y conversaciones del equipo.

| Término | Definición |
|---|---|
| **ZEEP** | Zona Económica Especial Privada de Chancay. Marco legal: Ley N° 32449. |
| **Score de Elegibilidad** | Valor numérico [0–100] que cuantifica la viabilidad de un proyecto de inversión para operar en la ZEEP. Calculado por el Motor de Simulación (spec02). |
| **CL (Componentes Locales)** | Porcentaje de insumos/componentes de origen peruano en el proceso productivo. Umbral crítico: `CL ≥ 30%` activa el beneficio de 0% IR. |
| **CL Umbral** | El 30% de CL requerido por Ley 32449 para acceder a la exoneración total del Impuesto a la Renta. |
| **Roadmap de Instalación** | Flujo de 4 fases para el onboarding del inversor: Elegibilidad → Validación Legal → Contratación → Operación. |
| **Dossier de Inversión** | Documento PDF consolidado generado automáticamente al firmarse el contrato con el Operador ZEEP. Contiene todo el expediente del ciclo de inversión. |
| **Visado Humano** | Revisión obligatoria por un experto CIP o CAL cuando el Agente Auditor detecta `confidence_score < 0.70` en una respuesta legal. |
| **Grounding** | Proceso de anclar cada afirmación del LLM a un chunk normativo recuperado de ChromaDB. Sin grounding, la respuesta no se entrega. |
| **Alucinación Cero** | Política del sistema: ninguna respuesta legal se entrega al usuario sin sustento normativo verificado por el Agente Auditor. |
| **Trust Score** | Puntuación compuesta [0–1] de confiabilidad de un proveedor local, calculada desde datos SUNARP + antigüedad + ausencia de cargas registrales. |
| **PadronRUC** | Archivo bulk del padrón de contribuyentes de SUNAT (~10M registros), ingesta mensual para inteligencia territorial (spec07). |
| **Operador ZEEP** | Entidad privada que administra físicamente la ZEEP y es el validador final del ciclo de inversión. |
| **CKD** | Completely Knocked Down. Modalidad de ensamblaje donde el producto se importa desarmado y se ensambla localmente. |
| **Sector CIIU** | Clasificación Internacional Industrial Uniforme. Base para asignar estrategia de scoring y agentes especializados. |
| **SimulationRecord** | Registro persistido de una simulación de elegibilidad. Origen de datos para el módulo de Profiling. |
| **InvestorProfile** | Expediente digital completo del proyecto de inversión. Agregado central del sistema. |
| **LedgerEvent** | Registro inmutable de un hito en el ciclo de inversión. Nunca puede ser modificado ni eliminado post-creación. |
| **Minuta** | Registro estructurado de una reunión entre el inversor y un profesional (Ingeniero CIP, Abogado CAL o proveedor). |
| **Match Score** | Puntuación de compatibilidad [0–1] entre el InvestorProfile y un candidato (Ingeniero/Abogado/Proveedor). |
| **Agente Orquestador** | Único punto de entrada a la capa cognitiva. Clasifica la intención y delega a agentes especialistas. No hay comunicación horizontal entre agentes. |

---

## 2. Bounded Contexts (Contextos Delimitados)

El sistema se organiza en **7 Bounded Contexts**. Cada uno tiene su propio modelo de dominio, sus propias entidades y su propio lenguaje interno.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        COMEX.AI / Sovereign Gateway                  │
│                                                                       │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐   │
│  │   IDENTITY   │    │  SIMULATION  │    │  ONBOARDING/PROFILING│   │
│  │  (spec base) │    │   (spec02)   │    │      (spec03)        │   │
│  └──────────────┘    └──────────────┘    └──────────────────────┘   │
│                                                                       │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐   │
│  │  MATCHMAKING │    │    LEDGER    │    │      LEGAL AI        │   │
│  │   (spec04)   │    │   (spec05)   │    │      (spec06)        │   │
│  └──────────────┘    └──────────────┘    └──────────────────────┘   │
│                                                                       │
│  ┌──────────────────────────────────────────┐                        │
│  │         ETL PADRONRUC  (spec07)          │                        │
│  │     Pipeline mensual → companies         │                        │
│  └──────────────────────────────────────────┘                        │
│                                                                       │
│  ┌──────────────────────────────────────────┐                        │
│  │         ZEEP INGESTION (spec01)          │                        │
│  │  (SUNARP driver + web scraping + cron)   │                        │
│  └──────────────────────────────────────────┘                        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Detalle de Entidades por Contexto

### 3.1 IDENTITY

**Responsabilidad:** Autenticación, autorización y gestión de roles.

**Agregados:**
```
User (Aggregate Root)
├── id: UUID
├── email: str
├── hashed_password: str
├── role: UserRole  (inversor | profesional | operador_zeep | admin)
├── is_active: bool
└── refresh_tokens: List[RefreshToken]

RefreshToken
├── token: str
├── user_id: UUID
└── expires_at: datetime
```

**Reglas de Dominio:**
- Un usuario solo puede tener un `InvestorProfile` activo a la vez
- El rol `operador_zeep` puede escribir en el Ledger (aprobar dossiers)
- El rol `admin` puede ingestar documentos en ChromaDB

---

### 3.2 SIMULATION (GANCHO)

**Responsabilidad:** Calcular el Score de Elegibilidad ZEEP por sector en < 3 minutos.

**Agregados:**
```
SimulationRecord (Aggregate Root)
├── id: UUID
├── session_id: UUID
├── sector: SectorType  (manufactura | ckd | tech)
├── inputs: SimulationInputs
│   ├── monto_inversion_usd: Decimal
│   ├── empleo_directo: int
│   ├── porcentaje_cl: float
│   ├── tiempo_instalacion_meses: int
│   └── variables_sector: Dict  (específicas por sector)
├── scores: SimulationScores
│   ├── v_base: float
│   ├── delta_cl: float
│   ├── delta_sector: float
│   └── v_final: float
├── clasificacion: ClasificacionElegibilidad  (elegible | viable_con_ajustes | no_elegible)
├── proyeccion_fiscal: ProyeccionFiscal
├── alertas: List[AlertaElegibilidad]
├── recomendaciones_agente: List[str]
└── timestamp: datetime
```

**Value Objects:**
- `ProyeccionFiscal(ir_estandar_pct, ir_zeep_pct, ahorro_5_anos_usd)`
- `AlertaElegibilidad(tipo, descripcion, impacto_score)`

**Estrategias de Scoring** (Strategy Pattern):
- `ManufacturaScoringStrategy`: aplica `Δ_mfg = f(VA_norm, EG_norm, IA_risk)`
- `CKDScoringStrategy`: aplica `Δ_ckd = f(RCKD, DE, CERT_norm)`
- `TechScoringStrategy`: aplica `Δ_tech = f(RD_score, SE_factor, EAV_norm)`

---

### 3.3 ONBOARDING / PROFILING

**Responsabilidad:** Construir el expediente digital del inversor. **Agregado central del sistema.**

**Agregados:**
```
InvestorProfile (Aggregate Root)
├── id: UUID
├── session_id: UUID  ← hereda de SimulationRecord
├── user_id: UUID  ← propietario autenticado
├── empresa_origen: EmpresaOrigen
├── proyecto: ProyectoInversion
├── perfil_tecnico: PerfilTecnico  (discriminated union por sector)
├── documentos: List[DocumentoAdjunto]
├── roadmap: RoadmapInstalacion
└── estado: ProfileEstado  (en_progreso | completado | archivado)

EmpresaOrigen (Value Object)
├── razon_social: str
├── pais_origen: str  (ISO 3166-1 alpha-2)
├── registro_extranjero: str
├── sector_ciiu: str
├── representante_legal: PersonaRepresentante
└── capital_declarado_usd: Decimal

ProyectoInversion (Value Object)
├── nombre_proyecto: str
├── monto_inversion_usd: Decimal
├── tipo_actividad: TipoActividad
├── empleo_directo_proyectado: int
├── porcentaje_cl: float
├── fecha_inicio_estimada: date
└── exportacion_pct: float

PerfilTecnico (discriminated union)
├── PerfilManufactura(tipo_proceso, materias_primas, requiere_anexo_4, ...)
├── PerfilCKD(ratio_ckd, lineas_montaje, mercado_destino, ...)
└── PerfilTech(tipo_servicio, pct_exportable, requiere_datacenter, ...)

RoadmapInstalacion (Value Object)
├── fases: List[FaseRoadmap]
└── dias_estimados_total: int

FaseRoadmap
├── nombre: FaseNombre  (elegibilidad | validacion_legal | contratacion | operacion)
├── estado: FaseEstado  (completado | en_progreso | pendiente)
├── dias_estimados: int
└── hitos: List[str]
```

**Reglas de Dominio:**
- `InvestorProfile` no puede avanzar a fase `validacion_legal` sin documentos adjuntos mínimos
- El `RoadmapInstalacion` se genera dinámicamente según el sector y las alertas del `SimulationRecord`

---

### 3.4 MATCHMAKING

**Responsabilidad:** Rankear candidatos (CIP/CAL/Proveedores) por compatibilidad con el InvestorProfile.

**Agregados:**
```
MatchResult (Aggregate Root)
├── id: UUID
├── investor_profile_id: UUID
├── categoria: CategoriaMatch  (ingeniero_cip | abogado_cal | proveedor_local)
├── candidatos: List[CandidatoMatch]  (máx. 5, ordenados por score)
├── score_promedio: float
├── justificacion_agente: str
└── created_at: datetime

CandidatoMatch (Entity)
├── candidato_id: UUID
├── nombre: str
├── score_compatibilidad: float  [0-1]
├── especialidad_principal: str
├── disponibilidad: DisponibilidadEstado
├── idiomas: List[str]
├── validacion_institucional: ValidacionEstado
└── justificacion: str  ← generada por Agente Matchmaker (LLM)
```

**Value Objects:**
- `ScoreComponents(e_sector, d_geo, i_idioma, h_hist, v_inst)` — componentes del Match Score

**Reglas de Dominio:**
- Un `MatchResult` con `candidatos.length < 3` activa una alerta al Operador ZEEP
- La validación institucional (CIP/CAL) se re-verifica en tiempo real antes de presentar al usuario
- Comunicación solo vertical: Agente Matchmaker → Agente Orquestador; nunca lateral

---

### 3.5 LEDGER

**Responsabilidad:** Registro inmutable de todos los hitos del ciclo de inversión. Generación del Dossier.

**Agregados:**
```
LedgerEvent (Aggregate Root, append-only)
├── id: UUID
├── investor_profile_id: UUID
├── sequence_number: int  (monotónico, nunca reutilizado)
├── event_type: LedgerEventType
├── payload: JSONB  (inmutable post-creación)
├── actor_id: UUID
├── actor_type: ActorType  (inversor | profesional | agente_ia | sistema)
├── previous_hash: str  (SHA-256 del LedgerEvent anterior)
├── hash: str  (SHA-256 de: seq + type + payload + previous_hash)
└── created_at: datetime  (inmutable)

Minuta (Entity dentro del payload de MINUTA_REGISTRADA)
├── participantes: List[ParticipanteMinuta]
├── acuerdos: List[str]
├── proximos_pasos: List[str]
└── validada_por: UUID

DossierInversion (Aggregate Root)
├── id: UUID
├── investor_profile_id: UUID
├── version: int
├── secciones: DossierSecciones
├── hash_integridad: str
└── url_pdf: str
```

**Reglas de Dominio:**
- **NUNCA** se ejecuta UPDATE o DELETE sobre `ledger_events` (trigger BD)
- El `previous_hash` del primer evento de un perfil siempre es `"GENESIS"`
- `DossierInversion` se genera solo cuando existe un evento `CONTRATO_FIRMADO` en la cadena

---

### 3.6 LEGAL AI

**Responsabilidad:** Consultoría normativa RAG con política de Alucinación Cero.

**Agregados:**
```
ChatSession (Aggregate Root)
├── id: UUID
├── user_id: UUID
├── investor_profile_id: UUID  (opcional, para contexto sectorial)
├── messages: List[ChatMessage]
└── created_at: datetime

ChatMessage (Entity)
├── id: UUID
├── role: MessageRole  (user | assistant | system)
├── content: str
├── confidence_score: float  [0-1]
├── sources: List[NormativaSource]
├── requiere_visado_humano: bool
└── agente_activado: AgenteType  (legal | tecnico | financiero | idi)

NormativaSource (Value Object)
├── norma: str  (ej. "Ley N° 32449")
├── articulo: str
├── fecha_vigencia: date
└── derogado: bool
```

**Knowledge Chunks** (ChromaDB, fuera de PostgreSQL):
- `chunk_id`, `coleccion`, `texto`, `embedding`, `metadatos: {fuente, norma, articulo, fecha_vigencia, derogado}`

**Reglas de Dominio:**
- Toda respuesta debe tener al menos un `NormativaSource` en el campo `sources`
- Si `confidence_score < 0.70` → `requiere_visado_humano = true` obligatoriamente
- Los agentes especialistas no se llaman entre sí; solo el Orquestador puede delegar

---

### 3.7 ETL PADRONRUC (spec07)

**Responsabilidad:** Pipeline ETL mensual para transformar el Padrón de Contribuyentes SUNAT y hacer upsert en `companies`. Provee la capa de conocimiento local que el Agente Matchmaker consulta antes de recurrir a búsqueda en internet.

**Agregados:**
```
PadronRucRecord (Staging — tabla transitoria, truncate mensual)
├── ruc: str  (PK)
├── razon_social: str
├── estado_contribuyente: str  (ACTIVO | SUSPENDIDO | BAJA)
├── condicion_contribuyente: str  (HABIDO | NO HABIDO)
├── ciiu_principal: str
├── ubigeo: str
└── descarga_fecha: date

ETLReport (DTO de resultado)
├── total_staging: int
├── total_insertados: int
├── total_actualizados: int
├── total_rechazados: int
└── estado: str  (completado | fallido | parcial)
```

**Reglas de Dominio:**
- El ETL nunca sobreescribe campos SUNARP (`directorio`, `trust_score`, `cargas`) en `companies`
- Solo se procesan registros con estado=ACTIVO o SUSPENDIDO (excluir BAJA definitiva)
- Lotes de 1.000 registros, cada lote es atómico: fallo en el lote → rollback del lote completo

---

### 3.8 ZEEP INGESTION (spec01)

**Responsabilidad:** Ingesta de datos de registros públicos (SUNARP, El Peruano, MINCETUR, SUNAT).

**Entidades Principales:**
```
SourceURL → ExtractedDocument → StructuredOpportunity
Company (enriquecida desde SUNARP + PadronRUC)
```

---

## 4. Mapa de Contextos (Context Map)

Las relaciones entre contextos, con el tipo de integración y la dirección del flujo.

```
                        ┌─────────────────┐
                        │    IDENTITY      │
                        │  (Auth / Roles)  │
                        └────────┬────────┘
                                 │ protege acceso a todos los contextos
                                 │
         ┌───────────────────────▼──────────────────────────┐
         │                                                    │
   ┌─────▼──────┐   SimulationRecord    ┌──────────────────┐ │
   │ SIMULATION ├──────────────────────►│   ONBOARDING /   │ │
   │  (GANCHO)  │   (session_id, score, │   PROFILING      │ │
   └────────────┘    sector, alertas)   └────────┬─────────┘ │
                                                 │           │
                              InvestorProfile    │           │
                         ┌───────────────────────┤           │
                         │                       │           │
                   ┌─────▼──────┐         ┌──────▼──────┐   │
                   │ MATCHMAKING│         │   LEDGER    │   │
                   │  (MATCH)   ├────────►│  (append    │   │
                   └─────┬──────┘ eventos │   only)     │   │
                         │       match    └──────┬──────┘   │
                         │                       │           │
                         └───────────────────────┤           │
                                                 │ lee datos │
                               ┌─────────────────▼──────┐   │
                               │      ANALYTICS /        │   │
                               │      PADRONRUC          │◄──┘
                               └─────────────────────────┘
                                         ▲
                                         │ datos de empresas
                               ┌─────────┴──────────┐
                               │  ZEEP INGESTION    │
                               │  (SUNARP / scraper)│
                               └────────────────────┘

   ┌──────────────────────────────────────────────────────┐
   │                    LEGAL AI (RAG)                     │
   │  (transversal — disponible en todas las fases del     │
   │   roadmap; escribe en LEDGER cuando confidence < 0.70)│
   └──────────────────────────────────────────────────────┘
```

### Tipos de Relación Entre Contextos

| Upstream | Downstream | Tipo | Contrato |
|---|---|---|---|
| SIMULATION | ONBOARDING | **Customer/Supplier** | `SimulationRecord` pasado como input al crear `InvestorProfile` |
| ONBOARDING | MATCHMAKING | **Customer/Supplier** | `InvestorProfile` es el input del algoritmo de matching |
| ONBOARDING | LEDGER | **Event Publisher** | Evento `investor.profile.completed` registrado en Ledger |
| MATCHMAKING | LEDGER | **Event Publisher** | Eventos `match.generated`, `reunion.requested`, `minuta.registrada` |
| LEGAL AI | LEDGER | **Event Publisher** | Consultas con `requiere_visado_humano=true` registradas |
| ZEEP INGESTION | ETL PADRONRUC | **Shared Kernel** | Tabla `companies` compartida; spec07 escribe campos PadronRUC, spec01 escribe campos SUNARP |
| ZEEP INGESTION | LEGAL AI | **Conformist** | ChromaDB alimentado por el pipeline de ingesta de normas |
| IDENTITY | Todos | **Open Host Service** | JWT bearer token validado en cada contexto vía `get_current_user()` |

---

## 5. Eventos de Dominio (Cross-Context)

Eventos que cruzan fronteras de contexto y disparan acciones downstream.

| Evento | Publicado por | Consumido por | Datos |
|---|---|---|---|
| `simulation.completed` | SIMULATION | ONBOARDING | `session_id`, `score_final`, `sector`, `alertas` |
| `investor.profile.completed` | ONBOARDING | MATCHMAKING, ZEEP INGESTION (validación SUNARP async) | `investor_profile_id`, `sector_ciiu`, `pais_origen` |
| `match.reunion.requested` | MATCHMAKING | LEDGER | `investor_profile_id`, `candidato_id`, `categoria` |
| `ledger.minuta.registered` | LEDGER | LEDGER (self — avance de fase en roadmap) | `investor_profile_id`, `minuta_id`, `fase_roadmap` |
| `ledger.contract.signed` | LEDGER | LEDGER (self, dispara DossierGeneration) | `investor_profile_id` |
| `ai.visado.required` | LEGAL AI | LEDGER, notificación a comité CIP/CAL | `chat_session_id`, `query`, `confidence_score` |
| `padron.ingestion.completed` | ETL PADRONRUC | ZEEP INGESTION (sync_logs actualizado) | `fecha_descarga`, `total_insertados`, `total_actualizados` |

---

## 6. Reglas de Diseño Transversales (de presentacion.md)

Estas restricciones aplican a **todos los contextos** y son no-negociables:

1. **Pureza del Dominio (Agentes IA):** Ningún agente de la capa cognitiva (`AUTOMATIZACION_E_IA`) consulta directamente PostgreSQL. Toda persistencia va a través de endpoints FastAPI del `Nucleo_del_Sistema`.

2. **Aislamiento de Agentes:** Los agentes especialistas (`Agente_Legal`, `Agente_Matchmaker`, `Agente_Tecnico`, `Agente_Financiero`, `Agente_IDI`, `Agente_Auditor`) no se comunican horizontalmente. Todo fluye verticalmente a través del `Agente_Orquestador`.

3. **Abstracción de Consultas Externas:** Las consultas a SUNARP, MINAM, MINCETUR, CIP, CAL no se hacen mediante scraping directo desde los controladores. Se delegan al módulo de búsqueda web (Tavily) o a los drivers especializados (spec01), garantizando contratos de salida en JSON.

4. **Immutabilidad del Ledger:** El contexto LEDGER es append-only. Ningún otro contexto puede modificar o eliminar eventos ya registrados.

5. **Grounding Obligatorio:** El contexto LEGAL AI nunca entrega una respuesta sin chunks normativos verificados como fuente.

---

## 7. Diagrama de Flujo de Valor (Value Stream)

```
[USUARIO EXTRANJERO]
       │
       ▼
[01. GANCHO — Simulación]          ← 3 minutos, sin registro obligatorio
       │ SimulationRecord
       ▼
[02. PROFILING — Onboarding]       ← registro de usuario + expediente completo
       │ InvestorProfile + evento
       ▼
[03. MATCH — Matchmaking]          ← Top 5 por categoría (CIP/CAL/Proveedor)
       │ MatchResult + eventos de reunión
       ▼
[04. LEDGER — Minutas y Dossier]   ← registro inmutable + Dossier Pre-Aprobado
       │
       ▼
[OPERADOR ZEEP — Validación Final]
       │ firma contrato
       ▼
[OPERACIÓN — Inicio de actividad económica en ZEEP]

[LEGAL AI RAG]  ←── disponible en todas las fases ──►  [ETL PADRONRUC]
                     como capa cognitiva transversal      (pipeline mensual
                                                          SUNAT → companies)
```

---

## 8. Módulos Backend ↔ Bounded Contexts

| Bounded Context | Módulo Backend (`backend/src/modules/`) | Spec |
|---|---|---|
| IDENTITY | `identity/` | — |
| SIMULATION | `zeep_simulation/` *(a crear)* | spec02 |
| ONBOARDING/PROFILING | `onboarding/` | spec03 |
| MATCHMAKING | `marketplace/` (extender) | spec04 |
| LEDGER | `ledger/` *(a crear)* | spec05 |
| LEGAL AI | `ai_agent/` | spec06 |
| ETL PADRONRUC | `analytics_padron_ruc/` *(a crear)* | spec07 |
| ZEEP INGESTION | `zeep_ingestion/` | spec01 |
