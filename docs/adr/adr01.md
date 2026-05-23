# Architecture Decision Record — ADR-01

**fecha:** 2026-05-09 (actualizado: 2026-05-22)  
**autor:** Jefferson Daniel Flores Montenegro  
**estado:** activo  
**alcance:** Decisiones fundacionales del sistema COMEX.AI / Sovereign Gateway

---

## Contexto General

COMEX.AI es una plataforma B2B para facilitar inversión extranjera en la ZEEP de Chancay. El equipo de desarrollo es reducido (3 personas), el plazo es de hackathon-MVP, y el sistema debe ser mantenible, escalable y auditado por entidades institucionales (CIP Lima, MINCETUR, Operador ZEEP). Este ADR registra las decisiones fundacionales de arquitectura, stack tecnológico y estrategia de datos sobre las que se construye todo el sistema.

---

## ADR-01-01: Macro-Arquitectura — Monolito Modular vs Microservicios

**Decisión:** Monolito Modular con fronteras de dominio estrictamente aisladas.

**Alternativas consideradas:**
- Microservicios desde el inicio
- Monolito modular (elegido)
- Serverless functions

**Razones:**
1. Con un equipo de 3 personas, la penalización operativa de los microservicios (gestión de red, service discovery, distributed tracing) supera el beneficio en esta etapa
2. La latencia de red interna entre servicios sería un overhead innecesario en MVP; el monolito modular mantiene comunicación en memoria
3. Las fronteras de dominio definidas en el DOMAIN_MAP permiten extraer microservicios en Fase 3 (Q3 2027) sin refactoring estructural mayor
4. Un único proceso simplifica el pipeline de CI/CD y el despliegue en Azure Container Apps

**Consecuencia:** Cada módulo (`identity/`, `ai_agent/`, `marketplace/`, etc.) tiene su propia capa `domain/`, `application/` e `infrastructure/`. Ningún módulo importa directamente las clases internas de otro módulo; la comunicación va por interfaces o eventos.

---

## ADR-01-02: Micro-Arquitectura — Arquitectura Hexagonal (Ports & Adapters)

**Decisión:** Arquitectura Hexagonal dentro de cada módulo del monolito.

**Razones:**
1. Aislar la lógica de dominio de los frameworks (FastAPI, SQLModel, LLMs) permite testear el dominio sin infraestructura
2. El intercambio de proveedores LLM (Groq → Gemini → Claude) es transparente para los casos de uso gracias a los puertos (`LLMProvider`, `EmbeddingProvider` en `domain/llm.py`)
3. El patrón Repository abstrae PostgreSQL del dominio; si cambiamos a otro motor de BD, solo cambia el adaptador

**Estructura por módulo:**
```
modules/{nombre}/
├── domain/          # Sin imports de framework. Entidades, VOs, interfaces, excepciones
├── application/     # Casos de uso, DTOs, servicios (orquesta dominio + ports)
└── infrastructure/  # FastAPI routers, SQLModel repos, adaptadores LLM/externos
```

---

## ADR-01-03: Sistema de 4 Capas (Arquitectura del Sistema Global)

**Decisión:** Dividir el sistema en 4 capas con responsabilidad única y contratos limpios entre capas.

```
Capa 1: Presentación     → Next.js SPA, solo REST, sin lógica de negocio
Capa 2: Núcleo           → FastAPI + PostgreSQL + ChromaDB
Capa 3: Automatización e IA → Supervisor-Worker, sin acceso directo a BD
Capa 4: Servicios Externos → CIP, CAL, SUNARP, MINCETUR, El Peruano, Tavily
```

**Reglas de contrato entre capas (no negociables):**
1. La Capa 3 (agentes) NUNCA consulta PostgreSQL directamente. Toda persistencia va a través de endpoints o servicios de Capa 2
2. Los agentes especialistas NO se comunican horizontalmente. Solo el Orquestador puede delegar
3. Las consultas a entidades externas (SUNARP, MINAM) no se hacen desde controladores; se delegan a Tavily o drivers especializados (spec01)

---

## ADR-01-04: Stack Tecnológico — Selección y Justificación

### Backend

**Decisión:** Python 3.12 + FastAPI

| Alternativa | Razón de rechazo |
|---|---|
| Node.js + Express | Ecosistema IA/ML de Python es insustituible (LangChain, ChromaDB, Scrapling) |
| Django | ORM demasiado acoplado; FastAPI tiene mejor DI nativa para arquitectura hexagonal |
| Flask | Sin validación automática de tipos ni OpenAPI nativo |

