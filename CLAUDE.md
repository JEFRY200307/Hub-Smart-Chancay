# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Hub-Smart-Chancay / Sovereign Gateway** — An AI-powered B2B platform connecting foreign investors with local service providers, legal advisors, and infrastructure in Peru's Special Economic Zone of Chancay (ZEEP). The platform auto-validates companies via SUNARP, provides a RAG-based legal AI agent, and surfaces structured investment opportunities from government data sources.

## Development Commands

All services run via Docker Compose:

```bash
docker-compose up          # Start all services (db, api, web)
docker-compose up --build  # Rebuild images before starting
docker-compose down        # Stop all services
```

Services exposed:
- **Database:** Supabase (config in `backend/.env`) — no PostgreSQL in Docker
- FastAPI backend: `localhost:8000` (OpenAPI docs at `/docs`)
- Next.js frontend: `localhost:3000`

**Frontend only (outside Docker):**
```bash
cd frontend
npm run dev    # Dev server on port 3000
npm run build  # Production build
npm run lint   # ESLint
```

**Backend only (outside Docker):**
```bash
cd backend
uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
```

## Environment Setup

**Backend** (`backend/.env` — copy from `backend/.env.example`):
- `DATABASE_URL` — Supabase PostgreSQL (`backend/.env`)
- `GROQ_API_KEY` — Primary LLM for structured extraction
- `TAVILY_API_KEY` — Web search for regulatory content
- Additional optional keys for Google GenAI and Claude API

**Frontend** (`frontend/.env` — copy from `frontend/.env.example`):
- `NEXT_PUBLIC_API_URL` — Backend base URL (e.g., `http://localhost:8000/api/v1`)

## Architecture

### Monorepo Structure
```
Hub-Smart-Chancay/
├── backend/          # FastAPI Python 3.12 app (Hexagonal Architecture)
├── frontend/         # Next.js 16 / React 19 app (App Router)
├── docs/             # SDD, ADRs, API contracts, UI specs
└── docker-compose.yml
```

### Backend — Hexagonal / Modular Monolith

`backend/src/main.py` bootstraps the FastAPI app and mounts all module routers under `/api/v1`.

Each feature is a self-contained module under `backend/src/modules/`:

| Module | Purpose | Key endpoints |
|---|---|---|
| `identity/` | Auth (JWT + refresh tokens, OAuth2) | `/api/v1/auth` |
| `ai_agent/` | Legal AI using RAG (LLM via Groq/Gemini/Claude) | `/api/v1/ai` |
| `marketplace/` | Vendor directory, land listings, matchmaking | `/api/v1/marketplace` |
| `zeep_ingestion/` | Web scraping, SUNARP enrichment, opportunity extraction | `/api/v1/ingestion` |
| `onboarding/` | Foreign investor onboarding flow | `/api/v1/onboarding` |

Each module follows the same internal layering:
- `domain/` — entities, protocols (no framework imports)
- `application/` — use cases, DTOs, service classes
- `infrastructure/` — FastAPI routers, SQLModel repositories, external adapters

**Shared infrastructure** (`backend/src/shared/`):
- `infrastructure/database.py` — SQLModel engine & `get_session()` dependency
- `infrastructure/security.py` — JWT creation/verification, bcrypt hashing
- `infrastructure/error_handlers.py` — Global RFC 7807 error responses
- `domain/exceptions.py` — `DomainException` base class

**Design patterns in use:**
- **Strategy + Factory** for pluggable LLM providers (`domain/llm.py` defines `LLMProvider` / `EmbeddingProvider` protocols)
- **Repository pattern** for all data access
- **Decorator pattern** on LLM calls for observability/metrics
- **RFC 7807** standardized error bodies across all endpoints

### Frontend — Next.js App Router with i18n

All pages live under `frontend/src/app/[locale]/` supporting three locales: `es` (default), `en`, `zh`.

Route structure:
- `/[locale]/` — Landing page
- `/[locale]/login` — Auth
- `/[locale]/onboarding` — Investor onboarding
- `/[locale]/dashboard/` — Authenticated area
  - `legal-ai` — RAG legal assistant chat
  - `match` — Matchmaking results
  - `operators` — Local operator directory
  - `services` — Service marketplace

Translations managed by `next-intl`. Server config in `src/i18n/request.ts`; routing in `src/navigation.ts`. Path alias `@/*` maps to `src/*`.

### Database

PostgreSQL with `pgvector` extension. ORM: SQLModel (SQLAlchemy + Pydantic v2).

Core tables: `users`, `companies` (SUNARP data), `source_urls` (scraping targets), `extracted_documents` (raw scraped content), `structured_opportunities` (AI-enriched). Vector embeddings stored via pgvector for semantic search over legal documents.

### Data Ingestion Pipeline

1. **Schedule** — APScheduler (`cron_scheduler.py`) runs daily jobs
2. **Scrape** — Scrapling + Playwright + curl_cffi fetch government sites / El Peruano / MINCETUR
3. **Search** — Tavily for supplementary web search
4. **Enrich** — SUNAT/SUNARP scrapers validate and enrich company data
5. **Structure** — LLM (Groq primary) extracts structured opportunities from raw text
6. **Store** — PostgreSQL + pgvector for retrieval

## Key Docs

- `docs/SDD.md` — Comprehensive System Design Document (architecture, C4 model, user stories, API contracts, design decisions)
- `docs/adr/adr01.md` — Architecture Decision Records
- `docs/specs/spec01.md` — SUNARP driver spec
- `docs/views/` — UI mockup specs per view
- `docs/presentacion.md` — Product pitch and roadmap (project is ~35% complete MVP)

## API Conventions

- All endpoints versioned under `/api/v1/`
- Error responses follow **RFC 7807** (`type`, `title`, `status`, `detail` fields)
- Auth: Bearer JWT in `Authorization` header; protected routes use `Depends(get_current_user)` from `modules/identity/infrastructure/auth_dependency.py`
- OpenAPI docs auto-generated at `http://localhost:8000/docs`
