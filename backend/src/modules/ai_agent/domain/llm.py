from typing import Protocol, List

class Message(Protocol):
    role: str
    content: str

class LLMProvider(Protocol):
    async def generate_response(self, messages: List[Message], temperature: float = 0.0) -> str:
        """Generates a text response based on conversational history."""
        ...

class EmbeddingProvider(Protocol):
    async def create_embedding(self, text: str) -> List[float]:
        """Creates semantic vectors for RAG."""
        ...
