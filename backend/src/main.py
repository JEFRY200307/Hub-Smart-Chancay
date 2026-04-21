from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from src.shared.infrastructure.error_handlers import setup_exception_handlers
from src.shared.infrastructure.database import engine
from sqlmodel import SQLModel

# Importar entidades para que SQLModel las registre y cree las tablas
from src.modules.zeep_ingestion.domain.entities import SourceURL, ExtractedDocument, StructuredOpportunity, Company
from src.modules.zeep_ingestion.infrastructure.cron_scheduler import start_scheduler

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Creación automática de la base de datos (tablas)
    SQLModel.metadata.create_all(engine)
    # Inicialización del programador de tareas
    start_scheduler()
    yield
    # Shutdown
    pass

app = FastAPI(
    title="Sovereign Gateway API",
    description="Backend for the Smart Hub Chancay ZEEP (Monolito Modular)",
    version="1.0.0",
    lifespan=lifespan
)

# Configuración CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Para desarrollo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Manejadores de Errores RFC 7807
setup_exception_handlers(app)

@app.get("/health")
def health_check():
    return {"status": "ok", "system": "Sovereign Gateway"}

from src.modules.identity.infrastructure.router import router as identity_router
from src.modules.marketplace.infrastructure.router import router as marketplace_router
from src.modules.ai_agent.infrastructure.router import router as ai_router
from src.modules.zeep_ingestion.infrastructure.routers import router as zeep_router
from src.modules.onboarding.infrastructure.router import router as onboarding_router

app.include_router(identity_router)
app.include_router(marketplace_router)
app.include_router(ai_router)
app.include_router(zeep_router)
app.include_router(onboarding_router)
