import uuid
from typing import Optional, List
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, JSON

class SourceURL(SQLModel, table=True):
    __tablename__ = "source_urls"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    url: str = Field(unique=True, index=True)
    nombre: str
    sistema_prompt: str
    activa: bool = Field(default=True)
    ultima_ingesta: Optional[datetime] = Field(default=None)
    
    extracted_documents: List["ExtractedDocument"] = Relationship(back_populates="source_url")

class ExtractedDocument(SQLModel, table=True):
    __tablename__ = "extracted_documents"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    source_url_id: uuid.UUID = Field(foreign_key="source_urls.id")
    url_especifica: str
    contenido_texto_crudo: str
    estado_procesamiento: str = Field(default="PENDIENTE") # PENDIENTE, ESTRUCTURADO, ERROR
    fecha_extraccion: datetime = Field(default_factory=datetime.utcnow)
    
    source_url: SourceURL = Relationship(back_populates="extracted_documents")
    structured_opportunity: Optional["StructuredOpportunity"] = Relationship(back_populates="extracted_document")

class StructuredOpportunity(SQLModel, table=True):
    __tablename__ = "structured_opportunities"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    extracted_document_id: uuid.UUID = Field(foreign_key="extracted_documents.id", unique=True)
    titulo: str
    valor_destacado: str
    descripcion: str
    tipo_oportunidad: str
    fuente_url: str
    fecha_publicacion_origen: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    extracted_document: ExtractedDocument = Relationship(back_populates="structured_opportunity")

class Company(SQLModel, table=True):
    __tablename__ = "companies"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    ruc: str = Field(unique=True, index=True)
    razon_social: str
    estado_contribuyente: str
    condicion_domicilio: str = Field(default="")
    ubigeo: str
    
    # Clasificación Macro (Logística, Manufactura, etc.)
    sector_macro: Optional[str] = Field(default=None)
    is_verified: bool = Field(default=False)
    
    # Capa 1: Contacto y Presencia Digital
    dominio_web: Optional[str] = Field(default=None)
    correo_contacto: Optional[str] = Field(default=None)
    linkedin: Optional[str] = Field(default=None)
    
    # Capa 2 y 3: Json data (Usando pydantic/sqlmodel lo parsea como JSON si usamos Column(JSON))
    capacidad_operativa: Optional[dict] = Field(default_factory=dict, sa_column=Column(JSON))
    trust_signals: Optional[dict] = Field(default_factory=dict, sa_column=Column(JSON))
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
