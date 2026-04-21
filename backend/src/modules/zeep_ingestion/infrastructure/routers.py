from fastapi import APIRouter, Depends, BackgroundTasks
from sqlmodel import Session
import uuid
from src.shared.infrastructure.database import get_session

from ..application.ingestion_use_case import IngestionUseCase
from ..application.structuring_use_case import StructuringUseCase
from ..infrastructure.repositories import ZeepIngestionRepository
from ..infrastructure.scrapling_adapter import ScraplingAdapter
from ..infrastructure.ai_adapters import GroqStructuringAdapter
from ..domain.entities import SourceURL

router = APIRouter(prefix="/zeep", tags=["ZEEP Proactive Agent"])

@router.post("/sources")
def register_source_url(
    url: str,
    nombre: str,
    sistema_prompt: str,
    session: Session = Depends(get_session)
):
    """Registrar un nuevo SourceURL (fuente de verdad)"""
    repo = ZeepIngestionRepository(session)
    source = SourceURL(url=url, nombre=nombre, sistema_prompt=sistema_prompt)
    return repo.create_source_url(source)

@router.get("/sources")
def list_sources(session: Session = Depends(get_session)):
    repo = ZeepIngestionRepository(session)
    return repo.get_active_source_urls()

@router.post("/trigger-ingestion")
def trigger_manual_ingestion(
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session) # Ojo: en bg tasks puede fallar la session, simplificado para demostración
):
    """Fuerza la ejecución manual de inegesta y estructuración del pipeline."""
    
    def run_full_pipeline():
        # TODO: En un Worker de Background_tasks, inyectar el DB Engine directo en lugar del Session dependiente.
        repo = ZeepIngestionRepository(session)
        scraper = ScraplingAdapter()
        groq_ai = GroqStructuringAdapter()
        
        # 1. Ingesta
        ingestor = IngestionUseCase(repo, scraper)
        ingestor.execute_daily_ingestion()
        
        # 2. IA Structuring
        structurer = StructuringUseCase(repo, groq_ai)
        structurer.execute_pending_structuring()
    
    background_tasks.add_task(run_full_pipeline)
    return {"message": "Ingestión y Estructuración lanzada en Background"}

@router.get("/opportunities")
def get_opportunities(session: Session = Depends(get_session)):
    """Endpoint para el DASHBOARD Frontend"""
    repo = ZeepIngestionRepository(session)
    return repo.get_all_opportunities()

@router.get("/opportunities/{opportunity_id}")
def get_opportunity_by_id(opportunity_id: str, session: Session = Depends(get_session)):
    """Endpoint / Tool para IA Legal Canvas (RAG Tool)"""
    # Exponemos esto para llamar dinámicamente desde el chat del Tool
    repo = ZeepIngestionRepository(session)
    # Por temas de brevedad, podemos usar sqlmodel
    from sqlmodel import select
    from ..domain.entities import StructuredOpportunity
    stat = select(StructuredOpportunity).where(StructuredOpportunity.id == opportunity_id)
    return session.exec(stat).first()

@router.post("/trigger-sunat")
def trigger_sunat_pipeline(background_tasks: BackgroundTasks):
    """Fuerza la descarga, filtrado por Pandas y enriquecimiento de empresas SUNAT (Ejecuta en Background)."""
    from ..application.company_ingestion_use_case import CompanyIngestionUseCase
    from ..application.company_enrichment_use_case import CompanyEnrichmentUseCase
    
    def run_full_sunat_pipeline():
        try:
            print("Iniciando Ingestión SUNAT Manual...")
            ingestor = CompanyIngestionUseCase()
            ingestor.execute()
            
            print("Iniciando Enriquecimiento SUNAT Manual...")
            enricher = CompanyEnrichmentUseCase()
            enricher.execute(limit=10)
            print("Pipeline SUNAT Manual Completado.")
        except Exception as e:
            print(f"Error en Pipeline SUNAT Manual: {e}")

    background_tasks.add_task(run_full_sunat_pipeline)
    return {"message": "Scrapeo SUNAT lanzado en Background. Puede demorar varios minutos por el gran tamaño de los archivos."}

@router.get("/companies")
def get_companies(session: Session = Depends(get_session), limit: int = 50):
    """Obtiene el listado de empresas enriquecidas. Útil para la IA Legal."""
    from sqlmodel import select
    from ..domain.entities import Company
    
    stat = select(Company).limit(limit)
    return session.exec(stat).all()
