from typing import List, Optional
import uuid
from sqlmodel import Session, select
from datetime import datetime

from ..domain.entities import SourceURL, ExtractedDocument, StructuredOpportunity

class ZeepIngestionRepository:
    def __init__(self, session: Session):
        self.session = session
        
    def get_active_source_urls(self) -> List[SourceURL]:
        statement = select(SourceURL).where(SourceURL.activa == True)
        return self.session.exec(statement).all()
        
    def create_source_url(self, source_url: SourceURL) -> SourceURL:
        self.session.add(source_url)
        self.session.commit()
        self.session.refresh(source_url)
        return source_url
        
    def update_source_url_ingestion_time(self, source_url_id: uuid.UUID) -> None:
        source_url = self.session.get(SourceURL, source_url_id)
        if source_url:
            source_url.ultima_ingesta = datetime.utcnow()
            self.session.add(source_url)
            self.session.commit()
            
    def save_extracted_document(self, document: ExtractedDocument) -> ExtractedDocument:
        self.session.add(document)
        self.session.commit()
        self.session.refresh(document)
        return document
        
    def get_pending_documents(self) -> List[ExtractedDocument]:
        statement = select(ExtractedDocument).where(ExtractedDocument.estado_procesamiento == "PENDIENTE")
        return self.session.exec(statement).all()
        
    def save_structured_opportunity(self, opportunity: StructuredOpportunity, document_id: uuid.UUID) -> StructuredOpportunity:
        # Mark document as structured
        document = self.session.get(ExtractedDocument, document_id)
        if document:
            document.estado_procesamiento = "ESTRUCTURADO"
            self.session.add(document)
            
        self.session.add(opportunity)
        self.session.commit()
        self.session.refresh(opportunity)
        return opportunity
        
    def get_all_opportunities(self) -> List[StructuredOpportunity]:
        statement = select(StructuredOpportunity).order_by(StructuredOpportunity.created_at.desc())
        return self.session.exec(statement).all()
