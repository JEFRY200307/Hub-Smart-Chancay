# System Design Document — COMEX.AI / Sovereign Gateway
**Versión:** 2.0 | **Estado:** Activo | **Referencia:** RFC-001-ZEEP  
**Última actualización:** 2026-05-22 | **Basado en:** spec01–spec07, ADR-01, ADR-02, DOMAIN_MAP v2.0

---

## 1. Contexto y Visión

### Propósito del Sistema

COMEX.AI (Sovereign Gateway) es una plataforma B2B omnicanal impulsada por IA diseñada para eliminar la asimetría de información y la fricción burocrática en la Zona Económica Especial Privada (ZEEP) de Chancay. Actúa como el puente verificable entre la inversión extranjera y la oferta de servicios local, reduciendo el ciclo de instalación de **meses a 4 días hábiles**.

### Objetivos de Negocio

| Objetivo | KPI | Meta |
|---|---|---|
| Reducir time-to-market de inversión | Días promedio Simulación → Contrato | ≤ 4 días hábiles |
| Automatizar matchmaking | % matches confirmados sin intervención manual | ≥ 80% |
| Precisión legal del RAG | % respuestas con `confidence_score ≥ 0.70` | ≥ 85% |
| Integración de MIPYMEs | % proveedores ZEEP validados via plataforma | +15% trimestral |

### Problemática Resuelta

- **Incertidumbre Legal:** Ley ZEEP N° 32449 compleja → Agente RAG con política de Alucinación Cero
- **Falta de Confianza:** Sin forma de verificar proveedores/profesionales → Validación real-time CIP/CAL/SUNARP
- **Desconexión Operativa:** Sin trazabilidad del flujo inversor → Ledger inmutable + Dossier Pre-Aprobado

---

## 2. Arquitectura del Sistema

### Visión General por Capas

```
[CAPA 1: PRESENTACIÓN]
  Next.js 16 + React 19 (App Router, i18n ES/EN/ZH)
  SPA → REST API exclusivamente
  Responsabilidad: Profiling, formularios dinámicos, Stitch Views

         │  HTTP REST  │  JSON  │  JWT Bearer
         ▼

[CAPA 2: NÚCLEO DEL SISTEMA]
  FastAPI + Python 3.12 (Monolito Modular + Arquitectura Hexagonal)
  Almacenamiento híbrido:
    ├─ PostgreSQL 16 + pgvector   ← transaccional, relacional, vectores (PadronRUC)
    └─ ChromaDB                   ← base de conocimiento normativo (RAG legal)

         │  Inyección de dependencias  │  Servicios internos
         ▼

[CAPA 3: AUTOMATIZACIÓN E IA]
  Patrón Supervisor-Worker:
    Agente Orquestador (Supervisor)
      ├─ Agente Legal
      ├─ Agente Matchmaker
      ├─ Agente Técnico
      ├─ Agente Financiero
      ├─ Agente I+D+i
      └─ Agente Auditor  (siempre último eslabón)
  Regla de ORO: comunicación SOLO vertical (Orquestador ↔ Especialista)
  Los agentes NUNCA consultan PostgreSQL directamente

         │  Tavily Search API  │  Groq/Gemini/Claude
         ▼

[CAPA 4: SERVICIOS EXTERNOS]
  CIP Lima API, CAL API, SUNARP driver, SUNAT PadronRUC
  MINCETUR, El Peruano, MINAM, SENACE, PRODUCE, INACAL
```

### Macro-Arquitectura: Monolito Modular

Un único proceso desplegado con fronteras de dominio estrictamente aisladas. Justificación: equipo reducido, MVP, latencia de red interna cero entre módulos. Revisable en Fase 3 (Q3 2027) para extracción de microservicios.

### Micro-Arquitectura: Hexagonal (Ports & Adapters)

Dentro de cada módulo, el dominio es el rey:

```
modules/{nombre}/
├── domain/          # Entidades, Value Objects, excepciones, interfaces (sin imports de framework)
├── application/     # Casos de uso, DTOs, servicios de aplicación
└── infrastructure/  # FastAPI routers, SQLModel repositories, adaptadores externos
```

