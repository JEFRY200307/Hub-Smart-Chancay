from apscheduler.schedulers.background import BackgroundScheduler
from sqlmodel import Session

from ..application.ingestion_use_case import IngestionUseCase
from ..application.structuring_use_case import StructuringUseCase
from ..application.company_ingestion_use_case import CompanyIngestionUseCase
from ..application.company_enrichment_use_case import CompanyEnrichmentUseCase
from ..infrastructure.repositories import ZeepIngestionRepository
from ..infrastructure.scrapling_adapter import ScraplingAdapter
from ..infrastructure.ai_adapters import GroqStructuringAdapter

def run_pipeline():
    print("Iniciando Ingesta y Estructuración ZEEP a las 12:00...")
    from src.shared.infrastructure.database import engine
    with Session(engine) as session:
        repo = ZeepIngestionRepository(session)
        scrapling_adapter = ScraplingAdapter()
        groq_adapter = GroqStructuringAdapter()
        
        ingestion = IngestionUseCase(repo, scrapling_adapter)
        ingestion.execute_daily_ingestion()
        
        structurer = StructuringUseCase(repo, groq_adapter)
        structurer.execute_pending_structuring()
    
    print("Pipeline Proactivo ZEEP completado.")

def run_sunat_pipeline():
    print("Iniciando Scrapeo SUNAT Mensual (Padrones y Enriquecimiento)...")
    try:
        # Ingesta
        ingestor = CompanyIngestionUseCase()
        ingestor.execute()
        
        # Enriquecimiento (procesamos un lote grande o todos los insertados)
        enricher = CompanyEnrichmentUseCase()
        # Intentamos procesar 100 empresas en este ciclo largo.
        enricher.execute(limit=100) 
        
        print("Pipeline SUNAT completado con éxito.")
    except Exception as e:
        print(f"Error en Pipeline SUNAT: {e}")

def start_scheduler():
    scheduler = BackgroundScheduler()
    
    # Ejecutar todos los días a las 12:00 AM (Medianoche)
    scheduler.add_job(run_pipeline, 'cron', hour=0, minute=0)
    
    # Ejecutar el último día del mes a las 11:59 p.m.
    scheduler.add_job(run_sunat_pipeline, 'cron', day='last', hour=23, minute=59)
    
    scheduler.start()
    print("Scheduler ZEEP Proactivo y SUNAT iniciado...")
