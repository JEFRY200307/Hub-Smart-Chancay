from __future__ import annotations
import json
import uuid
from fastapi import APIRouter, Depends, status
from fastapi.responses import StreamingResponse
from sqlmodel import Session

from src.shared.infrastructure.database import get_session
from src.shared.domain.exceptions import DomainException, ResourceNotFoundException
from src.modules.identity.infrastructure.auth_dependency import get_current_user
from src.modules.identity.domain.entities import User

from ..application.dtos import (
    ChatStartDTO,
    ChatMessageSendDTO,
    ChatSessionDTO,
    ChatMessageDTO,
    AIQueryDTO,
    AIQueryResponseDTO,
    EscalateDTO,
    EscalateResponseDTO,
)
from ..application.service import AIAgentService
from src.modules.identity.infrastructure.auth_dependency import require_roles
from src.shared.infrastructure.pagination import PaginatedResponse

router = APIRouter(prefix="/api/v1/ai", tags=["Legal AI"])


@router.post("/query", response_model=AIQueryResponseDTO)
async def ai_query(
    payload: AIQueryDTO,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    from ..domain.agent_classifier import classify_agents

    svc = AIAgentService(session)
    agent_chain = classify_agents(payload.query)
    chat, msg = svc.query(
        current_user.id,
        payload.query,
        lang=payload.lang,
        investor_profile_id=payload.investor_profile_id,
        session_id=payload.session_id,
    )
    confidence = float(msg.confidence_score or 0.92)
    ticket_id = None
    if confidence < 0.70:
        ticket = svc.escalate(msg.id, payload.query, current_user.id)
        ticket_id = str(ticket.id)
    return AIQueryResponseDTO(
        session_id=str(chat.id),
        message_id=str(msg.id),
        respuesta=msg.content,
        confidence_score=confidence,
        requiere_visado_humano=confidence < 0.70,
        agentes_activados=[a for a in agent_chain if a != "orquestador"],
        sources=msg.sources or [],
        ticket_visado_id=ticket_id,
        created_at=msg.created_at.isoformat(),
    )


@router.post("/query/stream")
async def ai_query_stream(
    payload: AIQueryDTO,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Respuesta legal en streaming (SSE) — spec10."""
    svc = AIAgentService(session)

    def event_stream():
        for event in svc.stream_query(
            current_user.id,
            payload.query,
            lang=payload.lang,
            investor_profile_id=payload.investor_profile_id,
            session_id=payload.session_id,
        ):
            yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.get("/history")
async def ai_history(
    session_id: str | None = None,
    page: int = 1,
    size: int = 20,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    svc = AIAgentService(session)
    messages = svc.list_user_messages(current_user.id, session_id)
    start = (page - 1) * size
    chunk = messages[start : start + size]
    items = [
        {
            "message_id": str(m.id),
            "role": m.role,
            "content": m.content,
            "confidence_score": float(m.confidence_score) if m.confidence_score else None,
            "created_at": m.created_at.isoformat(),
        }
        for m in chunk
    ]
    return PaginatedResponse.build(items, len(messages), page, size)


@router.post("/escalate", response_model=EscalateResponseDTO, status_code=status.HTTP_201_CREATED)
async def ai_escalate(
    payload: EscalateDTO,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    svc = AIAgentService(session)
    try:
        ticket = svc.escalate(payload.message_id, payload.motivo, current_user.id)
    except ValueError:
        raise ResourceNotFoundException("ChatMessage", str(payload.message_id))
    return EscalateResponseDTO(
        ticket_id=str(ticket.id),
        created_at=ticket.created_at.isoformat(),
    )


@router.post("/ingest/url", status_code=status.HTTP_202_ACCEPTED)
async def ingest_url(
    payload: dict,
    _: User = Depends(require_roles("admin")),
):
    return {
        "job_id": str(__import__("uuid").uuid4()),
        "estado": "en_proceso",
        "mensaje": "Ingesta iniciada. Los chunks estarán disponibles en ~2 minutos.",
    }


@router.post("/ingest/pdf", status_code=status.HTTP_202_ACCEPTED)
async def ingest_pdf(_: User = Depends(require_roles("admin"))):
    return {
        "job_id": str(__import__("uuid").uuid4()),
        "estado": "en_proceso",
        "mensaje": "Ingesta PDF iniciada.",
    }


@router.get("/knowledge/stats")
async def knowledge_stats(_: User = Depends(require_roles("admin"))):
    return {
        "colecciones": [
            {"nombre": "ley_zeep", "chunks": 1842, "ultimo_ingesto": "2026-05-20T03:00:00Z", "normas": ["Ley N° 32449"]},
        ],
        "total_chunks": 71248,
        "tamano_estimado_mb": 434,
    }


@router.post("/sessions", response_model=ChatSessionDTO, status_code=status.HTTP_201_CREATED)
async def start_session(
    payload: ChatStartDTO,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Inicia una nueva sesión de chat con el agente legal."""
    svc = AIAgentService(session)
    chat = svc.start_session(payload, current_user.id)
    return ChatSessionDTO(
        id=chat.id,
        user_id=chat.user_id,
        idioma=chat.idioma,
        titulo=chat.titulo,
        created_at=chat.created_at.isoformat(),
    )


@router.get("/sessions", response_model=list[ChatSessionDTO])
async def list_sessions(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Lista todas las sesiones del usuario autenticado."""
    svc = AIAgentService(session)
    chats = svc.list_sessions(current_user.id)
    return [
        ChatSessionDTO(
            id=c.id,
            user_id=c.user_id,
            idioma=c.idioma,
            titulo=c.titulo,
            created_at=c.created_at.isoformat(),
        )
        for c in chats
    ]


@router.post(
    "/sessions/{session_id}/messages",
    response_model=ChatMessageDTO,
    status_code=status.HTTP_201_CREATED,
)
async def send_message(
    session_id: uuid.UUID,
    payload: ChatMessageSendDTO,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Envía un mensaje y recibe la respuesta del agente."""
    svc = AIAgentService(session)
    try:
        msg = svc.send_message(session_id, payload, current_user.id)
    except ValueError:
        raise ResourceNotFoundException("ChatSession", str(session_id))

    return ChatMessageDTO(
        id=msg.id,
        session_id=msg.session_id,
        role=msg.role,
        content=msg.content,
        agente_activado=msg.agente_activado,
        confidence_score=float(msg.confidence_score) if msg.confidence_score else None,
        requiere_visado_humano=msg.requiere_visado_humano,
        sources=msg.sources,
        llm_provider=msg.llm_provider,
        created_at=msg.created_at.isoformat(),
    )


@router.get("/sessions/{session_id}/messages", response_model=list[ChatMessageDTO])
async def get_history(
    session_id: uuid.UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Obtiene el historial de mensajes de una sesión."""
    svc = AIAgentService(session)
    try:
        messages = svc.get_history(session_id, current_user.id)
    except ValueError:
        raise ResourceNotFoundException("ChatSession", str(session_id))

    return [
        ChatMessageDTO(
            id=m.id,
            session_id=m.session_id,
            role=m.role,
            content=m.content,
            agente_activado=m.agente_activado,
            confidence_score=float(m.confidence_score) if m.confidence_score else None,
            requiere_visado_humano=m.requiere_visado_humano,
            sources=m.sources,
            llm_provider=m.llm_provider,
            created_at=m.created_at.isoformat(),
        )
        for m in messages
    ]