---

## 3. Módulos del Sistema

| Módulo | Path Backend | Bounded Context | Spec | Estado |
|---|---|---|---|---|
| Auth / Identity | `modules/identity/` | IDENTITY | — | Implementado |
| SUNARP Driver | `modules/zeep_ingestion/` | ZEEP INGESTION | spec01 | Implementado |
| Motor de Simulación | `modules/zeep_simulation/` | SIMULATION | spec02 | Pendiente |
| Onboarding / Profiling | `modules/onboarding/` | ONBOARDING | spec03 | En progreso |
| Matchmaking | `modules/marketplace/` | MATCHMAKING | spec04 | En progreso |
| Ledger de Trazabilidad | `modules/ledger/` | LEDGER | spec05 | Pendiente |
| Agente Legal RAG | `modules/ai_agent/` | LEGAL AI | spec06 | En progreso |
| ETL PadronRUC | `modules/analytics_padron_ruc/` | ANALYTICS | spec07 | Pendiente |

### Endpoints por Módulo

```
/api/v1/auth/           identity
/api/v1/simulation/     zeep_simulation  (GANCHO)
/api/v1/onboarding/     onboarding       (PROFILING)
/api/v1/marketplace/    marketplace      (MATCH + directorio)
/api/v1/ledger/         ledger           (LEDGER + dossier)
/api/v1/ai/             ai_agent         (LEGAL AI)
/api/v1/analytics/      analytics        (PADRONRUC ETL — ingest + status)
/api/v1/ingestion/      zeep_ingestion   (admin: scrapers, cron)
```

---

## 4. Flujo de Valor Principal

```
[01. GANCHO — Simulación de Elegibilidad]  spec02
  ├─ Input: sector, inversión, CL, empleos, variables sectoriales
  ├─ Proceso: V_final = V_base + ΔCL + Δ_sector  (< 3 minutos)
  └─ Output: Score 0-100, clasificación, proyección fiscal, recomendaciones IA

         │ SimulationRecord (session_id, score, sector, alertas)
         ▼

[02. PROFILING — Onboarding del Inversor]  spec03
  ├─ Input: datos corporativos, proyecto, perfil técnico por sector
  ├─ Proceso: formulario dinámico + Agente Orquestador (clarificación)
  └─ Output: InvestorProfile completo + RoadmapInstalacion personalizado

         │ investor.profile.completed (evento de dominio)
         ▼

[03. MATCH — Matchmaking Institucional]  spec04
  ├─ Input: InvestorProfile (sector, idioma, necesidades técnicas)
  ├─ Proceso: S_candidato = Σ(Wi × Xi) por CIP/CAL/Proveedor → Top 5
  └─ Output: MatchResult con justificación IA + solicitud de reunión

         │ eventos: match.generated, reunion.solicitada, minuta.registrada
         ▼

[04. LEDGER — Trazabilidad e Inmutabilidad]  spec05
  ├─ Input: eventos de todos los módulos (append-only, hashing SHA-256)
  ├─ Proceso: cadena de hashes verificable + seguimiento del roadmap
  └─ Output: Timeline auditable + DossierInversion PDF al cerrar contrato

[LEGAL AI RAG — Consultoría 24/7]  spec06          [ETL PADRONRUC]  spec07
  Transversal a todas las fases                      Pipeline mensual SUNAT
  ChromaDB + Supervisor-Worker                       Staging → upsert companies
```

---

## 5. Contratos de API

- **Estándar:** RESTful con OpenAPI 3.1 (auto-generado por FastAPI en `/docs`)
- **Validación:** Pydantic v2 en todos los payloads de entrada y salida
- **Errores:** RFC 7807 — Problem Details for HTTP APIs

```json
{
  "type": "https://comex.ai/errors/validation",
  "title": "Validation Failed",
  "status": 400,
  "detail": "El porcentaje de componentes locales debe estar entre 0 y 100."
}
```

