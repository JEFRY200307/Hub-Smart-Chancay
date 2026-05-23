# spec05 — LEDGER: Trazabilidad Inmutable del Ciclo de Inversión

**nombre del módulo:** ledger_trazabilidad  
**flujo:** 04. LEDGER  
**objetivo:** Registrar de forma inmutable cada hito, reunión, documento y decisión del ciclo de inversión, desde la primera simulación hasta la firma del contrato con el Operador ZEEP, generando el Dossier de Inversión Pre-Aprobado al cierre.

---

## Descripción

El Ledger es el registro de auditoría central de la plataforma. Implementa inmutabilidad a nivel de aplicación mediante eventos append-only con hashing encadenado (inspirado en blockchain pero sobre PostgreSQL). Permite al Operador ZEEP, al CIP Lima y al MINCETUR verificar la trazabilidad completa de cada inversión. Al completar la fase de Contratación, genera automáticamente el Dossier de Inversión Pre-Aprobado (PDF consolidado).

---

## Entidades del Dominio

### `LedgerEvent`

```
LedgerEvent
├── id: UUID
├── investor_profile_id: UUID
├── sequence_number: int            (autoincremental, nunca se reutiliza)
├── event_type: LedgerEventType
├── payload: JSONB                  (datos del evento, inmutable post-creación)
├── actor_id: UUID                  (usuario o agente que originó el evento)
├── actor_type: ActorType           (inversor | profesional | agente_ia | sistema)
├── previous_hash: str              (SHA-256 del LedgerEvent anterior de este profile)
├── hash: str                       (SHA-256 de: sequence_number + event_type + payload + previous_hash)
└── created_at: datetime            (timestamp UTC, inmutable)
```

### `LedgerEventType` (enum exhaustivo)

```
# Ciclo de Simulación y Perfil
SIMULACION_COMPLETADA
PERFIL_CREADO
PERFIL_ACTUALIZADO
DOCUMENTO_ADJUNTADO

# Ciclo de Validación Legal
VALIDACION_SUNARP_INICIADA
VALIDACION_SUNARP_COMPLETADA
VALIDACION_CIP_INICIADA
VALIDACION_CIP_COMPLETADA
VALIDACION_CAL_INICIADA
VALIDACION_CAL_COMPLETADA
ALERTA_DOCUMENTO_FALTANTE

# Ciclo de Matchmaking
MATCH_GENERADO
REUNION_SOLICITADA
REUNION_CONFIRMADA
REUNION_COMPLETADA
MINUTA_REGISTRADA
CANDIDATO_RECHAZADO

# Ciclo de Contratación
PROPUESTA_RECIBIDA
PROPUESTA_ACEPTADA
PROPUESTA_RECHAZADA
CONTRATO_FIRMADO

# Ciclo de Cierre
DOSSIER_GENERADO
DOSSIER_APROBADO_OPERADOR
OPERACION_INICIADA
```

### `Minuta`

```
Minuta
├── id: UUID
├── ledger_event_id: UUID
├── reunion_id: UUID
├── participantes: List[ParticipanteMinuta]
├── acuerdos: List[str]
├── proximos_pasos: List[str]
├── fecha_reunion: datetime
└── validada_por: UUID  (firma del Operador ZEEP o profesional responsable)
```

### `DossierInversion`

```
DossierInversion
├── id: UUID
├── investor_profile_id: UUID
├── version: int
├── fecha_generacion: datetime
├── secciones: DossierSecciones
│   ├── resumen_ejecutivo: str
│   ├── perfil_empresa: EmpresaOrigen
│   ├── score_elegibilidad: float
│   ├── proyeccion_fiscal: ProyeccionFiscal
│   ├── validaciones: List[ValidacionInstitucional]
│   ├── profesionales_asignados: List[CandidatoMatch]
│   ├── minutas: List[Minuta]
│   └── documentos_adjuntos: List[DocumentoAdjunto]
├── hash_integridad: str  (SHA-256 del contenido completo)
└── url_pdf: str          (enlace al archivo generado)
```

---

## Mecanismo de Inmutabilidad

El Ledger es append-only: ningún registro `LedgerEvent` puede ser modificado o eliminado después de su creación. La integridad se garantiza mediante:

1. **Hashing Encadenado:** Cada evento incluye el hash SHA-256 del evento inmediatamente anterior perteneciente al mismo `investor_profile_id`. El primer evento usa `previous_hash = "GENESIS"`.
2. **Verificación de Cadena:** Endpoint `GET /api/v1/ledger/{profile_id}/verify` recorre todos los eventos en orden y recomputa los hashes para detectar cualquier alteración.
3. **Restricción de BD:** Las filas de `ledger_events` tienen política `NO UPDATE, NO DELETE` a nivel de PostgreSQL (Row-Level Security + trigger).
4. **Sequence Monotónico:** El `sequence_number` es gestionado por una secuencia PostgreSQL, nunca por la aplicación.

---

## Flujo Paso a Paso

