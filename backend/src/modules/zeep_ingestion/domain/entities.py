from __future__ import annotations
import uuid
from typing import Optional
from datetime import datetime, date
from decimal import Decimal
from sqlmodel import SQLModel, Field
from sqlalchemy import Column, Text, Numeric, Boolean, SmallInteger, Date, Integer, String
from sqlalchemy.dialects.postgresql import JSONB, ARRAY


class Company(SQLModel, table=True):
    __tablename__ = "companies"

    ruc: str = Field(primary_key=True, max_length=11)
    razon_social: str = Field(max_length=500)
    tipo_persona: str = Field(default="JURIDICA", max_length=20)
    estado_sunarp: str = Field(max_length=30)                       # ACTIVA | BAJA | SUSPENDIDA | EN_LIQUIDACION
    fecha_inscripcion: Optional[date] = Field(default=None)

    # Datos SUNARP registrales
    capital_social_soles: Optional[Decimal] = Field(default=None, sa_column=Column(Numeric(18, 2), nullable=True))
    domicilio_fiscal: Optional[str] = Field(default=None, sa_column=Column(Text, nullable=True))
    ubigeo: Optional[str] = Field(default=None, max_length=6)
    distancia_puerto_chancay_km: Optional[Decimal] = Field(default=None, sa_column=Column(Numeric(8, 2), nullable=True))

    # Directorio y poderes
    directorio: list = Field(default_factory=list, sa_column=Column(JSONB, nullable=False, server_default="[]"))
    poderes_vigentes: Optional[bool] = Field(default=None)
    ultima_vigencia_poderes: Optional[date] = Field(default=None)

    # Cargas registrales
    tiene_cargas: bool = Field(default=False)
    cargas_detalle: list = Field(default_factory=list, sa_column=Column(JSONB, nullable=False, server_default="[]"))
    tiene_procedimiento_concursal: bool = Field(default=False)

    # Datos PadronRUC SUNAT
    estado_contribuyente: Optional[str] = Field(default=None, max_length=30)
    condicion_contribuyente: Optional[str] = Field(default=None, max_length=20)
    tipo_contribuyente: Optional[str] = Field(default=None, max_length=30)
    ciiu_principal: Optional[str] = Field(default=None, max_length=10)
    fecha_inicio_actividades: Optional[date] = Field(default=None)

    # Clasificación interna
    sector_interno: Optional[str] = Field(default=None, max_length=20)     # SectorInterno enum
    tamano_empresa: Optional[str] = Field(default=None, max_length=20)     # TamanoMipyme enum

    # Trust Score
    trust_score: Optional[Decimal] = Field(default=None, sa_column=Column(Numeric(5, 4), nullable=True))
    capacidad_operativa: Optional[str] = Field(default=None, max_length=10) # alta | media | baja

    # Stats de plataforma
    veces_seleccionada_match: int = Field(default=0)
    activa_en_zeep: bool = Field(default=False)

    # Control de datos
    fuente_principal: str = Field(default="sunarp_scraping", max_length=30)
    last_sunarp_check: Optional[datetime] = Field(default=None)
    last_padron_sync: Optional[date] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Marketplace
    marketplace_visible: bool = Field(default=False)
    descripcion_publica: Optional[str] = Field(default=None, sa_column=Column(Text, nullable=True))
    logo_url: Optional[str] = Field(default=None, sa_column=Column(Text, nullable=True))
    sitio_web: Optional[str] = Field(default=None, max_length=500)
    email_contacto_publico: Optional[str] = Field(default=None, max_length=320)
    telefono_publico: Optional[str] = Field(default=None, max_length=30)
    linkedin_url: Optional[str] = Field(default=None, max_length=500)
    anios_experiencia: Optional[int] = Field(default=None, sa_column=Column(SmallInteger, nullable=True))
    servicios_principales: list = Field(default_factory=list, sa_column=Column(ARRAY(String), nullable=False, server_default="{}"))

    # Enriquecimiento web
    web_enrichment_data: dict = Field(default_factory=dict, sa_column=Column(JSONB, nullable=False, server_default="{}"))
    web_enrichment_at: Optional[datetime] = Field(default=None)


class SourceURL(SQLModel, table=True):
    __tablename__ = "source_urls"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    url: str = Field(sa_column=Column(Text, unique=True, nullable=False))
    nombre: str = Field(max_length=300)
    descripcion: Optional[str] = Field(default=None, sa_column=Column(Text, nullable=True))
    system_prompt: Optional[str] = Field(default=None, sa_column=Column(Text, nullable=True))
    coleccion_chromadb: Optional[str] = Field(default=None, max_length=100)
    activo: bool = Field(default=True)
    frecuencia: str = Field(default="diario", max_length=20)
    last_scraped_at: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ExtractedDocument(SQLModel, table=True):
    __tablename__ = "extracted_documents"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    source_url_id: uuid.UUID = Field(foreign_key="source_urls.id")
    url_especifica: str = Field(sa_column=Column(Text, nullable=False))
    raw_content: Optional[str] = Field(default=None, sa_column=Column(Text, nullable=True))
    raw_html: Optional[str] = Field(default=None, sa_column=Column(Text, nullable=True))
    mime_type: Optional[str] = Field(default=None, max_length=100)
    estado: str = Field(default="completado", max_length=20)           # ScrapingEstado enum
    error_msg: Optional[str] = Field(default=None, sa_column=Column(Text, nullable=True))
    tokens_estimados: Optional[int] = Field(default=None)
    scraped_at: datetime = Field(default_factory=datetime.utcnow)


class StructuredOpportunity(SQLModel, table=True):
    __tablename__ = "structured_opportunities"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    document_id: uuid.UUID = Field(foreign_key="extracted_documents.id")
    titulo: Optional[str] = Field(default=None, max_length=500)
    descripcion: Optional[str] = Field(default=None, sa_column=Column(Text, nullable=True))
    tipo: Optional[str] = Field(default=None, max_length=100)          # NORMA | RESOLUCION | CONVOCATORIA | NOTICIA
    fecha_publicacion: Optional[date] = Field(default=None)
    fuente: Optional[str] = Field(default=None, max_length=300)
    highlights: list = Field(default_factory=list, sa_column=Column(JSONB, nullable=False, server_default="[]"))
    entidades_mencionadas: list = Field(default_factory=list, sa_column=Column(JSONB, nullable=False, server_default="[]"))

    # Embedding vectorial: gestionado directamente en la migración (VECTOR(1536) via pgvector)
    # No se define aquí para evitar dependencia de pgvector en el import; se accede via raw SQL.

    procesado_por_llm: Optional[str] = Field(default=None, max_length=50)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class SyncLog(SQLModel, table=True):
    __tablename__ = "sync_logs"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    tipo_sync: str = Field(max_length=50)                               # sunarp_bulk | padron_ruc | scraping_diario
    fuente: Optional[str] = Field(default=None, sa_column=Column(Text, nullable=True))
    total_registros: Optional[int] = Field(default=None)
    insertados: int = Field(default=0)
    actualizados: int = Field(default=0)
    errores: int = Field(default=0)
    duracion_seg: Optional[Decimal] = Field(default=None, sa_column=Column(Numeric(10, 2), nullable=True))
    estado: str = Field(max_length=20)                                  # ScrapingEstado enum
    error_detalle: Optional[str] = Field(default=None, sa_column=Column(Text, nullable=True))
    iniciado_at: datetime = Field(default_factory=datetime.utcnow)
    completado_at: Optional[datetime] = Field(default=None)