- **Autenticación:** JWT Bearer token en header `Authorization`. Refresh tokens almacenados en BD con rotación.
- **Versionado:** Todos los endpoints bajo `/api/v1/`

---

## 6. Patrones de Diseño

| Patrón | Módulo(s) | Justificación |
|---|---|---|
| **Strategy + Factory** | Simulation, Legal AI | `SectorScoringStrategy` y `LLMProvider` son intercambiables sin tocar casos de uso |
| **Supervisor-Worker** | Legal AI (todos los agentes) | Trazabilidad del flujo cognitivo; el Auditor siempre es el último eslabón |
| **Repository + Unit of Work** | Todos los módulos | Abstracción SQL; atomicidad transaccional en operaciones multi-tabla |
| **Decorator + Observer** | Legal AI (LLM calls) | Métricas de latencia y tokens sin bloquear la respuesta al usuario |
| **Event Sourcing (simplificado)** | Ledger | Estado del proceso reconstruible desde la lista de LedgerEvents |
| **Append-Only Log** | Ledger | Inmutabilidad estructural + hashing encadenado SHA-256 |
| **Builder** | Onboarding | `InvestorProfileBuilder` acumula pasos del formulario multi-etapa |
| **ETL Pipeline** | Analytics | Extractor → Transformer → Loader con validación por etapa |
| **CQRS (simplificado)** | Analytics | Escrituras por ETL cron; lecturas sobre vistas materializadas |
| **Anti-Corruption Layer** | Analytics ← Ledger | Analytics no accede directamente a `ledger_events`; usa vista materializada |

---

## 7. Diseño de la Base de Datos

### Motor Primario: PostgreSQL 16 + pgvector

```sql
-- IDENTITY
users (id, email, hashed_password, role, is_active, created_at)
refresh_tokens (token, user_id, expires_at)

-- SIMULATION
simulation_records (id, session_id, user_id, sector, inputs JSONB,
                    scores JSONB, clasificacion, proyeccion_fiscal JSONB,
                    alertas JSONB[], timestamp)

-- ONBOARDING
investor_profiles (id, session_id, user_id, empresa_origen JSONB,
                   proyecto JSONB, perfil_tecnico JSONB, roadmap JSONB,
                   estado, created_at)
documentos_adjuntos (id, investor_profile_id, tipo, url, created_at)

-- MATCHMAKING
match_results (id, investor_profile_id, categoria, candidatos JSONB[],
               score_promedio, justificacion_agente, created_at)

-- LEDGER
ledger_events (id, investor_profile_id, sequence_number, event_type,
               payload JSONB, actor_id, actor_type, previous_hash,
               hash, created_at)
  -- Restricciones: NO UPDATE, NO DELETE (trigger + RLS)
dossiers_inversion (id, investor_profile_id, version, secciones JSONB,
                    hash_integridad, url_pdf, created_at)

-- LEGAL AI
chat_sessions (id, user_id, investor_profile_id, created_at)
chat_messages (id, session_id, role, content, confidence_score,
               sources JSONB[], requiere_visado_humano, agente_activado)

-- ZEEP INGESTION
source_urls (id, url, system_prompt, last_scraped_at)
extracted_documents (id, source_url_id, raw_content, created_at)
structured_opportunities (id, document_id, titulo, descripcion, tipo,
                          highlights JSONB[], embedding vector(1536))
companies (ruc, razon_social, sector_ciiu, estado, capital_social,
           directorio JSONB, trust_score, capacidad_operativa,
           coordenadas point, distancia_puerto_km, last_updated)

-- ETL PADRONRUC (staging transitorio — truncate + insert mensual)
padron_ruc_staging (ruc, razon_social, estado_contribuyente,
                    condicion_contribuyente, ciiu_principal, ubigeo,
                    fecha_inscripcion, descarga_fecha)
```

### Motor Vectorial: ChromaDB

Colecciones del Agente Legal RAG:

