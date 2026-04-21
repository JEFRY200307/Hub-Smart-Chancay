from fastapi import APIRouter, Depends, UploadFile, File
from sqlmodel import Session, select
from typing import List
from src.shared.infrastructure.database import get_session
from src.modules.identity.infrastructure.auth_dependency import get_current_user
from src.modules.identity.domain.entities import User
from ..application.dtos import ChatRequestDTO, ChatResponseDTO, AnalysisResponseDTO, ExpertDTO, NotificationDTO
from ..application.service import AIAgentService
from ..domain.entities import LegalAnalysis, Notification

router = APIRouter(prefix="/api/v1/ai", tags=["Legal AI"])

@router.post("/chat", response_model=ChatResponseDTO)
async def chat_with_legal_ai(
    payload: ChatRequestDTO,
    current_user: User = Depends(get_current_user)
):
    # Esto sigue como mock de chat rápido
    return ChatResponseDTO(
        response="Basado en el Decreto Supremo N° 015-2023-MTC, la zona residencial debe tener un buffer de 1.2km.",
        sources=["Decreto Supremo N° 015-2023-MTC"]
    )

@router.post("/validate-document", response_model=AnalysisResponseDTO)
async def validate_legal_document(
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Sube un contrato y realiza un análisis RAG de riesgos y beneficios."""
    service = AIAgentService(session)
    return service.process_document(file.filename)

@router.get("/analysis-history", response_model=List[AnalysisResponseDTO])
async def get_analysis_history(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    statement = select(LegalAnalysis).order_by(LegalAnalysis.created_at.desc())
    return session.exec(statement).all()

@router.get("/concierge/experts", response_model=List[ExpertDTO])
async def list_concierge_experts(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    service = AIAgentService(session)
    return service.get_experts()

@router.get("/concierge/notifications", response_model=List[NotificationDTO])
async def list_concierge_notifications(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    statement = select(Notification).order_by(Notification.created_at.desc())
    notifications = session.exec(statement).all()
    
    # Mock data si está vacío
    if not notifications:
        return [
            {
                "id": "not-1", 
                "title": "Firma expirando", 
                "content": "Su certificación de Tier 1 vence en 15 días.",
                "type": "WARNING",
                "created_at": "Hace 2h"
            }
        ]
    return notifications
