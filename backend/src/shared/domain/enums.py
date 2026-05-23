from enum import Enum


# ── IDENTITY ──────────────────────────────────────────────────────────────────
class UserRole(str, Enum):
    inversor = "inversor"
    profesional = "profesional"
    operador_zeep = "operador_zeep"
    admin = "admin"


# ── SIMULATION ────────────────────────────────────────────────────────────────
class SectorType(str, Enum):
    manufactura = "manufactura"
    ckd = "ckd"
    tech = "tech"


class ClasificacionElegibilidad(str, Enum):
    elegible = "elegible"
    viable_con_ajustes = "viable_con_ajustes"
    no_elegible = "no_elegible"


# ── ONBOARDING ────────────────────────────────────────────────────────────────
class ProfileEstado(str, Enum):
    en_progreso = "en_progreso"
    completado = "completado"
    archivado = "archivado"


class FaseNombre(str, Enum):
    elegibilidad = "elegibilidad"
    validacion_legal = "validacion_legal"
    contratacion = "contratacion"
    operacion = "operacion"


class FaseEstado(str, Enum):
    completado = "completado"
    en_progreso = "en_progreso"
    pendiente = "pendiente"


class TipoDocumento(str, Enum):
    carta_intencion = "carta_intencion"
    evaluacion_ambiental = "evaluacion_ambiental"
    certificacion_tecnica = "certificacion_tecnica"
    registro_empresa_origen = "registro_empresa_origen"
    plan_idi = "plan_idi"
    otro = "otro"


# ── MATCHMAKING ───────────────────────────────────────────────────────────────
class CategoriaMatch(str, Enum):
    ingeniero_cip = "ingeniero_cip"
    abogado_cal = "abogado_cal"
    proveedor_local = "proveedor_local"


class DisponibilidadEstado(str, Enum):
    disponible = "disponible"
    parcial = "parcial"
    ocupado = "ocupado"


class ValidacionEstado(str, Enum):
    vigente = "vigente"
    vencida = "vencida"
    en_proceso = "en_proceso"
    requiere_verificacion = "requiere_verificacion"


# ── LEDGER ────────────────────────────────────────────────────────────────────
class LedgerEventType(str, Enum):
    SIMULACION_COMPLETADA = "SIMULACION_COMPLETADA"
    PERFIL_CREADO = "PERFIL_CREADO"
    PERFIL_ACTUALIZADO = "PERFIL_ACTUALIZADO"
    DOCUMENTO_ADJUNTADO = "DOCUMENTO_ADJUNTADO"
    VALIDACION_SUNARP_INICIADA = "VALIDACION_SUNARP_INICIADA"
    VALIDACION_SUNARP_COMPLETADA = "VALIDACION_SUNARP_COMPLETADA"
    VALIDACION_CIP_INICIADA = "VALIDACION_CIP_INICIADA"
    VALIDACION_CIP_COMPLETADA = "VALIDACION_CIP_COMPLETADA"
    VALIDACION_CAL_INICIADA = "VALIDACION_CAL_INICIADA"
    VALIDACION_CAL_COMPLETADA = "VALIDACION_CAL_COMPLETADA"
    ALERTA_DOCUMENTO_FALTANTE = "ALERTA_DOCUMENTO_FALTANTE"
    MATCH_GENERADO = "MATCH_GENERADO"
    REUNION_SOLICITADA = "REUNION_SOLICITADA"
    REUNION_CONFIRMADA = "REUNION_CONFIRMADA"
    REUNION_COMPLETADA = "REUNION_COMPLETADA"
    MINUTA_REGISTRADA = "MINUTA_REGISTRADA"
    CANDIDATO_RECHAZADO = "CANDIDATO_RECHAZADO"
    PROPUESTA_RECIBIDA = "PROPUESTA_RECIBIDA"
    PROPUESTA_ACEPTADA = "PROPUESTA_ACEPTADA"
    PROPUESTA_RECHAZADA = "PROPUESTA_RECHAZADA"
    CONTRATO_FIRMADO = "CONTRATO_FIRMADO"
    DOSSIER_GENERADO = "DOSSIER_GENERADO"
    DOSSIER_APROBADO_OPERADOR = "DOSSIER_APROBADO_OPERADOR"
    OPERACION_INICIADA = "OPERACION_INICIADA"


class ActorType(str, Enum):
    inversor = "inversor"
    profesional = "profesional"
    agente_ia = "agente_ia"
    sistema = "sistema"
    operador_zeep = "operador_zeep"


# ── LEGAL AI ──────────────────────────────────────────────────────────────────
class MessageRole(str, Enum):
    user = "user"
    assistant = "assistant"
    system = "system"


class AgenteActivadoType(str, Enum):
    legal = "legal"
    tecnico = "tecnico"
    financiero = "financiero"
    idi = "idi"
    matchmaker = "matchmaker"
    auditor = "auditor"


# ── ANALYTICS / PADRONRUC ────────────────────────────────────────────────────
class TamanoMipyme(str, Enum):
    micro = "micro"
    pequena = "pequena"
    mediana = "mediana"
    grande = "grande"


class SectorInterno(str, Enum):
    manufactura = "manufactura"
    ckd = "ckd"
    tech = "tech"
    logistica = "logistica"
    construccion = "construccion"
    otros = "otros"


class TipoContribuyente(str, Enum):
    PERSONA_NATURAL = "PERSONA_NATURAL"
    PERSONA_JURIDICA = "PERSONA_JURIDICA"
    SOCIEDAD_CONYUGAL = "SOCIEDAD_CONYUGAL"
    SUCESION_INDIVISA = "SUCESION_INDIVISA"


# ── ZEEP INGESTION ───────────────────────────────────────────────────────────
class ScrapingEstado(str, Enum):
    pendiente = "pendiente"
    en_proceso = "en_proceso"
    completado = "completado"
    fallido = "fallido"


class FuenteEmpresa(str, Enum):
    sunarp_scraping = "sunarp_scraping"
    bulk_historico = "bulk_historico"
    padron_ruc = "padron_ruc"
    manual = "manual"


# ── REUNIONES ─────────────────────────────────────────────────────────────────
class ReunionModalidad(str, Enum):
    virtual = "virtual"
    presencial = "presencial"
    hibrida = "hibrida"


class ReunionEstado(str, Enum):
    pendiente = "pendiente"
    confirmada = "confirmada"
    realizada = "realizada"
    cancelada = "cancelada"
    reprogramada = "reprogramada"
    no_asistio = "no_asistio"