| Colección | Fuente | Actualización |
|---|---|---|
| `ley_zeep_32449` | MINCETUR / El Peruano | Versionado (inmutable salvo nueva versión de ley) |
| `resoluciones_mincetur` | MINCETUR web | Semanal |
| `normas_el_peruano` | El Peruano scraping | Diario (cron) |
| `normas_ambientales` | MINAM / SENACE | Semanal |
| `normas_manufactura` | PRODUCE / INACAL | Mensual |
| `normas_ckd` | SUNAT / MINCETUR | Mensual |
| `normas_tech` | CONCYTEC / PCM | Mensual |
| `jurisprudencia_zeep` | APN | Trimestral |

**Chunking:** RecursiveCharacterTextSplitter, `chunk_size=512 tokens`, `chunk_overlap=64 tokens`. Artículo como unidad mínima.

---

## 8. Arquitectura del Agente de IA (Supervisor-Worker)

```
[CONSULTA / TRIGGER DEL USUARIO]
         │
         ▼
[Agente Orquestador]
  ├─ Detecta idioma (ES/EN/ZH)
  ├─ Clasifica intención (legal | técnica | financiera | procedimental | match)
  ├─ Selecciona agente(s) especialista(s)
  └─ Consolida respuesta del Auditor
         │                           │
         ▼                           │ (siempre al final)
[Agente Especialista]          [Agente Auditor]
  ├─ Agente Legal               ├─ Verifica grounding
  ├─ Agente Matchmaker          ├─ Calcula confidence_score
  ├─ Agente Técnico             ├─ Valida vigencia de normas
  ├─ Agente Financiero          └─ Activa visado si < 0.70
  └─ Agente I+D+i
```

**Reglas de Inyección (no negociables):**
1. Los agentes especialistas reciben solo su contexto específico como input; retornan solo su output tipado
2. Ningún agente consulta PostgreSQL directamente; usa endpoints del Core Backend
3. Consultas a SUNARP/MINAM/MINCETUR se delegan a Tavily o a los drivers especializados (spec01)

**Stack LLM:**
- Primario: Groq API (Llama 3.3 70B) — latencia baja, costo mínimo
- Fallback: Google Gemini 1.5 Flash
- Alta complejidad legal: Claude API (Agente Auditor en casos `confidence < 0.70`)
- Embeddings: `nomic-embed-text` (Groq) o `text-embedding-3-small` (OpenAI)

---

## 9. Estrategia de IA Detallada

### RAG Legal (spec06)
- Temperatura LLM: 0.1 (respuestas deterministas)
- Re-ranking: similitud coseno × factor de vigencia de la norma
- Tavily Search activo cuando `confidence < 0.85` y la consulta menciona normativas post-2024
- Historial de consultas en PostgreSQL para auditoría del comité CIP/CAL

### Motor de Scoring (spec02)
- Modelo lineal ponderado (no ML): interpretable, auditable por reguladores
- Pesos Wi en tabla de configuración en BD (actualizables sin despliegue)
- Revisión para ML en Q1 2027 cuando Ledger acumule ≥ 500 perfiles completados

---

## 10. Historias de Usuario y Criterios de Aceptación

### ÉPICA 1: Smart Dashboard & Simulación de Elegibilidad

**HU-01 | Autenticación y Roles (🔴 Crítica)**
- Gestión de usuarios con roles: `inversor`, `profesional`, `operador_zeep`, `admin`
- JWT + refresh tokens con rotación en BD

**HU-02 | Simulación GANCHO (🔴 Crítica)**  
- Como Inversionista Extranjero, quiero calcular mi Score de Elegibilidad ZEEP en < 3 minutos seleccionando mi sector y variables de proyecto, para decidir si vale la pena iniciar el onboarding formal.
- *AC:* Score calculado con fórmula documentada en spec02. Proyección fiscal visible. Recomendaciones del Agente Técnico mínimo 2 ítems.

**HU-03 | Scraper de Datos Oficiales (🔴 Crítica)**
- Extracción diaria automática desde El Peruano, MINCETUR, MINAM (APScheduler)
- Chunking y carga en ChromaDB para el RAG

