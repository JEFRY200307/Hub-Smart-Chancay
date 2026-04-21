import uuid
from typing import Optional, List, Dict
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, JSON

class LegalAnalysis(SQLModel, table=True):
    __tablename__ = "legal_analyses"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    document_name: str
    overall_score: int
    
    # Hallazgos (Riesgos, Oportunidades, Sugerencias) - Usando JSON
    findings: Dict = Field(default_factory=dict, sa_column=Column(JSON))
    
    user_id: Optional[uuid.UUID] = Field(default=None, foreign_key="users.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Expert(SQLModel, table=True):
    __tablename__ = "experts"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str
    specialty: str
    availability: str
    image_url: Optional[str] = None

class Notification(SQLModel, table=True):
    __tablename__ = "notifications"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    title: str
    content: str
    type: str = Field(default="INFO") # INFO, WARNING, SUCCESS
    is_read: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
