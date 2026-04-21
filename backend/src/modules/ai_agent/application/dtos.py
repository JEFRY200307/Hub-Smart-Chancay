from pydantic import BaseModel, ConfigDict
from typing import List, Dict, Optional
import uuid

class ChatRequestDTO(BaseModel):
    message: str

class ChatResponseDTO(BaseModel):
    response: str
    sources: List[str]

class AnalysisResponseDTO(BaseModel):
    id: uuid.UUID
    document_name: str
    overall_score: int
    findings: Dict
    
    model_config = ConfigDict(from_attributes=True)

class ExpertDTO(BaseModel):
    id: uuid.UUID
    name: str
    specialty: str
    availability: str
    image_url: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

class NotificationDTO(BaseModel):
    id: uuid.UUID
    title: str
    content: str
    type: str
    created_at: str
    
    model_config = ConfigDict(from_attributes=True)