**HU-04 | Resumen Dinámico RAG en Dashboard (🟡 Alta)**
- El Agente Legal resume novedades normativas de la ZEEP para el dashboard del inversor

### ÉPICA 2: Onboarding y Validación Legal

**HU-05 | Onboarding PROFILING (🔴 Crítica)**
- Como Inversionista, quiero completar mi perfil de inversión con un formulario dinámico adaptado a mi sector (Manufactura/CKD/Tech), para que la plataforma personalice mi roadmap de instalación.
- *AC:* Formulario adapta campos según sector (spec03). Agente Orquestador genera preguntas de clarificación. RoadmapInstalacion creado con días estimados.

**HU-06 | Validación Institucional Automatizada (🔴 Crítica)**
- Como Sistema, quiero verificar en tiempo real la habilitación de ingenieros CIP y abogados CAL, para otorgar la insignia "Verificado" solo a profesionales activos.
- *AC:* Badge verde = habilitación vigente. Badge rojo = inhabilitado. Verificación re-ejecutada antes de presentar al usuario.

**HU-07 | Validación SUNARP de Proveedores (🔴 Crítica)**
- Como Sistema, quiero consultar el estado registral de proveedores locales en SUNARP (spec01), para mostrar su Trust Score y cargas registrales al inversor.

### ÉPICA 3: Matchmaking Institucional

**HU-08 | Matchmaking Automático (🔴 Crítica)**
- Como Inversionista, quiero ver un ranking de Top 5 de Ingenieros CIP, Abogados CAL y Proveedores locales compatibles con mi proyecto, para iniciar reuniones sin búsqueda manual.
- *AC:* Score calculado con fórmula de spec04. Justificación generada por Agente Matchmaker visible en tarjeta. Validación institucional re-verificada al mostrar.

**HU-09 | Solicitud de Reunión y Registro de Minuta (🟡 Alta)**
- Como Inversionista, quiero solicitar reuniones con candidatos y registrar minutas, para que quede trazabilidad en el Ledger de cada interacción.
- *Gherkin:*
  - `Given` que el inversor selecciona un candidato y solicita reunión
  - `When` el sistema registra el evento `REUNION_SOLICITADA` en el Ledger
  - `Then` el candidato recibe notificación y el roadmap avanza de estado

**HU-10 | Directorio de Proveedores (🟡 Alta)**
- Búsqueda semántica de empresas en el PadronRUC enriquecido con filtros: sector, distancia al puerto, Trust Score mínimo.

### ÉPICA 4: Agente Legal RAG y Consultoría 24/7

**HU-11 | Asesoría Legal Especializada (🔴 Crítica)**
- Como Inversionista, quiero consultar al Agente Legal en mi idioma (ES/EN/ZH) sobre la Ley ZEEP N° 32449, para resolver dudas sin intermediarios.
- *AC:* Respuesta incluye artículo citado. `confidence_score` visible. Badge ⚠ si `< 0.70`.

**HU-12 | Function Calling para Búsqueda en Directorio (🔴 Crítica)**
- *Gherkin:*
  - `Given` que el usuario pregunta "Busco ingenieros CIP especializados en cadena de frío"
  - `When` el Orquestador clasifica la intención como `match`
  - `Then` activa el Agente Matchmaker que ejecuta `search_candidates(especialidad="frío")`
  - `And` retorna lista formateada de 3 ingenieros disponibles

**HU-13 | Trazabilidad de Consultas Legales (🟡 Alta)**
- Registro en BD de todas las consultas con `requiere_visado_humano=true` para auditoría periódica del comité CIP/CAL.

### ÉPICA 5: Ledger y Dossier de Inversión

**HU-14 | Ledger Inmutable (🔴 Crítica)**
- Como Operador ZEEP, quiero un registro auditado de cada hito de la inversión, para verificar la trazabilidad sin depender de la memoria de los participantes.
- *AC:* Hashing encadenado SHA-256. Endpoint `/verify` disponible. Restricciones BD previenen UPDATE/DELETE.

