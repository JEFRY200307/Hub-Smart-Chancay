from __future__ import annotations
import uuid
from typing import Optional
from datetime import datetime, date
from decimal import Decimal
from sqlmodel import SQLModel, Field
from sqlalchemy import Column, Text, Numeric, SmallInteger, Boolean, Integer, String
from sqlalchemy.dialects.postgresql import JSONB, ARRAY


class MatchResult(SQLModel, table=True):
    __tablename__ = "match_results"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    investor_profile_id: uuid.UUID = Field(foreign_key="investor_profiles.id")
    categoria: str = Field(max_length=20)                               # CategoriaMatch enum
    score_promedio: Decimal = Field(sa_column=Column(Numeric(5, 4), nullable=False))
    justificacion_agente: Optional[str] = Field(default=None, sa_column=Column(Text, nullable=True))
    tokens_usados: Optional[int] = Field(default=None)
    latencia_ms: Optional[int] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class MatchCandidato(SQLModel, table=True):
    __tablename__ = "match_candidatos"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    match_result_id: uuid.UUID = Field(foreign_key="match_results.id")
    ranking: int = Field(sa_column=Column(SmallInteger, nullable=False))

    # Identificación del candidato
    candidato_ref_id: Optional[uuid.UUID] = Field(default=None)
    candidato_nombre: str = Field(max_length=300)
    candidato_org: Optional[str] = Field(default=None, max_length=300)

    # Scores
    score_compatibilidad: Decimal = Field(sa_column=Column(Numeric(5, 4), nullable=False))
    score_sector: Optional[Decimal] = Field(default=None, sa_column=Column(Numeric(5, 4), nullable=True))
    score_geo: Optional[Decimal] = Field(default=None, sa_column=Column(Numeric(5, 4), nullable=True))
    score_idioma: Optional[Decimal] = Field(default=None, sa_column=Column(Numeric(5, 4), nullable=True))
    score_historial: Optional[Decimal] = Field(default=None, sa_column=Column(Numeric(5, 4), nullable=True))
    score_validacion: Optional[Decimal] = Field(default=None, sa_column=Column(Numeric(5, 4), nullable=True))

    # Estado y datos del candidato
    especialidad_principal: Optional[str] = Field(default=None, max_length=300)
    idiomas: list = Field(default_factory=list, sa_column=Column(ARRAY(String), nullable=False, server_default="{}"))
    disponibilidad: str = Field(default="disponible", max_length=20)    # DisponibilidadEstado enum
    validacion_institucional: str = Field(max_length=30)                # ValidacionEstado enum
    validacion_at: Optional[datetime] = Field(default=None)

    # Justificación IA y estado
    justificacion: Optional[str] = Field(default=None, sa_column=Column(Text, nullable=True))
    reunion_solicitada: bool = Field(default=False)
    reunion_confirmada_at: Optional[datetime] = Field(default=None)


