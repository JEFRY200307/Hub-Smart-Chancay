from __future__ import annotations
from typing import List, Optional
import uuid
from datetime import datetime
from sqlmodel import Session, select

from ..domain.entities import SourceURL, ExtractedDocument, StructuredOpportunity


class ZeepIngestionRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_active_source_urls(self) -> List[SourceURL]:
        return self.session.exec(
            select(SourceURL).where(SourceURL.activo.is_(True))
        ).all()

    def create_source_url(self, source_url: SourceURL) -> SourceURL:
        self.session.add(source_url)
        self.session.commit()
        self.session.refresh(source_url)
        return source_url

    def update_source_url_scraped_at(self, source_url_id: uuid.UUID) -> None:
        source_url = self.session.get(SourceURL, source_url_id)
        if source_url:
            source_url.last_scraped_at = datetime.utcnow()
            self.session.add(source_url)
            self.session.commit()

    def save_extracted_document(self, document: ExtractedDocument) -> ExtractedDocument:
        self.session.add(document)
        self.session.commit()
        self.session.refresh(document)
        return document

    def get_pending_documents(self) -> List[ExtractedDocument]:
        return self.session.exec(
            select(ExtractedDocument).where(ExtractedDocument.estado == "pendiente")
        ).all()

    def mark_document_structured(self, document_id: uuid.UUID) -> None:
        doc = self.session.get(ExtractedDocument, document_id)
        if doc:
            doc.estado = "estructurado"
            self.session.add(doc)
            self.session.commit()

    def save_structured_opportunity(
        self, opportunity: StructuredOpportunity, document_id: uuid.UUID
    ) -> StructuredOpportunity:
        self.mark_document_structured(document_id)
        self.session.add(opportunity)
        self.session.commit()
        self.session.refresh(opportunity)
        return opportunity

    def get_all_opportunities(self) -> List[StructuredOpportunity]:
        return self.session.exec(
            select(StructuredOpportunity).order_by(StructuredOpportunity.created_at.desc())
        ).all()