```
[PASO 1] Registro de Eventos desde Módulos Upstream
  ├─ Cualquier módulo (spec02, spec03, spec04, spec06) llama a:
  │   LedgerService.append(investor_profile_id, event_type, payload, actor_id)
  ├─ LedgerService calcula previous_hash, computa hash del nuevo evento
  └─ Persiste LedgerEvent en PostgreSQL (operación atómica)

[PASO 2] Registro de Reuniones
  ├─ Matchmaking (spec04) crea evento REUNION_SOLICITADA con candidato_id
  ├─ Profesional confirma → evento REUNION_CONFIRMADA
  ├─ Tras la reunión, el Operador ZEEP o el profesional registra la Minuta:
  │   ├─ Acuerdos alcanzados (lista de strings)
  │   ├─ Próximos pasos con responsables y fechas
  │   └─ Documentos comprometidos para la próxima reunión
  └─ Evento MINUTA_REGISTRADA con Minuta serializada en payload

[PASO 3] Registro de Validaciones Institucionales
  ├─ SUNARP: driver spec01 publica resultado → evento VALIDACION_SUNARP_COMPLETADA
  ├─ CIP: API CIP publica resultado → evento VALIDACION_CIP_COMPLETADA
  ├─ CAL: API CAL publica resultado → evento VALIDACION_CAL_COMPLETADA
  └─ Cada validación fallida genera también ALERTA_DOCUMENTO_FALTANTE

[PASO 4] Seguimiento del Roadmap de Instalación
  ├─ Cada cambio de fase del roadmap genera un evento en el Ledger
  ├─ El Agente Auditor revisa periódicamente (APScheduler) el estado del Ledger:
  │   ├─ Si una fase lleva >N días sin movimiento → genera alerta al inversor
  │   └─ Si hay documentos pendientes > fecha límite → escala al Operador ZEEP
  └─ Todos los eventos del Agente Auditor tienen actor_type=AGENTE_IA

[PASO 5] Consulta y Visualización del Ledger (Dashboard)
  ├─ Timeline visual de todos los eventos ordenados por sequence_number
  ├─ Filtros: por tipo de evento, por actor, por fase del roadmap
  ├─ Cada evento expandible con su payload completo
  └─ Indicador de verificación de cadena (ícono de escudo: ✓ Integridad verificada)

[PASO 6] Generación del Dossier de Inversión Pre-Aprobado
  Trigger: evento CONTRATO_FIRMADO registrado por Operador ZEEP
  ├─ LedgerService recopila todos los eventos del profile
  ├─ DossierService ensambla las secciones del DossierInversion
  ├─ Agente Orquestador genera el Resumen Ejecutivo (LLM):
  │   ├─ Narrativa de 300-500 palabras del ciclo de inversión
  │   ├─ Hitos clave alcanzados y fechas
  │   └─ Proyección de impacto económico y empleos
  ├─ PDFRenderer genera el PDF firmado con hash de integridad
  ├─ Almacena en S3/Blob, registra URL en DossierInversion
  └─ Evento DOSSIER_GENERADO en el Ledger (autorreferencial)

[PASO 7] Validación de Integridad (Endpoint de Auditoría)
  ├─ GET /api/v1/ledger/{profile_id}/verify
  ├─ Recorre eventos en orden por sequence_number
  ├─ Recomputa hash de cada evento y compara con hash almacenado
  ├─ Verifica que previous_hash[n] == hash[n-1]
  └─ Retorna: { "valid": true, "events_verified": 47, "tampered_at": null }
```

---

## API Endpoints

```
POST   /api/v1/ledger/events              # Registrar nuevo evento (uso interno por módulos)
GET    /api/v1/ledger/{profile_id}        # Timeline completo del inversor
GET    /api/v1/ledger/{profile_id}/verify # Verificar integridad de la cadena
POST   /api/v1/ledger/minutas             # Registrar minuta de reunión
GET    /api/v1/ledger/{profile_id}/dossier # Obtener o generar Dossier PDF
GET    /api/v1/ledger/stats               # Estadísticas globales (uso analítica spec07)
```

---

## Patrones de Diseño

- **Event Sourcing (simplificado):** El estado del proceso de inversión se reconstruye proyectando la lista de `LedgerEvent` en orden de `sequence_number`
- **Append-Only Log:** Restricción estructural a nivel de base de datos; ningún UPDATE o DELETE sobre `ledger_events`
- **Chain of Hashes:** Inmutabilidad verificable sin necesidad de blockchain externo

## Integraciones

| Sistema | Uso |
|---|---|
| PostgreSQL | Almacenamiento principal del Ledger (RLS + trigger NO UPDATE) |
| S3 / Azure Blob | Almacenamiento del PDF del Dossier |
| LLM Groq | Generación del Resumen Ejecutivo del Dossier |
| APScheduler | Agente Auditor periódico para detección de estancamientos |
| MINCETUR / CIP Lima | Sincronización de validaciones para gobernanza institucional |

## Tests

- `test_hash_encadenado_correcto`: tres eventos consecutivos → hashes encadenados válidos
- `test_verificar_integridad_cadena_valid`: cadena sin alteraciones → `valid=true`
- `test_verificar_integridad_cadena_tampered`: payload modificado en BD → `tampered_at` retorna sequence_number del evento alterado
- `test_append_only_no_update`: intento de UPDATE sobre ledger_events → error PostgreSQL
- `test_dossier_generado_tras_contrato_firmado`: evento CONTRATO_FIRMADO → DossierInversion creado con URL PDF válida
- `test_minuta_registrada_en_payload`: payload de MINUTA_REGISTRADA contiene acuerdos y próximos pasos
- `test_agente_auditor_alerta_estancamiento`: fase sin movimiento por 10 días hábiles → evento ALERTA_DOCUMENTO_FALTANTE generado