class EngineerCIP(SQLModel, table=True):
    __tablename__ = "engineers_cip"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: Optional[uuid.UUID] = Field(default=None, foreign_key="users.id")

    # Identificación institucional
    numero_cip: str = Field(max_length=20, unique=True)
    dni: Optional[str] = Field(default=None, max_length=8)
    nombre_completo: str = Field(max_length=300)
    apellidos: Optional[str] = Field(default=None, max_length=200)

    # Habilitación
    habilitacion_vigente: bool = Field(default=False)
    fecha_habilitacion: Optional[date] = Field(default=None)
    fecha_vencimiento_hab: Optional[date] = Field(default=None)
    last_cip_check: Optional[datetime] = Field(default=None)

    # Especialidades
    especialidad_principal: str = Field(max_length=200)
    especialidades: list = Field(default_factory=list, sa_column=Column(JSONB, nullable=False, server_default="[]"))
    experiencia_zeep: bool = Field(default=False)
    anos_experiencia: Optional[int] = Field(default=None, sa_column=Column(SmallInteger, nullable=True))
    sector_preferido: Optional[str] = Field(default=None, max_length=15)  # SectorType enum
    ciiu_sectores: list = Field(default_factory=list, sa_column=Column(ARRAY(String), nullable=False, server_default="{}"))

    # Localización
    region: Optional[str] = Field(default=None, max_length=100)
    ciudad: Optional[str] = Field(default=None, max_length=100)
    ubigeo: Optional[str] = Field(default=None, max_length=6)
    distancia_puerto_chancay_km: Optional[Decimal] = Field(default=None, sa_column=Column(Numeric(8, 2), nullable=True))

    # Idiomas
    idiomas: list = Field(default_factory=lambda: ["es"], sa_column=Column(ARRAY(String), nullable=False, server_default="{es}"))
    nivel_mandarin: Optional[str] = Field(default=None, max_length=20)
    nivel_ingles: Optional[str] = Field(default=None, max_length=20)

    # Disponibilidad
    disponibilidad: str = Field(default="disponible", max_length=20)
    modalidad_trabajo: str = Field(default="mixto", max_length=20)
    tarifa_hora_usd: Optional[Decimal] = Field(default=None, sa_column=Column(Numeric(8, 2), nullable=True))
    disponible_desde: Optional[date] = Field(default=None)

    # CV enriquecido
    cv_data: dict = Field(default_factory=dict, sa_column=Column(JSONB, nullable=False, server_default="{}"))

    # Tarjeta marketplace
    foto_url: Optional[str] = Field(default=None, sa_column=Column(Text, nullable=True))
    descripcion_publica: Optional[str] = Field(default=None, sa_column=Column(Text, nullable=True))
    linkedin_url: Optional[str] = Field(default=None, max_length=500)
    sitio_web: Optional[str] = Field(default=None, max_length=500)
    video_presentacion_url: Optional[str] = Field(default=None, sa_column=Column(Text, nullable=True))

    # Métricas
    rating_promedio: Optional[Decimal] = Field(default=None, sa_column=Column(Numeric(3, 2), nullable=True))
    total_reviews: int = Field(default=0)
    reuniones_completadas: int = Field(default=0)
    tasa_confirmacion_pct: Optional[Decimal] = Field(default=None, sa_column=Column(Numeric(5, 2), nullable=True))

    # Control
    marketplace_visible: bool = Field(default=False)
    validado_plataforma: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class LawyerCAL(SQLModel, table=True):
    __tablename__ = "lawyers_cal"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: Optional[uuid.UUID] = Field(default=None, foreign_key="users.id")

    # Identificación institucional
    numero_cal: str = Field(max_length=20, unique=True)
    dni: Optional[str] = Field(default=None, max_length=8)
    nombre_completo: str = Field(max_length=300)
    apellidos: Optional[str] = Field(default=None, max_length=200)

    # Habilitación
    habilitacion_vigente: bool = Field(default=False)
    fecha_habilitacion: Optional[date] = Field(default=None)
    fecha_vencimiento_hab: Optional[date] = Field(default=None)
    last_cal_check: Optional[datetime] = Field(default=None)

    # Especialización
    especializacion_principal: str = Field(max_length=200)
    especializaciones: list = Field(default_factory=list, sa_column=Column(JSONB, nullable=False, server_default="[]"))
    certificacion_zeep: bool = Field(default=False)
    anos_experiencia: Optional[int] = Field(default=None, sa_column=Column(SmallInteger, nullable=True))
    sectores_experiencia: list = Field(default_factory=list, sa_column=Column(ARRAY(String), nullable=False, server_default="{}"))
    experiencia_zeep: bool = Field(default=False)

    # Localización
    region: Optional[str] = Field(default=None, max_length=100)
    ciudad: Optional[str] = Field(default=None, max_length=100)
    ubigeo: Optional[str] = Field(default=None, max_length=6)
    distancia_puerto_chancay_km: Optional[Decimal] = Field(default=None, sa_column=Column(Numeric(8, 2), nullable=True))

    # Idiomas
    idiomas: list = Field(default_factory=lambda: ["es"], sa_column=Column(ARRAY(String), nullable=False, server_default="{es}"))
    nivel_mandarin: Optional[str] = Field(default=None, max_length=20)
    nivel_ingles: Optional[str] = Field(default=None, max_length=20)
    otros_idiomas: list = Field(default_factory=list, sa_column=Column(JSONB, nullable=False, server_default="[]"))

    # Disponibilidad
    disponibilidad: str = Field(default="disponible", max_length=20)
    modalidad_trabajo: str = Field(default="mixto", max_length=20)
    tarifa_hora_usd: Optional[Decimal] = Field(default=None, sa_column=Column(Numeric(8, 2), nullable=True))

    # CV enriquecido
    cv_data: dict = Field(default_factory=dict, sa_column=Column(JSONB, nullable=False, server_default="{}"))

    # Tarjeta marketplace
    foto_url: Optional[str] = Field(default=None, sa_column=Column(Text, nullable=True))
    descripcion_publica: Optional[str] = Field(default=None, sa_column=Column(Text, nullable=True))
    linkedin_url: Optional[str] = Field(default=None, max_length=500)
    sitio_web_estudio: Optional[str] = Field(default=None, max_length=500)

    # Métricas
    rating_promedio: Optional[Decimal] = Field(default=None, sa_column=Column(Numeric(3, 2), nullable=True))
    total_reviews: int = Field(default=0)
    reuniones_completadas: int = Field(default=0)
    tasa_confirmacion_pct: Optional[Decimal] = Field(default=None, sa_column=Column(Numeric(5, 2), nullable=True))

    # Control
    marketplace_visible: bool = Field(default=False)
    validado_plataforma: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Reunion(SQLModel, table=True):
    __tablename__ = "reuniones"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    # Origen del match
    investor_profile_id: uuid.UUID = Field(foreign_key="investor_profiles.id")
    match_candidato_id: Optional[uuid.UUID] = Field(default=None, foreign_key="match_candidatos.id")

    # Participantes
    inversor_user_id: uuid.UUID = Field(foreign_key="users.id")
    profesional_tipo: str = Field(max_length=20)                        # engineer_cip | lawyer_cal | proveedor_local
    profesional_id: Optional[uuid.UUID] = Field(default=None)
    profesional_nombre: str = Field(max_length=300)

    # Programación
    fecha_propuesta: datetime
    duracion_minutos: int = Field(default=60, sa_column=Column(SmallInteger, nullable=False, server_default="60"))
    modalidad: str = Field(default="virtual", max_length=15)            # ReunionModalidad enum
    zona_horaria: str = Field(default="America/Lima", max_length=50)

    # Ubicación/enlace
    link_virtual: Optional[str] = Field(default=None, sa_column=Column(Text, nullable=True))
    direccion_fisica: Optional[str] = Field(default=None, sa_column=Column(Text, nullable=True))
    ubicacion_notas: Optional[str] = Field(default=None, sa_column=Column(Text, nullable=True))

    # Estados y fechas clave
    estado: str = Field(default="pendiente", max_length=20)             # ReunionEstado enum
    confirmada_at: Optional[datetime] = Field(default=None)
    realizada_at: Optional[datetime] = Field(default=None)
    cancelada_at: Optional[datetime] = Field(default=None)
    motivo_cancelacion: Optional[str] = Field(default=None, sa_column=Column(Text, nullable=True))
    reprogramada_en_id: Optional[uuid.UUID] = Field(default=None)       # FK self-referencial; se define en migración

    # Contenido de la reunión
    agenda_previa: Optional[str] = Field(default=None, sa_column=Column(Text, nullable=True))
    documentos_agenda: list = Field(default_factory=list, sa_column=Column(JSONB, nullable=False, server_default="[]"))

    # Minuta post-reunión
    minuta_registrada: bool = Field(default=False)
    minuta_participantes: list = Field(default_factory=list, sa_column=Column(JSONB, nullable=False, server_default="[]"))
    minuta_acuerdos: list = Field(default_factory=list, sa_column=Column(JSONB, nullable=False, server_default="[]"))
    minuta_proximos_pasos: list = Field(default_factory=list, sa_column=Column(JSONB, nullable=False, server_default="[]"))
    minuta_documentos_comprometidos: list = Field(default_factory=list, sa_column=Column(JSONB, nullable=False, server_default="[]"))
    minuta_validada_por: Optional[uuid.UUID] = Field(default=None, foreign_key="users.id")
    minuta_registrada_at: Optional[datetime] = Field(default=None)
    ledger_event_id: Optional[uuid.UUID] = Field(default=None)

    # Feedback
    notas_privadas_inversor: Optional[str] = Field(default=None, sa_column=Column(Text, nullable=True))

    # Control
    fase_roadmap: Optional[str] = Field(default=None, max_length=25)   # FaseNombre enum
    creada_por: uuid.UUID = Field(foreign_key="users.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ReunionSlot(SQLModel, table=True):
    __tablename__ = "reunion_slots"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    reunion_id: uuid.UUID = Field(foreign_key="reuniones.id")
    fecha_hora: datetime
    duracion_minutos: int = Field(default=60, sa_column=Column(SmallInteger, nullable=False, server_default="60"))
    propuesto_por: uuid.UUID = Field(foreign_key="users.id")
    aceptado: Optional[bool] = Field(default=None)                      # NULL=pendiente, True=aceptado, False=rechazado
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ProfessionalReview(SQLModel, table=True):
    __tablename__ = "professional_reviews"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    profesional_tipo: str = Field(max_length=20)                        # engineer_cip | lawyer_cal
    profesional_id: uuid.UUID
    investor_profile_id: uuid.UUID = Field(foreign_key="investor_profiles.id")
    reunion_id: uuid.UUID = Field(foreign_key="reuniones.id")
    rating: int = Field(sa_column=Column(SmallInteger, nullable=False))
    comentario: Optional[str] = Field(default=None, sa_column=Column(Text, nullable=True))
    atributos: dict = Field(default_factory=dict, sa_column=Column(JSONB, nullable=False, server_default="{}"))
    created_at: datetime = Field(default_factory=datetime.utcnow)
