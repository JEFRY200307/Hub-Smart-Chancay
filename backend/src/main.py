from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os
from pathlib import Path

from src.shared.infrastructure.error_handlers import setup_exception_handlers
from src.shared.infrastructure.database import check_database_connection
from src.shared.infrastructure.chroma_client import check_chroma_connection

# Registrar todos los modelos en SQLModel.metadata (necesario para Alembic autogenerate)
import src.modules.identity.domain.entities           # noqa: F401
import src.modules.identity.domain.user_profile       # noqa: F401
import src.modules.zeep_ingestion.domain.entities     # noqa: F401
import src.modules.onboarding.domain.entities         # noqa: F401
import src.modules.marketplace.domain.entities        # noqa: F401
import src.modules.ai_agent.domain.entities           # noqa: F401
import src.modules.zeep_simulation.domain.entities    # noqa: F401
import src.modules.ledger.domain.entities             # noqa: F401
import src.modules.analytics_padron_ruc.domain.entities  # noqa: F401
import src.modules.projects.domain.entities             # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Las tablas se crean/modifican via Alembic (no SQLModel.metadata.create_all)
    try:
        from src.modules.zeep_ingestion.infrastructure.cron_scheduler import start_scheduler
        start_scheduler()
    except ImportError:
        pass  # scrapling/playwright opcional en dev local
    yield


app = FastAPI(
    title="Sovereign Gateway API — COMEX.AI",
    description="Backend del Hub Smart Chancay ZEEP (Monolito Modular, Arquitectura Hexagonal)",
    version="1.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

setup_exception_handlers(app)

uploads_path = Path(os.getenv("STORAGE_LOCAL_PATH", "./uploads"))
uploads_path.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_path)), name="uploads")


@app.get("/health", tags=["Sistema"])
def health_check():
    db = check_database_connection()
    chroma = check_chroma_connection()
    ok = db.get("connected") and chroma.get("connected")
    return {
        "status": "ok" if ok else "degraded",
        "system": "Sovereign Gateway",
        "version": "1.1.0",
        "database": db,
        "chroma": chroma,
    }


# ── Routers (API v1 — contratos spec01–spec08) ───────────────────────────────
from src.modules.identity.infrastructure.router import router as identity_router
from src.modules.zeep_ingestion.infrastructure.ingestion_router import router as ingestion_router
from src.modules.onboarding.infrastructure.router import router as onboarding_router
from src.modules.marketplace.infrastructure.router import router as marketplace_router
from src.modules.ai_agent.infrastructure.router import router as ai_router
from src.modules.zeep_simulation.infrastructure.router import router as simulation_router
from src.modules.ledger.infrastructure.router import router as ledger_router
from src.modules.analytics_padron_ruc.infrastructure.router import router as analytics_router
from src.modules.projects.infrastructure.router import router as projects_router
from src.modules.dashboard.infrastructure.router import router as dashboard_router

app.include_router(identity_router)
app.include_router(simulation_router)
app.include_router(onboarding_router)
app.include_router(marketplace_router)
app.include_router(ai_router)
app.include_router(ledger_router)
app.include_router(analytics_router)
app.include_router(projects_router)
app.include_router(dashboard_router)
app.include_router(ingestion_router)

# Router legacy /zeep/* (scraping pipeline) — requiere scrapling/playwright
try:
    from src.modules.zeep_ingestion.infrastructure.routers import router as zeep_legacy_router
    app.include_router(zeep_legacy_router)
except ImportError:
    pass