FastAPI provee: tipado estricto (Pydantic v2), DI nativa (Depends), OpenAPI 3.1 automático, soporte async nativo.

### ORM

**Decisión:** SQLModel (SQLAlchemy + Pydantic v2 en un único modelo)

Elimina la duplicación de definir una entidad SQLAlchemy y un schema Pydantic por separado. El modelo SQLModel sirve como entidad de dominio, modelo de BD y schema de validación.

### Frontend

**Decisión:** Next.js 16 + React 19 + TypeScript 5 + Tailwind CSS 4

App Router con React Server Components para SEO y performance. next-intl para i18n (ES/EN/ZH). Path alias `@/*` → `src/*`.

### Contenedores

**Decisión:** Docker + Docker Compose para desarrollo local; Azure Container Apps para producción

---

## ADR-01-05: Estrategia de Persistencia — PostgreSQL + pgvector + ChromaDB

**Decisión:** Persistencia híbrida con dos motores vectoriales con roles distintos.

| Motor | Rol | Justificación |
|---|---|---|
| PostgreSQL 16 | Almacenamiento transaccional (usuarios, perfiles, ledger, matches, KPIs) | ACID garantizado; relaciones entre entidades |
| pgvector (extensión PostgreSQL) | Embeddings para búsqueda semántica en PadronRUC y oportunidades estructuradas | Mismo motor que el relacional; no añade servicio adicional |
| ChromaDB | Base de conocimiento normativo del Agente Legal RAG | API simplificada; HNSW nativo; metadatos flexibles para filtrar por fecha_vigencia |

**Nota:** La decisión original en SDD v1.0 era usar solo pgvector. Se migró ChromaDB para el RAG legal por su API más rápida de prototipar y su mejor soporte de metadatos complejos por chunk. Esta decisión está registrada en ADR-02-03.

---

## ADR-01-06: Estrategia de Datos SUNARP — Sin API Pública

**Decisión:** Combinación de datos históricos bulk (2019-2024) + scraping actualizado + PadronRUC SUNAT.

**Contexto:** SUNARP no expone una API pública REST accesible para consultas masivas de empresas.

**Pipeline adoptado:**

```
Fuente 1: SUNARP-API (scraper comunitario)
  └─ Datos históricos 2019-2024 de empresas, directorio, cargas registrales
  └─ Limitación: datos incompletos post-2024

Fuente 2: Gestión 2025 / web scraping directo (Scrapling + Playwright)
  └─ Datos actualizados pero parciales, algunos en PDF (requieren extracción)
  └─ Scrapling + curl_cffi para evadir detección de bots

Fuente 3: PadronRUC SUNAT (bulk TXT mensual, descarga pública)
  └─ Complemento tributario: RUC, estado contribuyente, CIIU, ubigeo
  └─ ~10M registros, ingesta ETL mensual (spec07)

Fuente 4: Consulta puntual en tiempo real (para validación en matchmaking)
  └─ Scrapling contra portal SUNARP por RUC individual
  └─ Solo para Top 5 candidatos en el proceso de matching (spec04)
```

**Enriquecimiento:**
```
trust_score = (0.4 × validez_sunarp) + (0.3 × antiguedad_norm) + (0.3 × sin_cargas)
```

**Tablas resultantes en PostgreSQL:**
- `companies` — entidad principal enriquecida (SUNARP + PadronRUC + trust_score)
- `padron_ruc_staging` — staging de la descarga bulk mensual SUNAT

---

## ADR-01-07: Estrategia de Integración con Agente de IA — Custom Tool Pattern

**Decisión:** El Agente Matchmaker accede al directorio de empresas/profesionales mediante el patrón "Custom Tool" (Function Calling), no mediante contexto en el prompt.

**Razones:**
1. El padrón de empresas tiene ~10M de registros; no puede caber en el contexto del LLM
2. Function Calling permite al LLM decidir CUÁNDO buscar y con QUÉ filtros, en lugar de recibir un dump de datos
3. La salida del tool es JSON estructurado, auditable y registrable en el Ledger

**Herramientas expuestas al Agente Matchmaker:**
- `search_cip_engineers(especialidad, region, idioma)` → List[CandidatoMatch]
- `search_cal_lawyers(especializacion, idioma, certificacion_zeep)` → List[CandidatoMatch]
- `search_local_providers(sector_ciiu, distancia_max_km, trust_score_min)` → List[CandidatoMatch]
- `get_company_detail(ruc)` → CompanyDetail