**HU-15 | Generación de Dossier Pre-Aprobado (🟡 Alta)**
- Al firmar el contrato, el sistema genera automáticamente el PDF del Dossier de Inversión con resumen ejecutivo generado por IA y hash de integridad.

### ÉPICA 6: ETL PadronRUC

**HU-16 | Ingesta PadronRUC (🟡 Alta)**
- Como Sistema, quiero ingestar mensualmente el PadronRUC de SUNAT (spec07) en lotes de 1.000 registros, para mantener el directorio de proveedores locales actualizado en la tabla `companies` y que el Agente Matchmaker pueda buscar allí antes de consultar internet.

---

## 11. Infraestructura y Stack Tecnológico

| Capa | Tecnología | Versión | Rol |
|---|---|---|---|
| Frontend | Next.js + React | 16.2.4 / 19.2.4 | SPA con App Router + i18n (ES/EN/ZH) |
| Estilos | Tailwind CSS | v4 | Utility-first |
| Backend | FastAPI + Python | 0.115+ / 3.12 | Core, routing, DI |
| ORM | SQLModel (SQLAlchemy + Pydantic) | v2 | Tipado estricto, validación |
| BD Relacional | PostgreSQL 16 (Supabase) | 16 | Almacenamiento transaccional (Supabase PaaS, ver ADR-01-10) |
| BD Vectorial (RAG) | ChromaDB | latest | Embeddings normativos |
| BD Vectorial (Analytics) | pgvector | latest | Embeddings PadronRUC |
| LLM Primario | Groq API (Llama 3.3 70B) | — | Agentes, generación |
| LLM Fallback | Google Gemini 1.5 Flash | — | Fallback automático |
| LLM Alta Complejidad | Claude API (claude-sonnet-4-6) | — | Auditoría legal crítica |
| Web Search | Tavily Search API | — | Grounding externo |
| Web Scraping | Scrapling + Playwright + curl_cffi | — | Ingesta de normas |
| Task Scheduler | APScheduler | — | Cron de ingesta, ETL PadronRUC |
| Auth | python-jose + passlib + bcrypt | — | JWT + hashing |
| Contenedores | Docker + Docker Compose | — | Orquestación local |
| CI/CD | GitHub Actions | — | Pipeline automatizado (Q2 2026) |
| Deployment | Azure Container Apps / App Services | — | PaaS sin mantenimiento de infra |

---

## 12. Architecture Decision Records

| ADR | Título | Decisión |
|---|---|---|
| ADR-01-01 | Backend unificado vs separado | Backend único (monolito modular). Microservicios en Fase 3 (Q3 2027) |
| ADR-01-02 | Estrategia de datos SUNARP | Scraping + datos históricos 2019-2024; Gestión 2025 para datos recientes |
| ADR-02-01 | Modelo scoring: lineal vs ML | Modelo lineal ponderado; revisión ML en Q1 2027 con ≥ 500 perfiles |
| ADR-02-02 | Calibración de pesos Wi | W1=0.45, W2=0.25, W3=0.30 (calibrados con MINCETUR; en tabla BD) |
| ADR-02-03 | ChromaDB vs pgvector para RAG | ChromaDB para RAG legal; pgvector para analytics PadronRUC |
| ADR-02-04 | Patrón Supervisor-Worker | Comunicación estrictamente vertical; Auditor siempre último eslabón |
| ADR-02-05 | LLM primario: Groq vs OpenAI vs Claude | Groq primario; Claude para validaciones legales críticas (confidence < 0.70) |
| ADR-02-06 | Chunking para RAG legal | RecursiveCharacterTextSplitter, 512 tokens, artículo como unidad mínima |
| ADR-02-07 | Inmutabilidad Ledger: hash vs blockchain | Hash encadenado SHA-256 en PostgreSQL; endpoint `/verify` público |
| ADR-02-08 | Ingesta PadronRUC: API vs bulk | Descarga bulk mensual (TXT público SUNAT); API individual para validación RT |
| ADR-02-09 | Predicción demanda CIP en cold-start | Regresión lineal simple; ARIMA/Prophet en Q2 2027 |
| ADR-02-10 | i18n del Agente Legal | Operación interna en ES; traducción de respuesta final a EN/ZH |
| ADR-01-10 | Despliegue PostgreSQL en Supabase | Supabase PaaS para MVP; migraciones vía Alembic; no se usa cliente JS de Supabase |

