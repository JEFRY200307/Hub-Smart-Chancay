from sqlmodel import Session, select
from ..domain.entities import LegalAnalysis, Expert, Notification

class AIAgentService:
    def __init__(self, session: Session):
        self.session = session
        
    def process_document(self, filename: str) -> LegalAnalysis:
        # Mock de procesamiento RAG de documentos legales
        # En una versión real, esto usaría LangChain/LlamaIndex + Groq/Gemini
        
        findings = {
            "risks": [
                {"title": "Indemnity Clause Cap", "detail": "Section 4.2 lacks a definitive liability cap.", "level": "Critical"},
                {"title": "Jurisdiction Ambiguity", "detail": "Dispute resolution mentions both Lima and Singapore.", "level": "High"}
            ],
            "opportunities": [
                {"title": "Special Economic Zone Benefits", "detail": "Structure equipment importation under Clause 2.1."},
                {"title": "Early Payment Discounts", "detail": "Leverage Schedule B for 2% reduction."}
            ],
            "suggestions": [
                {
                    "original": "The Contractor shall be responsible for delays caused by weather...",
                    "suggested": "The Contractor shall be liable... except in instances formally declared as Force Majeure."
                }
            ]
        }
        
        analysis = LegalAnalysis(
            document_name=filename,
            overall_score=75,
            findings=findings
        )
        
        self.session.add(analysis)
        self.session.commit()
        self.session.refresh(analysis)
        return analysis

    def get_experts(self) -> list[Expert]:
        statement = select(Expert)
        experts = self.session.exec(statement).all()
        # Seed si no hay
        if not experts:
            return [
                Expert(id=uuid.uuid4(), name="Dr. Carlos Mendoza", specialty="Perito Estructural", availability="Mañana, 10:00 AM"),
                Expert(id=uuid.uuid4(), name="Lic. Elena Vargas", specialty="Asesor Legal Core", availability="Jueves, 14:30 PM")
            ]
        return experts
