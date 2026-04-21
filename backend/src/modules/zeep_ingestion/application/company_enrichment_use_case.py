import time
from sqlmodel import Session, select
from src.shared.infrastructure.database import engine
from src.modules.zeep_ingestion.domain.entities import Company
from src.modules.zeep_ingestion.infrastructure.tavily_adapter import TavilyAdapter
from src.modules.zeep_ingestion.infrastructure.scrapling_adapter import ScraplingAdapter
from src.modules.zeep_ingestion.infrastructure.ai_adapters import GroqStructuringAdapter

class CompanyEnrichmentUseCase:
    """Enriquece datos de Empresas scrapeadas con URLs, Contacto y Señales de Confianza."""
    
    def __init__(self):
        self.tavily = TavilyAdapter()
        self.scraper = ScraplingAdapter()
        self.llm = GroqStructuringAdapter()
        
    def execute(self, limit: int = 10):
        """Busca empresas sin dominio web y ejecuta el orquestador de IA de Enriquecimiento"""
        
        with Session(engine) as session:
            # Traemos un lote pequeño para no saturar RATE LIMITS de Tavily / Groq
            companies_to_enrich = session.exec(
                select(Company)
                .where(Company.dominio_web == None)
                .limit(limit)
            ).all()
            
            print(f"Enriqueciendo lote de {len(companies_to_enrich)} empresas...")
            
            for company in companies_to_enrich:
                print(f"[{company.ruc}] Procesando: {company.razon_social}")
                
                # 1. Tavily: Buscar URL Oficial
                url = self.tavily.find_official_website(company.razon_social, company.sector_macro or "")
                
                if not url:
                    # Marcamos con un 'NOT_FOUND' para no volver a buscarla inminentemente
                    company.dominio_web = "NOT_FOUND" 
                    session.add(company)
                    session.commit()
                    continue
                    
                # 2. Scrapling: Extraer contenido de la URL encontrada
                print(f"[{company.ruc}] URL Encontrada: {url} -> Extrayendo contenido...")
                try:
                    raw_content = self.scraper.extract_text_from_url(url)
                    # Limitamos texto para no explotar tokens de Groq
                    raw_content = raw_content[:15000] 
                except Exception as e:
                    print(f"Error scrapeando {url}: {e}")
                    company.dominio_web = url 
                    session.add(company)
                    session.commit()
                    continue
                
                # 3. LLM (Groq): Estructurar Capas de ZEEP Legal AI
                print(f"[{company.ruc}] LLM Procesando {len(raw_content)} caracteres...")
                schema = self.llm.extract_company_metrics(raw_content)
                
                # 4. Actualizar Base de Datos con capas 1, 2, 3
                company.dominio_web = schema.dominio_web or url
                company.correo_contacto = schema.correo_contacto
                company.linkedin = schema.linkedin
                company.capacidad_operativa = schema.capacidad_operativa
                company.trust_signals = schema.trust_signals
                
                session.add(company)
                session.commit()
                
                # Respetar rate limits
                time.sleep(2)
            
            print("Lote de enriquecimiento completado.")