---

## 13. Estructura del Repositorio

```
Hub-Smart-Chancay/
├── frontend/
│   └── src/
│       ├── app/[locale]/              # App Router con i18n (es/en/zh)
│       │   ├── page.tsx               # Landing / GANCHO (simulación pública)
│       │   ├── login/
│       │   └── dashboard/
│       │       ├── legal-ai/          # Agente Legal RAG
│       │       ├── match/             # Resultados matchmaking
│       │       ├── operators/         # Directorio de proveedores
│       │       └── ledger/            # Timeline de trazabilidad
│       ├── components/
│       └── i18n/
│
├── backend/
│   └── src/
│       ├── main.py                    # Bootstrap FastAPI + mount routers
│       ├── shared/
│       │   ├── domain/exceptions.py   # DomainException base
│       │   └── infrastructure/
│       │       ├── database.py        # SQLModel engine + get_session()
│       │       ├── security.py        # JWT + bcrypt
│       │       └── error_handlers.py  # RFC 7807 global handlers
│       └── modules/
│           ├── identity/              # Auth, JWT, refresh tokens
│           ├── zeep_simulation/       # Motor scoring GANCHO (spec02)
│           ├── onboarding/            # InvestorProfile, PerfilTecnico (spec03)
│           ├── marketplace/           # Matchmaking + directorio (spec04)
│           ├── ledger/                # Append-only + dossier (spec05)
│           ├── ai_agent/              # Supervisor-Worker RAG (spec06)
│           ├── analytics_padron_ruc/  # ETL PadronRUC — staging → companies (spec07)
│           └── zeep_ingestion/        # SUNARP driver + scrapers (spec01)
│
├── docs/
│   ├── SDD.md                         # Este documento
│   ├── DOMAIN_MAP.md                  # Bounded contexts + entidades + context map
│   ├── DB_SCHEMA.md                   # Esquema SQL detallado
│   ├── API_CONTRACTS.md               # OpenAPI 3.1 por módulo
│   ├── adr/
│   │   ├── adr01.md                   # ADR-01: Arquitectura base + SUNARP
│   │   └── adr02.md                   # ADR-02: Fórmulas, LLM, Ledger, Analytics
│   ├── specs/
│   │   ├── spec01.md                  # SUNARP driver
│   │   ├── spec02.md                  # Motor simulación GANCHO
│   │   ├── spec03.md                  # Onboarding PROFILING
│   │   ├── spec04.md                  # Matchmaking MATCH
│   │   ├── spec05.md                  # Ledger LEDGER
│   │   ├── spec06.md                  # Agente Legal RAG
│   │   ├── spec07.md                  # ETL PadronRUC
│   │   └── spec08.md                  # Email OTP — Registro empresa extranjera
│   └── views/                         # Mockups UI por vista
│
├── docker-compose.yml                 # db (5432) + api (8000) + web (3000)
└── CLAUDE.md                          # Guía para Claude Code
```

---

## 14. Roadmap de Implementación

| Fase | Período | Entregables |
|---|---|---|
| **Fase 1 — Pilotaje Funcional** | Q1 2026 (actual) | spec02 (GANCHO), spec03 (PROFILING), spec05 (LEDGER base), integración CIP/CAL en spec04, calibración RAG spec06 |
| **Fase 2 — Consolidación** | Q1 2027 | spec07 (ETL PadronRUC en producción), spec08 (verificación email OTP), spec01 full (SUNARP scraping + bulk histórico), internacionalización completa ZH |
| **Fase 3 — Multi-Zona** | Q3 2027 | Parametrización para otras ZEEP peruanas y hubs portuarios de LATAM; evaluación extracción de microservicios |

**Avance actual:** 35% global. Fase validación legal en progreso (45%).
