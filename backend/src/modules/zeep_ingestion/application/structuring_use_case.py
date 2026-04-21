from datetime import datetime
from ..domain.entities import StructuredOpportunity
from ..infrastructure.repositories import ZeepIngestionRepository
from ..infrastructure.ai_adapters import GroqStructuringAdapter

class StructuringUseCase:
    def __init__(self, repository: ZeepIngestionRepository, ai_adapter: GroqStructuringAdapter):
        self.repository = repository
        self.ai_adapter = ai_adapter
        
    def execute_pending_structuring(self):
        """Busca documentos extraídos sin estructurar y los procesa por IA"""
        pending_docs = self.repository.get_pending_documents()
        
        for doc in pending_docs:
            source = doc.source_url
            if not source:
                continue
                
            custom_prompt = source.sistema_prompt
            raw_text = doc.contenido_texto_crudo
            
            # Evitar enviar textos vacíos o excesivamente cortos 
            if not raw_text or len(raw_text.strip()) < 50:
                print(f"Skipping empty or very short document {doc.id}")
                doc.estado_procesamiento = "ERROR"
                self.repository.session.commit()
                continue
            
            try:
                # 1. Llamar a Groq con el prompt específico
                structured_data = self.ai_adapter.extract_structured_json(raw_text, custom_prompt)
                
                fecha_format = None
                if structured_data.fecha:
                    try:
                        fecha_format = datetime.strptime(structured_data.fecha, "%Y-%m-%d").date()
                    except ValueError:
                        pass
                
                # 2. Mapear a la Entidad BD
                opportunity = StructuredOpportunity(
                    extracted_document_id=doc.id,
                    titulo=structured_data.titulo,
                    valor_destacado=structured_data.valor_destacado,
                    descripcion=structured_data.descripcion,
                    tipo_oportunidad=structured_data.tipo.value,
                    fuente_url=doc.url_especifica, # TODO: Combinar con la fuente canónica de Groq si se genera
                    fecha_publicacion_origen=fecha_format
                )
                
                # 3. Guardar en BD
                self.repository.save_structured_opportunity(opportunity, doc.id)
                print(f"Estructuración completada: {structured_data.titulo}")
                
            except Exception as e:
                print(f"Error estructurando DOC {doc.id}: {str(e)}")
                doc.estado_procesamiento = "ERROR"
                self.repository.session.add(doc)
                self.repository.session.commit()