---

## ADR-01-08: Patrones de Diseño Fundacionales

| Patrón | Módulo(s) | Decisión |
|---|---|---|
| **Clean Architecture** | Todos | El dominio no importa nada de framework. Infrastructure adapta al dominio |
| **Event-Driven (interno)** | Onboarding → Matchmaking → Ledger | Eventos de dominio desacoplan los módulos |
| **Strategy** | Simulation, Legal AI | `SectorScoringStrategy`, `LLMProvider`: intercambiables sin tocar casos de uso |
| **Repository** | Todos | `{Entidad}Repository` abstrae la consulta SQL; solo la infrastructure lo implementa |
| **Unit of Work** | Ledger, Onboarding | Transacciones atómicas que afectan múltiples tablas |
| **Custom Tool (Function Calling)** | AI Agent, Matchmaking | LLM llama herramientas tipadas en lugar de procesar contexto en bruto |

---

## ADR-01-09: Internacionalización — ES / EN / ZH

**Decisión:** Soporte trilingüe completo en frontend (next-intl) y en el Agente Legal RAG.

**Razones:** Los inversores chinos son la audiencia primaria inicial (joint venture COSCO en el puerto Chancay). Los inversores angloparlantes (Europa, EEUU, resto de Asia) requieren inglés. El español es el idioma de la normativa peruana.

**Implementación:**
- Frontend: `app/[locale]/` con rutas dinámicas; locale por defecto = `es`
- Agente Legal: opera internamente en ES (base normativa es española); responde en el idioma de la consulta (ver ADR-02-10)

---

## ADR-01-10: Despliegue de PostgreSQL — Supabase

**Decisión:** PostgreSQL será alojado en **Supabase** (PaaS) en lugar de un servidor auto-gestionado (VPS, Azure VM, o contenedor propio).

**Alternativas consideradas:**
- Self-hosted PostgreSQL en Docker Compose (descartado)
- Azure Database for PostgreSQL Flexible Server (descartado)
- Supabase (elegido)
- Neon (serverless PostgreSQL) (descartado)

**Razones:**
1. **Velocidad de deploy:** Supabase provee una instancia PostgreSQL 16 lista en menos de 2 minutos, sin configuración de red, backups ni SSL manual
2. **Dashboard integrado:** interfaz web para explorar tablas, ejecutar SQL y visualizar datos sin herramientas adicionales (útil en MVP y hackathon)
3. **Auth compatible:** Supabase Auth puede coexistir o ignorarse; el sistema usa su propio JWT (python-jose), pero la integración futura es posible sin migración
4. **pgvector nativo:** Supabase soporta la extensión `pgvector` de forma nativa; habilitar con `CREATE EXTENSION vector`
5. **Row Level Security (RLS):** PostgreSQL RLS ya definido en el sistema (spec05 Ledger, spec03 InvestorProfiles) funciona idéntico en Supabase
6. **Connection pooling:** Supabase Pooler (PgBouncer mode) evita agotamiento de conexiones en FastAPI con múltiples workers
7. **Costo inicial:** Free tier (500MB, sin límite de API calls desde el backend propio) suficiente para MVP

**Consecuencias:**
- La cadena de conexión usa `DATABASE_URL = postgresql+psycopg2://...supabase.co:5432/postgres`
- Las migraciones se gestionan con **Alembic** (no con la UI de Supabase) para mantener el historial versionado en git
- No se usa el cliente JavaScript de Supabase en el frontend; el acceso a datos va siempre por la API FastAPI (Capa 2 del sistema)
- En Fase 3 (multi-zona), evaluar migración a Azure Database for PostgreSQL si el volumen supera el plan gratuito de Supabase

---

## Relación con ADR-02

ADR-02 contiene las decisiones de diseño específicas para los módulos implementados a partir de spec02–spec07:
- Fórmulas de scoring y calibración de pesos (ADR-02-01, ADR-02-02)
- ChromaDB vs pgvector para RAG (ADR-02-03)
- Patrón Supervisor-Worker y aislamiento de agentes (ADR-02-04)
- Selección de proveedor LLM (ADR-02-05)
- Estrategia de chunking normativo (ADR-02-06)
- Inmutabilidad del Ledger (ADR-02-07)
- Ingesta PadronRUC bulk vs API (ADR-02-08)
- Predicción de demanda CIP en cold-start (ADR-02-09)
