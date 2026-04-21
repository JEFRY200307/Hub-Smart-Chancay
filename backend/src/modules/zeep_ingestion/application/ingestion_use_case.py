from datetime import datetime
from ..domain.entities import ExtractedDocument
from ..infrastructure.repositories import ZeepIngestionRepository
from ..infrastructure.scrapling_adapter import ScraplingAdapter

class IngestionUseCase:
    def __init__(self, repository: ZeepIngestionRepository, scraper: ScraplingAdapter):
        self.repository = repository
        self.scraper = scraper
        
    def execute_daily_ingestion(self):
        """Busca todas las sources activas y extrae el contenido"""
        sources = self.repository.get_active_source_urls()
        
        for source in sources:
            try:
                # 1. Scrapear la URL fuente base (o usar búsqueda si está configurado para Deep Search)
                raw_content = self.scraper.extract_text_from_url(source.url)
                
                # 2. Guardar el documento extraído
                doc = ExtractedDocument(
                    source_url_id=source.id,
                    url_especifica=source.url,
                    contenido_texto_crudo=raw_content,
                    estado_procesamiento="PENDIENTE"
                )
                self.repository.save_extracted_document(doc)
                
                # 3. Actualizar el timestamp
                self.repository.update_source_url_ingestion_time(source.id)
                print(f"Ingesta completada para: {source.url}")
            except Exception as e:
                print(f"Error ingestando {source.url}: {str(e)}")
                # Podríamos guardar en log o DB
