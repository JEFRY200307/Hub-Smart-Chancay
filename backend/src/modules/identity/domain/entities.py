import uuid
from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship

class User(SQLModel, table=True):
    __tablename__ = "users"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    email: str = Field(unique=True, index=True)
    username: str = Field(unique=True, index=True)
    hashed_password: str
    ruc: str = Field(index=True)
    full_name: str
    role: str = Field(default="OPERATOR") # OPERATOR, PERITO, ADMIN
    
    refresh_token: Optional[str] = Field(default=None)
    last_active_at: datetime = Field(default_factory=datetime.utcnow)
    
    company_id: Optional[uuid.UUID] = Field(default=None, foreign_key="companies.id")
    # Nota: la relación con Company se define en zeep_ingestion pero SQLModel 
    # la resolverá si los modelos están cargados en el mismo metadata.
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = Field(default=True)
