from __future__ import annotations
import os
import uuid
from datetime import datetime
from typing import Iterator
from sqlmodel import Session, select

from ..domain.entities import ChatSession, ChatMessage, VisadoHumanoTicket
from .dtos import ChatStartDTO, ChatMessageSendDTO, ChatSessionDTO, ChatMessageDTO


_MOCK_RESPONSE = (
    "Según la Ley N° 32449 (Marco Regulatorio ZEEP Chancay), las empresas con al menos "
    "30% de componentes locales acceden a exoneración del IR y arancel 0 en equipos importados. "
    "Le recomiendo revisar el Artículo 18 y coordinar con un asesor certificado ZEEP."
)
_MOCK_SOURCES = [
    {"titulo": "Ley N° 32449 - Art. 18", "url": None, "tipo": "ley"},
    {"titulo": "DS 009-2025-MINCETUR", "url": None, "tipo": "decreto"},
]


class AIAgentService:
    def __init__(self, session: Session):
        self.session = session

    def start_session(self, dto: ChatStartDTO, user_id: uuid.UUID) -> ChatSession:
        chat = ChatSession(
            user_id=user_id,
            investor_profile_id=dto.investor_profile_id,
            idioma=dto.idioma,
            titulo=dto.titulo,
        )
        self.session.add(chat)
        self.session.commit()
        self.session.refresh(chat)
        return chat

    def send_message(
        self, session_id: uuid.UUID, dto: ChatMessageSendDTO, user_id: uuid.UUID
    ) -> ChatMessage:
        chat = self.session.get(ChatSession, session_id)
        if not chat or chat.user_id != user_id:
            raise ValueError("session_not_found")

        # Persist user message
        user_msg = ChatMessage(
            session_id=session_id,
            role="user",
            content=dto.content,
        )
        self.session.add(user_msg)

        # Generate assistant response (mock — real LLM integration in spec09)
        assistant_msg = ChatMessage(
            session_id=session_id,
            role="assistant",
            content=_MOCK_RESPONSE,
            agente_activado="legal",
            confidence_score=None,
            sources=_MOCK_SOURCES,
            llm_provider="groq",
        )
        self.session.add(assistant_msg)

        # Update session timestamp
        chat.updated_at = datetime.utcnow()
        self.session.add(chat)
        self.session.commit()
        self.session.refresh(assistant_msg)
        return assistant_msg

    def get_history(self, session_id: uuid.UUID, user_id: uuid.UUID) -> list[ChatMessage]:
        chat = self.session.get(ChatSession, session_id)
        if not chat or chat.user_id != user_id:
            raise ValueError("session_not_found")

        return self.session.exec(
            select(ChatMessage)
            .where(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.created_at)
        ).all()

    def get_session(self, session_id: uuid.UUID, user_id: uuid.UUID) -> ChatSession | None:
        chat = self.session.get(ChatSession, session_id)
        if not chat or chat.user_id != user_id:
            return None
        return chat

    def list_sessions(self, user_id: uuid.UUID) -> list[ChatSession]:
        return self.session.exec(
            select(ChatSession)
            .where(ChatSession.user_id == user_id)
            .order_by(ChatSession.updated_at.desc())
        ).all()

    def query(
        self,
        user_id: uuid.UUID,
        query_text: str,
        lang: str = "es",
        investor_profile_id: uuid.UUID | None = None,
        session_id: str | None = None,
    ) -> tuple[ChatSession, ChatMessage]:
        if session_id:
            try:
                sid = uuid.UUID(session_id)
            except ValueError:
                sid = uuid.uuid4()
            chat = self.session.get(ChatSession, sid)
            if not chat:
                chat = ChatSession(id=sid, user_id=user_id, idioma=lang, investor_profile_id=investor_profile_id)
                self.session.add(chat)
                self.session.commit()
                self.session.refresh(chat)
        else:
            chat = self.start_session(
                ChatStartDTO(idioma=lang, investor_profile_id=investor_profile_id),
                user_id,
            )

        msg = self.send_message(
            chat.id,
            ChatMessageSendDTO(content=query_text),
            user_id,
        )
        msg.confidence_score = 0.92
        msg.requiere_visado_humano = False
        self.session.add(msg)
        self.session.commit()
        self.session.refresh(msg)
        return chat, msg

    def escalate(self, message_id: uuid.UUID, motivo: str, user_id: uuid.UUID) -> VisadoHumanoTicket:
        msg = self.session.get(ChatMessage, message_id)
        if not msg:
            raise ValueError("message_not_found")
        ticket = VisadoHumanoTicket(
            chat_message_id=message_id,
            session_id=msg.session_id,
            query_original=motivo,
            confidence_score=msg.confidence_score or 0.5,
        )
        msg.requiere_visado_humano = True
        self.session.add(msg)
        self.session.add(ticket)
        self.session.commit()
        self.session.refresh(ticket)
        return ticket

    def _resolve_session(
        self,
        user_id: uuid.UUID,
        lang: str,
        investor_profile_id: uuid.UUID | None,
        session_id: str | None,
    ) -> ChatSession:
        if session_id:
            try:
                sid = uuid.UUID(session_id)
            except ValueError:
                sid = uuid.uuid4()
            chat = self.session.get(ChatSession, sid)
            if not chat:
                chat = ChatSession(
                    id=sid, user_id=user_id, idioma=lang, investor_profile_id=investor_profile_id
                )
                self.session.add(chat)
                self.session.commit()
                self.session.refresh(chat)
            return chat
        return self.start_session(
            ChatStartDTO(idioma=lang, investor_profile_id=investor_profile_id),
            user_id,
        )

    def _generate_answer(self, query_text: str) -> str:
        api_key = os.getenv("GROQ_API_KEY")
        if api_key:
            try:
                from groq import Groq

                client = Groq(api_key=api_key)
                completion = client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[
                        {
                            "role": "system",
                            "content": (
                                "Eres el asesor legal COMEX.AI del Hub ZEEP Chancay (Ley N° 32449). "
                                "Responde en español, con precisión y citando artículos cuando aplique."
                            ),
                        },
                        {"role": "user", "content": query_text},
                    ],
                    temperature=0.3,
                    max_tokens=1200,
                )
                return completion.choices[0].message.content or _MOCK_RESPONSE
            except Exception:
                pass
        return _MOCK_RESPONSE

    def stream_query(
        self,
        user_id: uuid.UUID,
        query_text: str,
        lang: str = "es",
        investor_profile_id: uuid.UUID | None = None,
        session_id: str | None = None,
    ) -> Iterator[dict]:
        """Generador SSE: cadena de agentes + tokens + metadatos (spec09)."""
        from ..domain.agent_classifier import classify_agents

        agent_chain = classify_agents(query_text)
        chat = self._resolve_session(user_id, lang, investor_profile_id, session_id)

        yield {"type": "agent_chain", "agents": agent_chain}
        for agent in agent_chain:
            if agent == "orquestador":
                continue
            yield {"type": "agent_start", "agent": agent}

        user_msg = ChatMessage(session_id=chat.id, role="user", content=query_text)
        self.session.add(user_msg)
        self.session.commit()

        full_text = ""
        api_key = os.getenv("GROQ_API_KEY")
        streamed = False

        if api_key:
            try:
                from groq import Groq

                client = Groq(api_key=api_key)
                stream = client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[
                        {
                            "role": "system",
                            "content": (
                                "Eres el asesor legal COMEX.AI del Hub ZEEP Chancay (Ley N° 32449). "
                                "Responde en español, con precisión y citando artículos cuando aplique."
                            ),
                        },
                        {"role": "user", "content": query_text},
                    ],
                    temperature=0.3,
                    max_tokens=1200,
                    stream=True,
                )
                for chunk in stream:
                    delta = chunk.choices[0].delta.content or ""
                    if not delta:
                        continue
                    full_text += delta
                    streamed = True
                    yield {"type": "token", "content": delta}
            except Exception:
                full_text = ""

        if not streamed:
            answer = self._generate_answer(query_text)
            for word in answer.split():
                token = word + " "
                full_text += token
                yield {"type": "token", "content": token}

        confidence = 0.92
        assistant_msg = ChatMessage(
            session_id=chat.id,
            role="assistant",
            content=full_text.strip(),
            agente_activado="legal",
            confidence_score=confidence,
            sources=_MOCK_SOURCES,
            llm_provider="groq" if api_key else "mock",
            requiere_visado_humano=confidence < 0.70,
        )
        chat.updated_at = datetime.utcnow()
        self.session.add(assistant_msg)
        self.session.add(chat)
        self.session.commit()
        self.session.refresh(assistant_msg)

        primary = next(
            (a for a in reversed(agent_chain) if a not in ("orquestador", "auditor")),
            "legal",
        )
        yield {
            "type": "done",
            "session_id": str(chat.id),
            "message_id": str(assistant_msg.id),
            "confidence_score": confidence,
            "requiere_visado_humano": confidence < 0.70,
            "sources": _MOCK_SOURCES,
            "agentes_activados": [a for a in agent_chain if a != "orquestador"],
            "agent_chain": agent_chain,
            "agente_principal": primary,
        }

    def list_user_messages(self, user_id: uuid.UUID, session_filter: str | None = None) -> list[ChatMessage]:
        sessions = self.list_sessions(user_id)
        if session_filter:
            sessions = [s for s in sessions if str(s.id) == session_filter]
        messages: list[ChatMessage] = []
        for s in sessions:
            messages.extend(self.get_history(s.id, user_id))
        return messages
