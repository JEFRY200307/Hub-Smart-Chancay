# DB_SCHEMA — COMEX.AI / Sovereign Gateway

**Versión:** 1.1 | **Fecha:** 2026-05-22  
**Basado en:** spec01–spec08, DOMAIN_MAP v2.0, ADR-01, ADR-02  
**Motor:** PostgreSQL 16 alojado en **Supabase** (ADR-01-10). Migraciones vía Alembic.

---

## Índice

1. [Convenciones y Tipos](#convenciones)
2. [Tipos Enumerados (ENUMs)](#enums)
3. [PostgreSQL — Tablas por Módulo](#postgresql)
   - Identity
   - Simulation (GANCHO)
   - Onboarding / Profiling
   - Matchmaking
   - Ledger
   - Legal AI (RAG)
   - ZEEP Ingestion (SUNARP)
   - Analytics / PadronRUC
   - Configuración del Sistema
4. [Índices](#indexes)
5. [Triggers y Políticas de Seguridad (RLS)](#triggers)
6. [Secuencias](#sequences)
7. [ChromaDB — Colecciones del Agente Legal RAG](#chromadb)
8. [Profesionales — Ingenieros CIP y Abogados CAL](#professionals)
9. [Reuniones](#reuniones)

---

## 1. Convenciones y Tipos <a name="convenciones"></a>

- **PK:** `id UUID DEFAULT gen_random_uuid()` salvo que se indique otro tipo
- **Timestamps:** `created_at TIMESTAMPTZ DEFAULT NOW()` en todas las tablas; `updated_at` donde aplica (actualizado por trigger)
- **JSONB:** usado para estructuras flexibles que requieren querying interno con índice GIN
- **TEXT vs VARCHAR:** se usa `TEXT` para strings sin límite conocido; `VARCHAR(n)` para campos con límite definido (RUC, códigos, etc.)
- **Soft delete:** no aplicado; entidades borradas se marcan con campo de estado o simplemente no se borran (Ledger es append-only por diseño)
- **Convención de nombres:** snake_case para todo. Tablas en plural.

---

## 2. Tipos Enumerados (ENUMs) <a name="enums"></a>

```sql
-- IDENTITY
CREATE TYPE user_role AS ENUM (
    'inversor',
    'profesional',     -- Ingeniero CIP o Abogado CAL registrado en la plataforma
    'operador_zeep',   -- Entidad Operador ZEEP Chancay; puede firmar contratos en el Ledger
    'admin'
);

-- SIMULATION
CREATE TYPE sector_type AS ENUM ('manufactura', 'ckd', 'tech');
CREATE TYPE clasificacion_elegibilidad AS ENUM (
    'elegible',           -- score >= 80
    'viable_con_ajustes', -- score 60-79
    'no_elegible'         -- score < 60
);

-- ONBOARDING
CREATE TYPE profile_estado AS ENUM ('en_progreso', 'completado', 'archivado');
CREATE TYPE fase_nombre AS ENUM (
    'elegibilidad',
    'validacion_legal',
    'contratacion',
    'operacion'
);
CREATE TYPE fase_estado AS ENUM ('completado', 'en_progreso', 'pendiente');
CREATE TYPE tipo_documento AS ENUM (
    'carta_intencion',
    'evaluacion_ambiental',
    'certificacion_tecnica',
    'registro_empresa_origen',
    'plan_idi',
    'otro'
);

-- MATCHMAKING
CREATE TYPE categoria_match AS ENUM ('ingeniero_cip', 'abogado_cal', 'proveedor_local');
CREATE TYPE disponibilidad_estado AS ENUM ('disponible', 'parcial', 'ocupado');
CREATE TYPE validacion_estado AS ENUM ('vigente', 'vencida', 'en_proceso', 'requiere_verificacion');

-- LEDGER
CREATE TYPE ledger_event_type AS ENUM (
    -- Perfil
    'SIMULACION_COMPLETADA',
    'PERFIL_CREADO',
    'PERFIL_ACTUALIZADO',
    'DOCUMENTO_ADJUNTADO',
    -- Validación legal
    'VALIDACION_SUNARP_INICIADA',
    'VALIDACION_SUNARP_COMPLETADA',
    'VALIDACION_CIP_INICIADA',
    'VALIDACION_CIP_COMPLETADA',
    'VALIDACION_CAL_INICIADA',
    'VALIDACION_CAL_COMPLETADA',
    'ALERTA_DOCUMENTO_FALTANTE',
    -- Matchmaking
    'MATCH_GENERADO',
    'REUNION_SOLICITADA',
    'REUNION_CONFIRMADA',
    'REUNION_COMPLETADA',
    'MINUTA_REGISTRADA',
    'CANDIDATO_RECHAZADO',
    -- Contratación
    'PROPUESTA_RECIBIDA',
    'PROPUESTA_ACEPTADA',
    'PROPUESTA_RECHAZADA',
    'CONTRATO_FIRMADO',
    -- Cierre
    'DOSSIER_GENERADO',
    'DOSSIER_APROBADO_OPERADOR',
    'OPERACION_INICIADA'
);

CREATE TYPE actor_type AS ENUM ('inversor', 'profesional', 'agente_ia', 'sistema', 'operador_zeep');

-- LEGAL AI
CREATE TYPE message_role AS ENUM ('user', 'assistant', 'system');
CREATE TYPE agente_activado_type AS ENUM ('legal', 'tecnico', 'financiero', 'idi', 'matchmaker', 'auditor');

-- ANALYTICS
CREATE TYPE tamano_mipyme AS ENUM ('micro', 'pequena', 'mediana', 'grande');
CREATE TYPE sector_interno AS ENUM ('manufactura', 'ckd', 'tech', 'logistica', 'construccion', 'otros');
CREATE TYPE tipo_contribuyente AS ENUM (
    'PERSONA_NATURAL',
    'PERSONA_JURIDICA',
    'SOCIEDAD_CONYUGAL',
    'SUCESION_INDIVISA'
);

-- ZEEP INGESTION
CREATE TYPE scraping_estado AS ENUM ('pendiente', 'en_proceso', 'completado', 'fallido');
CREATE TYPE fuente_empresa AS ENUM ('sunarp_scraping', 'bulk_historico', 'padron_ruc', 'manual');
```

---

## 3. PostgreSQL — Tablas por Módulo <a name="postgresql"></a>

### 3.1 IDENTITY

```sql
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(320) NOT NULL UNIQUE,
    hashed_password TEXT NOT NULL,
    role            user_role NOT NULL DEFAULT 'inversor',
    full_name       VARCHAR(200),
    phone           VARCHAR(20),
    preferred_lang  VARCHAR(5) DEFAULT 'es' CHECK (preferred_lang IN ('es', 'en', 'zh')),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    is_verified     BOOLEAN NOT NULL DEFAULT FALSE,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token       TEXT NOT NULL UNIQUE,              -- JWT refresh token (hashed en BD)
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at  TIMESTAMPTZ NOT NULL,
    revoked_at  TIMESTAMPTZ,                       -- NULL = token activo
    ip_address  INET,
    user_agent  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Verificación de email OTP para registro de empresa extranjera (spec08)
CREATE TABLE email_verification_tokens (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash          TEXT NOT NULL,              -- bcrypt del OTP de 6 dígitos
    expires_at          TIMESTAMPTZ NOT NULL,       -- NOW() + 15 minutos
    intentos_fallidos   SMALLINT NOT NULL DEFAULT 0,
    used_at             TIMESTAMPTZ,                -- NULL = token activo
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_evtoken_user ON email_verification_tokens(user_id);
CREATE INDEX idx_evtoken_activo ON email_verification_tokens(user_id)
    WHERE used_at IS NULL;
```

---

### 3.2 SIMULATION (GANCHO — spec02)

```sql
CREATE TABLE simulation_records (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID NOT NULL UNIQUE,          -- identificador de sesión anónima o autenticada
    user_id         UUID REFERENCES users(id),     -- NULL si simulación sin registro previo

    -- Sector y clasificación
    sector          sector_type NOT NULL,
    clasificacion   clasificacion_elegibilidad NOT NULL,

    -- Variables de entrada (base)
    monto_inversion_usd     NUMERIC(18, 2) NOT NULL,
    empleo_directo          INTEGER NOT NULL CHECK (empleo_directo >= 0),
    empleo_indirecto        INTEGER DEFAULT 0,
    porcentaje_cl           NUMERIC(5, 2) NOT NULL CHECK (porcentaje_cl BETWEEN 0 AND 100),
    tiempo_instalacion_meses INTEGER NOT NULL CHECK (tiempo_instalacion_meses > 0),
    pais_origen             VARCHAR(2) NOT NULL,   -- ISO 3166-1 alpha-2
    exportacion_pct         NUMERIC(5, 2) DEFAULT 0,

    -- Variables sectoriales (estructura varía por sector)
    variables_sector        JSONB NOT NULL DEFAULT '{}',
    /*
    Manufactura: {
        "tipo_proceso": "batch|continuo|discreto",
        "requiere_anexo_4": bool,
        "va_estimado_pct": float,
        "tipo_impacto_ambiental": "alto|medio|bajo"
    }
    CKD: {
        "producto_ensamblado": str,
        "ratio_ckd_importado": float,
        "mercado_destino": "exportacion|regional|interno",
        "certificaciones": [str]
    }
    Tech: {
        "tipo_servicio": "software|ia|cloud|idi|logistica",
        "pct_servicios_exportables": float,
        "requiere_datacenter": bool,
        "ratio_empleos_tech": float
    }
    */

    -- Resultados del scoring
    v_base          NUMERIC(6, 4) NOT NULL,
    delta_cl        NUMERIC(6, 4) NOT NULL DEFAULT 0,
    delta_sector    NUMERIC(6, 4) NOT NULL DEFAULT 0,
    v_final         NUMERIC(5, 2) NOT NULL,        -- Score final [0, 100]
    beneficio_cl_activo BOOLEAN NOT NULL DEFAULT FALSE,

    -- Proyección fiscal
    proyeccion_fiscal JSONB NOT NULL DEFAULT '{}',
    /*
    {
        "ir_estandar_pct": 29.5,
        "ir_zeep_pct": 0.0,
        "ahorro_5_anos_usd": 1250000,
        "igv_exonerado": true,
        "arancel_0": true
    }
    */

    -- Alertas y recomendaciones generadas por IA
    alertas                 JSONB NOT NULL DEFAULT '[]',
    /*
    [{"tipo": "requiere_anexo_4", "descripcion": str, "impacto_score": float}]
    */
    recomendaciones_agente  JSONB NOT NULL DEFAULT '[]',
    -- ["Incrementar CL de 28% a 30% activa 0% IR (impacto: +4.2 puntos)", ...]

    -- Control
    ip_address      INET,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### 3.3 ONBOARDING / PROFILING (spec03)

```sql
CREATE TABLE investor_profiles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID NOT NULL REFERENCES simulation_records(session_id),
    user_id         UUID NOT NULL REFERENCES users(id),
    estado          profile_estado NOT NULL DEFAULT 'en_progreso',

    -- Empresa de origen
    empresa_razon_social        VARCHAR(500) NOT NULL,
    empresa_pais_origen         VARCHAR(2) NOT NULL,
    empresa_registro_extranjero VARCHAR(100),       -- RUC/VAT/EIN equivalente
    empresa_sector_ciiu         VARCHAR(10),
    empresa_capital_usd         NUMERIC(18, 2),

    -- Representante legal
    rep_nombre          VARCHAR(300),
    rep_documento_tipo  VARCHAR(20),                -- DNI | PASAPORTE | CE
    rep_documento_num   VARCHAR(50),
    rep_cargo           VARCHAR(100),

    -- Proyecto de inversión
    proyecto_nombre             VARCHAR(500) NOT NULL,
    proyecto_descripcion        TEXT,
    proyecto_monto_usd          NUMERIC(18, 2) NOT NULL,
    proyecto_empleo_directo     INTEGER NOT NULL DEFAULT 0,
    proyecto_empleo_indirecto   INTEGER DEFAULT 0,
    proyecto_porcentaje_cl      NUMERIC(5, 2) NOT NULL DEFAULT 0,
    proyecto_fecha_inicio        DATE,
    proyecto_duracion_meses     INTEGER,
    proyecto_exportacion_pct    NUMERIC(5, 2) DEFAULT 0,

    -- Perfil técnico (discriminated union por sector)
    sector          sector_type NOT NULL,
    perfil_tecnico  JSONB NOT NULL DEFAULT '{}',
    /*
    PerfilManufactura: {
        "tipo_proceso": str,
        "materias_primas": [str],
        "capacidad_produccion_anual": str,
        "requiere_anexo_4": bool,
        "certificaciones_ambientales": [str]
    }
    PerfilCKD: {
        "producto_ensamblado": str,
        "ratio_ckd_importado": float,
        "lineas_montaje": int,
        "mercado_destino": str,
        "certificaciones_tecnicas": [str]
    }
    PerfilTech: {
        "tipo_servicio": str,
        "pct_exportable": float,
        "requiere_datacenter": bool,
        "ratio_empleos_tech": float,
        "convenios_universidad": [str]
    }
    */

    -- Roadmap de instalación personalizado
    roadmap JSONB NOT NULL DEFAULT '[]',
    /*
    [
        {
            "fase": "elegibilidad",
            "estado": "completado",
            "dias_estimados": 1,
            "hitos": ["Score calculado", "Beneficios fiscales proyectados"]
        },
        {
            "fase": "validacion_legal",
            "estado": "en_progreso",
            "dias_estimados": 2,
            "hitos": ["Revisión documentación corporativa", "Permisos APN"]
        },
        ...
    ]
    */

    -- Metadatos de control
    completion_pct  SMALLINT DEFAULT 0 CHECK (completion_pct BETWEEN 0 AND 100),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE documentos_adjuntos (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    investor_profile_id UUID NOT NULL REFERENCES investor_profiles(id) ON DELETE CASCADE,
    tipo                tipo_documento NOT NULL,
    nombre_archivo      VARCHAR(500) NOT NULL,
    url_storage         TEXT NOT NULL,             -- S3/Azure Blob URL
    size_bytes          BIGINT,
    mime_type           VARCHAR(100),
    hash_sha256         VARCHAR(64),               -- integridad del archivo
    subido_por          UUID NOT NULL REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### 3.4 MATCHMAKING (spec04)

```sql
CREATE TABLE match_results (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    investor_profile_id UUID NOT NULL REFERENCES investor_profiles(id),
    categoria           categoria_match NOT NULL,
    score_promedio      NUMERIC(5, 4) NOT NULL,
    justificacion_agente TEXT,                     -- Resumen IA del resultado del match
    tokens_usados       INTEGER,                   -- para métricas LLM
    latencia_ms         INTEGER,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (investor_profile_id, categoria)        -- Un resultado por categoría por perfil
);

CREATE TABLE match_candidatos (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_result_id     UUID NOT NULL REFERENCES match_results(id) ON DELETE CASCADE,
    ranking             SMALLINT NOT NULL CHECK (ranking BETWEEN 1 AND 5),

    -- Identificación del candidato
    candidato_ref_id    UUID,                      -- ID en tabla externa (CIP/CAL/companies)
    candidato_nombre    VARCHAR(300) NOT NULL,
    candidato_org       VARCHAR(300),              -- Institución u empresa

    -- Scores
    score_compatibilidad    NUMERIC(5, 4) NOT NULL,
    score_sector            NUMERIC(5, 4),
    score_geo               NUMERIC(5, 4),
    score_idioma            NUMERIC(5, 4),
    score_historial         NUMERIC(5, 4),
    score_validacion        NUMERIC(5, 4),

    -- Estado y datos de contacto
    especialidad_principal  VARCHAR(300),
    idiomas                 VARCHAR(10)[] DEFAULT '{}',
    disponibilidad          disponibilidad_estado NOT NULL DEFAULT 'disponible',
    validacion_institucional validacion_estado NOT NULL,
    validacion_at           TIMESTAMPTZ,           -- cuándo se verificó la habilitación

    -- Justificación IA y estado de la solicitud
    justificacion           TEXT,                  -- generada por Agente Matchmaker
    reunion_solicitada      BOOLEAN DEFAULT FALSE,
    reunion_confirmada_at   TIMESTAMPTZ,

    UNIQUE (match_result_id, ranking)
);
```

---

### 3.5 LEDGER (spec05)

```sql
-- Secuencia global para sequence_number (ver sección 7)
CREATE SEQUENCE ledger_global_seq START 1 INCREMENT 1 NO CYCLE;

CREATE TABLE ledger_events (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    investor_profile_id UUID NOT NULL REFERENCES investor_profiles(id),
    sequence_number     BIGINT NOT NULL DEFAULT nextval('ledger_global_seq'),

    event_type          ledger_event_type NOT NULL,
    payload             JSONB NOT NULL DEFAULT '{}',
    /*
    Ejemplos por event_type:
    MINUTA_REGISTRADA: {
        "participantes": [{"nombre": str, "rol": str}],
        "acuerdos": [str],
        "proximos_pasos": [str],
        "validada_por": uuid
    }
    MATCH_GENERADO: {
        "match_result_id": uuid,
        "categoria": str,
        "candidatos_count": int
    }
    CONTRATO_FIRMADO: {
        "operador_id": uuid,
        "contrato_url": str,
        "fecha_firma": date
    }
    */

    actor_id            UUID NOT NULL,             -- user_id o sistema uuid constante
    actor_type          actor_type NOT NULL,

    -- Cadena de integridad (hashing encadenado SHA-256)
    previous_hash       VARCHAR(64) NOT NULL,      -- 'GENESIS' para el primer evento del perfil
    hash                VARCHAR(64) NOT NULL UNIQUE,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()

    -- RESTRICCIÓN: Este registro nunca debe ser modificado ni eliminado.
    -- Protegido por trigger prevent_ledger_mutation (ver sección 6).
);

-- Restricción adicional a nivel de aplicación: sequence_number por perfil debe ser monotónico
-- Validado en LedgerService.append() antes de insertar.

CREATE TABLE dossiers_inversion (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    investor_profile_id UUID NOT NULL REFERENCES investor_profiles(id),
    version             SMALLINT NOT NULL DEFAULT 1,

    -- Contenido estructurado
    resumen_ejecutivo   TEXT,                      -- Generado por LLM (300-500 palabras)
    secciones           JSONB NOT NULL DEFAULT '{}',
    /*
    {
        "score_elegibilidad": float,
        "proyeccion_fiscal": {...},
        "validaciones": [{"tipo": str, "estado": str, "fecha": date}],
        "profesionales_asignados": [...],
        "minutas_count": int,
        "documentos_adjuntos_count": int
    }
    */

    -- Integridad
    hash_integridad     VARCHAR(64) NOT NULL,      -- SHA-256 del contenido completo del PDF
    url_pdf             TEXT NOT NULL,             -- URL en S3/Azure Blob
    size_bytes          BIGINT,

    -- Aprobación
    aprobado_por        UUID REFERENCES users(id), -- operador_zeep que aprueba
    aprobado_at         TIMESTAMPTZ,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (investor_profile_id, version)
);
```

---

### 3.6 LEGAL AI / RAG (spec06)

```sql
CREATE TABLE chat_sessions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id),
    investor_profile_id UUID REFERENCES investor_profiles(id),  -- NULL si consulta anónima en landing
    idioma              VARCHAR(5) NOT NULL DEFAULT 'es',
    titulo              VARCHAR(300),              -- Resumen auto-generado de la primera consulta
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE chat_messages (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id          UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role                message_role NOT NULL,
    content             TEXT NOT NULL,

    -- Solo para mensajes del asistente (role = 'assistant')
    agente_activado     agente_activado_type,
    confidence_score    NUMERIC(4, 3),             -- [0, 1]; NULL para mensajes de usuario
    requiere_visado_humano BOOLEAN DEFAULT FALSE,
    tokens_prompt       INTEGER,
    tokens_completion   INTEGER,
    latencia_ms         INTEGER,
    llm_provider        VARCHAR(50),               -- groq | gemini | claude

    -- Fuentes normativas citadas
    sources             JSONB NOT NULL DEFAULT '[]',
    /*
    [
        {
            "norma": "Ley N° 32449",
            "articulo": "Art. 15",
            "fecha_vigencia": "2024-07-01",
            "derogado": false,
            "coleccion_chromadb": "ley_zeep_32449",
            "chunk_id": "uuid"
        }
    ]
    */

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tickets de visado humano (consultas que requieren revisión CIP/CAL)
CREATE TABLE visado_humano_tickets (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_message_id     UUID NOT NULL REFERENCES chat_messages(id),
    session_id          UUID NOT NULL REFERENCES chat_sessions(id),
    query_original      TEXT NOT NULL,
    confidence_score    NUMERIC(4, 3) NOT NULL,
    asignado_a          UUID REFERENCES users(id), -- profesional CIP/CAL asignado
    resuelto_at         TIMESTAMPTZ,
    respuesta_experto   TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### 3.7 ZEEP INGESTION — SUNARP Driver (spec01)

```sql
CREATE TABLE companies (
    ruc                 VARCHAR(11) PRIMARY KEY CHECK (LENGTH(ruc) = 11),
    razon_social        VARCHAR(500) NOT NULL,
    tipo_persona        VARCHAR(20) NOT NULL DEFAULT 'JURIDICA',
    estado_sunarp       VARCHAR(30) NOT NULL,       -- ACTIVA | BAJA | SUSPENDIDA | EN_LIQUIDACION
    fecha_inscripcion   DATE,

    -- Datos SUNARP registrales
    capital_social_soles NUMERIC(18, 2),
    domicilio_fiscal    TEXT,
    ubigeo              VARCHAR(6),                 -- Código INEI
    coordenadas         POINT,                     -- Para índice GiST; (longitud, latitud)
    distancia_puerto_chancay_km NUMERIC(8, 2),

    -- Directorio y poderes
    directorio          JSONB NOT NULL DEFAULT '[]',
    /*
    [{"nombre": str, "cargo": str, "dni": str, "vigente": bool}]
    */
    poderes_vigentes    BOOLEAN,
    ultima_vigencia_poderes DATE,

    -- Cargas registrales
    tiene_cargas        BOOLEAN NOT NULL DEFAULT FALSE,
    cargas_detalle      JSONB NOT NULL DEFAULT '[]',
    /*
    [{"tipo": str, "monto_soles": float, "acreedor": str, "fecha": date}]
    */
    tiene_procedimiento_concursal BOOLEAN NOT NULL DEFAULT FALSE,

    -- Datos PadronRUC SUNAT (sincronizados desde padron_ruc_staging)
    estado_contribuyente        VARCHAR(30),        -- ACTIVO | SUSPENDIDO | BAJA
    condicion_contribuyente     VARCHAR(20),        -- HABIDO | NO HABIDO
    tipo_contribuyente          tipo_contribuyente,
    ciiu_principal              VARCHAR(10),
    fecha_inicio_actividades    DATE,

    -- Clasificación interna
    sector_interno      sector_interno,
    tamano_empresa      tamano_mipyme,

    -- Trust Score calculado
    trust_score         NUMERIC(5, 4) CHECK (trust_score BETWEEN 0 AND 1),
    capacidad_operativa VARCHAR(10) CHECK (capacidad_operativa IN ('alta', 'media', 'baja')),

    -- Stats de uso en la plataforma
    veces_seleccionada_match INTEGER DEFAULT 0,    -- cuántas veces fue elegida en matchmaking
    activa_en_zeep      BOOLEAN DEFAULT FALSE,     -- tiene contrato activo en Ledger

    -- Control de datos
    fuente_principal    fuente_empresa NOT NULL DEFAULT 'sunarp_scraping',
    last_sunarp_check   TIMESTAMPTZ,
    last_padron_sync    DATE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- ── MARKETPLACE ─────────────────────────────────────────────────────────
    -- Campos estructurados de presentación pública (mostrados en la tarjeta)
    marketplace_visible     BOOLEAN NOT NULL DEFAULT FALSE,
    descripcion_publica     TEXT,                    -- Descripción corta para la tarjeta (~200 chars)
    logo_url                TEXT,                    -- URL del logo en S3/Azure Blob
    sitio_web               VARCHAR(500),
    email_contacto_publico  VARCHAR(320),
    telefono_publico        VARCHAR(30),
    linkedin_url            VARCHAR(500),
    anios_experiencia       SMALLINT,
    -- Sectores/servicios principales expuestos en la tarjeta
    servicios_principales   TEXT[] DEFAULT '{}',     -- ["Logística portuaria", "Almacenamiento"]

    -- ── ENRIQUECIMIENTO WEB (Tavily / Scrapling) ──────────────────────────
    -- Datos dinámicos recuperados de internet; estructura varía por sector
    web_enrichment_data     JSONB NOT NULL DEFAULT '{}',
    /*
    Estructura base (todos los sectores):
    {
      "descripcion_extendida": str,
      "servicios_ofrecidos": [str],
      "certificaciones": [
          {"nombre": str, "organismo": str, "vigente": bool, "anio": int}
      ],
      "contactos_clave": [
          {"nombre": str, "cargo": str, "email": str, "telefono": str}
      ],
      "presencia_digital": {"sitio_web": str, "linkedin": str, "facebook": str},
      "noticias_destacadas": [{"titulo": str, "url": str, "fecha": str}],
      "fuente_scraping": "tavily | scrapling",
      "fecha_enriquecimiento": "ISO 8601"
    }

    Sector Manufactura — sector_data adicional:
    {
      "sector_data": {
        "capacidad_produccion": "500 TM/mes",
        "equipamiento_principal": ["Torno CNC", "Fresadora 5 ejes"],
        "mercados_exportacion": ["Brasil", "Colombia", "Chile"],
        "clientes_principales": ["COSCO", "VOLVO Peru"],
        "certificaciones_calidad": ["ISO 9001:2015", "NTP INACAL 001"],
        "certificaciones_ambientales": ["ISO 14001:2015"],
        "capacidad_almacen_m2": 3000,
        "zona_operacion": "Callao | Lima Norte | Chancay"
      }
    }

    Sector CKD — sector_data adicional:
    {
      "sector_data": {
        "categorias_producto": ["Vehículos ligeros", "Maquinaria agrícola"],
        "capacidad_ensamblaje_mensual": "200 unidades",
        "lineas_ensamblaje": 3,
        "socios_ckd": ["Toyota", "John Deere"],
        "certificaciones_producto": ["CE", "ISO/TS 16949"],
        "certificacion_oea_sunat": true,
        "destinos_exportacion": ["Chile", "Ecuador", "Bolivia"]
      }
    }

    Sector Tech/Servicios — sector_data adicional:
    {
      "sector_data": {
        "tech_stack": ["Python", "React", "AWS", "PostgreSQL"],
        "servicios_tech": ["Desarrollo de software", "IA empresarial", "Ciberseguridad"],
        "certificaciones_tech": ["AWS Partner", "ISO 27001", "ISO 27017"],
        "tamano_equipo": 45,
        "proyectos_idi_activos": ["Proyecto CONCYTEC 2024-005"],
        "partners_cloud": ["Microsoft Azure", "AWS"],
        "experiencia_exportacion_servicios": true,
        "clientes_internacionales": ["Empresa X (CN)", "Corp Y (US)"]
      }
    }
    */
    web_enrichment_at       TIMESTAMPTZ              -- Última actualización del enriquecimiento
);

CREATE TABLE source_urls (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url             TEXT NOT NULL UNIQUE,
    nombre          VARCHAR(300) NOT NULL,
    descripcion     TEXT,
    system_prompt   TEXT,                          -- Instrucciones para el LLM al procesar esta fuente
    coleccion_chromadb VARCHAR(100),               -- Colección de destino en ChromaDB
    activo          BOOLEAN NOT NULL DEFAULT TRUE,
    frecuencia      VARCHAR(20) DEFAULT 'diario',  -- diario | semanal | mensual | manual
    last_scraped_at TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE extracted_documents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_url_id   UUID NOT NULL REFERENCES source_urls(id),
    url_especifica  TEXT NOT NULL,                 -- URL exacta del documento (puede diferir de source_url)
    raw_content     TEXT,                          -- Texto extraído (puede ser grande)
    raw_html        TEXT,                          -- HTML original (para re-procesamiento)
    mime_type       VARCHAR(100),
    estado          scraping_estado NOT NULL DEFAULT 'completado',
    error_msg       TEXT,                          -- NULL si sin error
    tokens_estimados INTEGER,
    scraped_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE structured_opportunities (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id     UUID NOT NULL REFERENCES extracted_documents(id),

    -- Datos estructurados extraídos por LLM
    titulo          VARCHAR(500),
    descripcion     TEXT,
    tipo            VARCHAR(100),                  -- NORMA | RESOLUCION | CONVOCATORIA | NOTICIA
    fecha_publicacion DATE,
    fuente          VARCHAR(300),
    highlights      JSONB NOT NULL DEFAULT '[]',   -- ["Beneficio arancelario 0%", ...]
    entidades_mencionadas JSONB DEFAULT '[]',      -- ["MINCETUR", "APN", ...]

    -- Embedding para búsqueda semántica (pgvector)
    embedding       VECTOR(1536),                  -- text-embedding-3-small (OpenAI) o 768 nomic

    -- Control
    procesado_por_llm VARCHAR(50),                 -- groq | gemini
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Log de sincronizaciones SUNARP y PadronRUC
CREATE TABLE sync_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_sync       VARCHAR(50) NOT NULL,           -- sunarp_bulk | padron_ruc | scraping_diario
    fuente          TEXT,
    total_registros INTEGER,
    insertados      INTEGER DEFAULT 0,
    actualizados    INTEGER DEFAULT 0,
    errores         INTEGER DEFAULT 0,
    duracion_seg    NUMERIC(10, 2),
    estado          scraping_estado NOT NULL,
    error_detalle   TEXT,
    iniciado_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completado_at   TIMESTAMPTZ
);
```

---

### 3.8 ANALYTICS / PADRONRUC (spec07)

```sql
CREATE TABLE padron_ruc_staging (
    ruc                         VARCHAR(11) PRIMARY KEY CHECK (LENGTH(ruc) = 11),
    razon_social                VARCHAR(500) NOT NULL,
    estado_contribuyente        VARCHAR(30) NOT NULL,
    condicion_contribuyente     VARCHAR(20) NOT NULL,
    tipo_contribuyente          VARCHAR(50),
    ciiu_principal              VARCHAR(10),
    ciiu_secundario             VARCHAR(10),
    ubigeo                      VARCHAR(6),
    departamento                VARCHAR(100),
    provincia                   VARCHAR(100),
    distrito                    VARCHAR(100),
    direccion                   TEXT,
    fecha_inscripcion           DATE,
    fecha_inicio_actividades    DATE,
    fecha_baja                  DATE,
    descarga_fecha              DATE NOT NULL        -- Fecha del archivo bulk de origen
);

```

---

### 3.9 Configuración del Sistema

```sql
-- Pesos Wi del modelo de scoring (ADR-02-02: actualizables sin despliegue)
CREATE TABLE weight_configs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sector          sector_type NOT NULL,
    config_name     VARCHAR(100) NOT NULL,          -- 'base' | 'delta_cl' | 'delta_sector'
    weights         JSONB NOT NULL,
    /*
    Base (todos los sectores):
    {"w1": 0.45, "w2": 0.25, "w3": 0.30, "w4": 0.20}

    Delta Manufactura:
    {"w5": 0.15, "w6": 0.10, "w7": 0.10}

    Delta CKD:
    {"w5": 0.15, "w6": 0.12, "w7": 0.08}

    Delta Tech:
    {"w5": 0.18, "w6": 0.14, "w7": 0.08}
    */
    descripcion     TEXT,
    activo          BOOLEAN NOT NULL DEFAULT TRUE,
    creado_por      UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (sector, config_name, activo)
);

-- Configuración del sistema RAG (prompts versionados)
CREATE TABLE rag_prompt_configs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agente          agente_activado_type NOT NULL,
    nombre          VARCHAR(200) NOT NULL,
    system_prompt   TEXT NOT NULL,
    temperatura     NUMERIC(3, 2) DEFAULT 0.10,
    max_tokens      INTEGER DEFAULT 1500,
    activo          BOOLEAN NOT NULL DEFAULT TRUE,
    version         INTEGER NOT NULL DEFAULT 1,
    creado_por      UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (agente, activo)                         -- Solo un prompt activo por agente
);
```

---

## 4. Índices <a name="indexes"></a>

```sql
-- ═══════════════════════ IDENTITY ═══════════════════════
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id) WHERE revoked_at IS NULL;
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);

-- ═══════════════════════ SIMULATION ═══════════════════════
CREATE INDEX idx_simulation_session ON simulation_records(session_id);
CREATE INDEX idx_simulation_user ON simulation_records(user_id);
CREATE INDEX idx_simulation_sector ON simulation_records(sector);
CREATE INDEX idx_simulation_clasificacion ON simulation_records(clasificacion);
CREATE INDEX idx_simulation_created ON simulation_records(created_at DESC);
-- GIN para queries dentro del JSONB de variables_sector
CREATE INDEX idx_simulation_variables_gin ON simulation_records USING GIN(variables_sector);

-- ═══════════════════════ ONBOARDING ═══════════════════════
CREATE INDEX idx_investor_profiles_user ON investor_profiles(user_id);
CREATE INDEX idx_investor_profiles_session ON investor_profiles(session_id);
CREATE INDEX idx_investor_profiles_estado ON investor_profiles(estado);
CREATE INDEX idx_investor_profiles_sector ON investor_profiles(sector);
CREATE INDEX idx_investor_profiles_pais ON investor_profiles(empresa_pais_origen);
-- GIN para queries sobre perfil_tecnico y roadmap
CREATE INDEX idx_investor_profiles_perfil_gin ON investor_profiles USING GIN(perfil_tecnico);
CREATE INDEX idx_investor_profiles_roadmap_gin ON investor_profiles USING GIN(roadmap);
CREATE INDEX idx_documentos_profile ON documentos_adjuntos(investor_profile_id);

-- ═══════════════════════ MATCHMAKING ═══════════════════════
CREATE INDEX idx_match_results_profile ON match_results(investor_profile_id);
CREATE INDEX idx_match_results_categoria ON match_results(categoria);
CREATE INDEX idx_match_candidatos_result ON match_candidatos(match_result_id);
CREATE INDEX idx_match_candidatos_score ON match_candidatos(score_compatibilidad DESC);
CREATE INDEX idx_match_candidatos_disponibilidad ON match_candidatos(disponibilidad);

-- ═══════════════════════ LEDGER ═══════════════════════
CREATE INDEX idx_ledger_profile ON ledger_events(investor_profile_id);
CREATE INDEX idx_ledger_sequence ON ledger_events(sequence_number);
CREATE INDEX idx_ledger_event_type ON ledger_events(event_type);
CREATE INDEX idx_ledger_actor ON ledger_events(actor_id, actor_type);
CREATE INDEX idx_ledger_created ON ledger_events(created_at DESC);
-- Compuesto para verificación de integridad (el endpoint /verify lo necesita)
CREATE INDEX idx_ledger_profile_seq ON ledger_events(investor_profile_id, sequence_number);
-- GIN para queries dentro del payload
CREATE INDEX idx_ledger_payload_gin ON ledger_events USING GIN(payload);
CREATE INDEX idx_dossier_profile ON dossiers_inversion(investor_profile_id);

-- ═══════════════════════ LEGAL AI ═══════════════════════
CREATE INDEX idx_chat_sessions_user ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_profile ON chat_sessions(investor_profile_id);
CREATE INDEX idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_visado ON chat_messages(requiere_visado_humano) WHERE requiere_visado_humano = TRUE;
CREATE INDEX idx_chat_messages_agente ON chat_messages(agente_activado);
CREATE INDEX idx_visado_tickets_session ON visado_humano_tickets(session_id);
CREATE INDEX idx_visado_tickets_pendiente ON visado_humano_tickets(asignado_a) WHERE resuelto_at IS NULL;

-- ═══════════════════════ ZEEP INGESTION ═══════════════════════
-- Full-text search en razón social (GIN tsvector)
CREATE INDEX idx_companies_razon_social_fts ON companies
    USING GIN(to_tsvector('spanish', razon_social));
CREATE INDEX idx_companies_estado ON companies(estado_sunarp);
CREATE INDEX idx_companies_ciiu ON companies(ciiu_principal);
CREATE INDEX idx_companies_sector ON companies(sector_interno);
CREATE INDEX idx_companies_tamano ON companies(tamano_empresa);
CREATE INDEX idx_companies_trust ON companies(trust_score DESC NULLS LAST);
-- GiST para búsquedas geoespaciales de proveedores cercanos al puerto
CREATE INDEX idx_companies_geo ON companies USING GIST(coordenadas);
-- GIN para queries en directorio y cargas
CREATE INDEX idx_companies_directorio_gin ON companies USING GIN(directorio);
-- HNSW para búsqueda vectorial en structured_opportunities (pgvector)
CREATE INDEX idx_opportunities_embedding ON structured_opportunities
    USING HNSW (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);
CREATE INDEX idx_opportunities_tipo ON structured_opportunities(tipo);
CREATE INDEX idx_opportunities_fecha ON structured_opportunities(fecha_publicacion DESC);
CREATE INDEX idx_extracted_docs_source ON extracted_documents(source_url_id);
CREATE INDEX idx_extracted_docs_estado ON extracted_documents(estado);
CREATE INDEX idx_sync_logs_tipo ON sync_logs(tipo_sync, iniciado_at DESC);

-- ═══════════════════════ ANALYTICS / PADRONRUC ═══════════════════════
CREATE INDEX idx_padron_ruc_estado ON padron_ruc_staging(estado_contribuyente);
CREATE INDEX idx_padron_ruc_condicion ON padron_ruc_staging(condicion_contribuyente);
CREATE INDEX idx_padron_ruc_ciiu ON padron_ruc_staging(ciiu_principal);
CREATE INDEX idx_padron_ruc_ubigeo ON padron_ruc_staging(ubigeo);
-- Full-text para búsqueda de empresas en PadronRUC
CREATE INDEX idx_padron_ruc_rs_fts ON padron_ruc_staging
    USING GIN(to_tsvector('spanish', razon_social));
```

---

## 5. Triggers y Políticas de Seguridad (RLS) <a name="triggers"></a>

### Trigger: Inmutabilidad del Ledger

```sql
-- Función que lanza excepción ante cualquier intento de modificar o borrar un ledger_event
CREATE OR REPLACE FUNCTION prevent_ledger_mutation()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        RAISE EXCEPTION 'LEDGER_IMMUTABLE: Los registros del Ledger no pueden ser modificados. '
            'Evento afectado: % (sequence: %)', OLD.id, OLD.sequence_number
            USING ERRCODE = 'restrict_violation';
    ELSIF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'LEDGER_IMMUTABLE: Los registros del Ledger no pueden ser eliminados. '
            'Evento afectado: % (sequence: %)', OLD.id, OLD.sequence_number
            USING ERRCODE = 'restrict_violation';
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_ledger_update
    BEFORE UPDATE ON ledger_events
    FOR EACH ROW EXECUTE FUNCTION prevent_ledger_mutation();

CREATE TRIGGER trg_prevent_ledger_delete
    BEFORE DELETE ON ledger_events
    FOR EACH ROW EXECUTE FUNCTION prevent_ledger_mutation();
```

### Trigger: Actualización automática de `updated_at`

```sql
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar a todas las tablas con updated_at
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_investor_profiles_updated_at
    BEFORE UPDATE ON investor_profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_companies_updated_at
    BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_chat_sessions_updated_at
    BEFORE UPDATE ON chat_sessions FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_engineers_cip_updated_at
    BEFORE UPDATE ON engineers_cip FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_lawyers_cal_updated_at
    BEFORE UPDATE ON lawyers_cal FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_reuniones_updated_at
    BEFORE UPDATE ON reuniones FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

### Trigger: Actualizar stats de companies cuando se selecciona en match

```sql
CREATE OR REPLACE FUNCTION update_company_match_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Cuando un candidato del tipo proveedor_local es seleccionado y la reunión es confirmada
    IF NEW.reunion_confirmada_at IS NOT NULL AND OLD.reunion_confirmada_at IS NULL THEN
        UPDATE companies
        SET
            veces_seleccionada_match = veces_seleccionada_match + 1,
            activa_en_zeep = TRUE
        WHERE ruc = NEW.candidato_ref_id::TEXT;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_company_match_stats
    AFTER UPDATE ON match_candidatos
    FOR EACH ROW
    WHEN (NEW.reunion_confirmada_at IS NOT NULL AND OLD.reunion_confirmada_at IS NULL)
    EXECUTE FUNCTION update_company_match_stats();
```

### Row Level Security (RLS)

```sql
-- Activar RLS en ledger_events (solo lectura para usuarios; escritura solo para la app)
ALTER TABLE ledger_events ENABLE ROW LEVEL SECURITY;

-- Solo el rol de la aplicación (app_user) puede insertar; ningún rol puede UPDATE/DELETE
CREATE POLICY ledger_insert_only ON ledger_events
    FOR INSERT TO app_user
    WITH CHECK (TRUE);

CREATE POLICY ledger_select ON ledger_events
    FOR SELECT TO app_user, readonly_user
    USING (TRUE);

-- Los inversores solo ven sus propios perfiles
ALTER TABLE investor_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY investor_profiles_own ON investor_profiles
    FOR ALL TO app_user
    USING (user_id = current_setting('app.current_user_id')::UUID
        OR current_setting('app.current_user_role') IN ('operador_zeep', 'admin'));
```

---

## 6. Secuencias <a name="sequences"></a>

```sql
-- Secuencia global para sequence_number del Ledger
-- Es global (no por profile_id) para simplificar el order monotónico y la verificación
CREATE SEQUENCE ledger_global_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    NO CYCLE
    CACHE 1;

-- Secuencia para versiones del Dossier por perfil (manejada por aplicación con SELECT MAX + 1)
-- No se define como secuencia de BD; la versión se calcula en LedgerService
```

---

## 7. ChromaDB — Colecciones del Agente Legal RAG <a name="chromadb"></a>

ChromaDB almacena los embeddings de los documentos normativos. Cada colección tiene su propio índice HNSW. Los metadatos permiten filtrar por fecha de vigencia y estado de derogación antes de entregarlos al Agente Auditor.

### Esquema de Metadatos por Chunk (común a todas las colecciones)

```python
# Metadatos mínimos requeridos en CADA chunk de TODAS las colecciones
ChunkMetadata = {
    "fuente":           str,   # URL o nombre del archivo origen
    "norma":            str,   # "Ley N° 32449" | "Resolución Ministerial 001-2024-MINCETUR"
    "articulo":         str,   # "Art. 15, Inciso 2" | "" si no aplica
    "titulo_seccion":   str,   # "Capítulo III - Beneficios Tributarios"
    "fecha_publicacion": str,  # ISO 8601: "2024-07-01"
    "fecha_vigencia":   str,   # ISO 8601: "2024-07-15" (puede diferir de publicación)
    "derogado":         bool,  # True si fue reemplazado por norma posterior
    "norma_derogatoria": str,  # Norma que la derogó (si derogado=True)
    "coleccion":        str,   # Nombre de la colección de origen
    "chunk_index":      int,   # Índice del chunk dentro del documento
    "total_chunks":     int,   # Total de chunks del documento
    "idioma":           str,   # "es" (todos los documentos fuente son en español)
}
```

### Colecciones

```
Colección: ley_zeep_32449
├── Descripción: Texto completo de la Ley N° 32449 y su reglamento
├── Fuente: El Peruano (publicación oficial) + MINCETUR
├── Chunk size: 512 tokens, overlap 64
├── Embedding dim: 1536 (text-embedding-3-small) | 768 (nomic-embed-text)
├── Política de actualización: INMUTABLE salvo nueva versión de ley (versionado)
└── Documentos estimados: 1 ley + 1 reglamento ≈ 800-1200 chunks

Colección: resoluciones_mincetur
├── Descripción: Resoluciones ministeriales sobre ZEEP, zonas francas y comercio exterior
├── Fuente: Portal web MINCETUR + El Peruano
├── Chunk size: 512 tokens, overlap 64
├── Política de actualización: Semanal (APScheduler)
└── Documentos estimados: ~50 resoluciones activas ≈ 5,000-8,000 chunks

Colección: normas_el_peruano
├── Descripción: Decretos, resoluciones y normas publicadas en El Peruano relacionadas con ZEEP
├── Fuente: El Peruano scraping (filtrado por keywords: ZEEP, Chancay, inversión, zona económica)
├── Chunk size: 512 tokens, overlap 64
├── Política de actualización: Diario (cron 03:00 AM UTC)
├── Metadatos adicionales: {"seccion": "Normas Legales | Separata Especial"}
└── Documentos estimados: ~200 normas activas ≈ 20,000-30,000 chunks

Colección: normas_ambientales
├── Descripción: Regulaciones MINAM, SENACE para EIA, Certificado de Impacto Ambiental (Anexo 4)
├── Fuente: MINAM portal + SENACE + El Peruano (sección ambiental)
├── Chunk size: 512 tokens, overlap 64
├── Política de actualización: Semanal
├── Metadatos adicionales: {"categoria": "EIA | Anexo4 | Estandares | Fiscalizacion"}
└── Documentos estimados: ~100 documentos ≈ 10,000 chunks

Colección: normas_manufactura
├── Descripción: Estándares PRODUCE, normas INACAL, regulaciones para manufactura en zona especial
├── Fuente: PRODUCE portal + INACAL + El Peruano
├── Chunk size: 512 tokens, overlap 64
├── Política de actualización: Mensual
├── Metadatos adicionales: {"sector": "manufactura", "tipo": "INACAL | PRODUCE | NTP"}
└── Documentos estimados: ~80 documentos ≈ 8,000 chunks

Colección: normas_ckd
├── Descripción: Regulaciones aduaneras, aranceles CKD, normas SUNAT y MINCETUR para ensamblaje
├── Fuente: SUNAT (normas aduaneras) + MINCETUR + El Peruano
├── Chunk size: 512 tokens, overlap 64
├── Política de actualización: Mensual
├── Metadatos adicionales: {"sector": "ckd", "tipo": "ARANCEL | ADUANA | CERTIFICACION"}
└── Documentos estimados: ~60 documentos ≈ 6,000 chunks

Colección: normas_tech
├── Descripción: Régimen CITE, Ley de I+D+i (Ley 30309), fondos CONCYTEC, nube soberana, PCM
├── Fuente: CONCYTEC + PCM + El Peruano
├── Chunk size: 512 tokens, overlap 64
├── Política de actualización: Mensual
├── Metadatos adicionales: {"sector": "tech", "tipo": "IDI | CITE | CONCYTEC | CLOUD | STARTUP"}
└── Documentos estimados: ~40 documentos ≈ 4,000 chunks

Colección: jurisprudencia_zeep
├── Descripción: Precedentes administrativos, resoluciones APN, actos administrativos ZEEP
├── Fuente: APN (Autoridad Portuaria Nacional) + resoluciones MINCETUR de casos
├── Chunk size: 512 tokens, overlap 64
├── Política de actualización: Trimestral
├── Metadatos adicionales: {"tipo": "PRECEDENTE | RESOLUCION_APN | ACTO_ADMIN", "caso_id": str}
└── Documentos estimados: ~30 documentos ≈ 3,000 chunks
```

### Parámetros de Búsqueda (ChromaDB)

```python
# Configuración del índice HNSW por colección
HNSW_CONFIG = {
    "hnsw:space": "cosine",       # distancia coseno para similitud semántica
    "hnsw:M": 16,                 # número de conexiones por nodo
    "hnsw:ef_construction": 200,  # calidad del índice (mayor = más lento pero más preciso)
    "hnsw:ef": 100,               # calidad de búsqueda en runtime
}

# Query típica del Agente Legal
results = collection.query(
    query_embeddings=[embedding_consulta],
    n_results=5,                              # Top-K chunks
    where={
        "derogado": False,                    # Solo normas vigentes
        "$or": [
            {"coleccion": "ley_zeep_32449"},
            {"coleccion": "resoluciones_mincetur"}
        ]
    },
    include=["documents", "metadatas", "distances"]
)
```

### Volumen Total Estimado

| Colección | Chunks aprox. | Tamaño vector (bytes) | Memoria estimada |
|---|---|---|---|
| ley_zeep_32449 | 1,200 | 6,144 (1536 × 4 bytes) | ~7 MB |
| resoluciones_mincetur | 8,000 | 6,144 | ~49 MB |
| normas_el_peruano | 30,000 | 6,144 | ~184 MB |
| normas_ambientales | 10,000 | 6,144 | ~61 MB |
| normas_manufactura | 8,000 | 6,144 | ~49 MB |
| normas_ckd | 6,000 | 6,144 | ~37 MB |
| normas_tech | 4,000 | 6,144 | ~24 MB |
| jurisprudencia_zeep | 3,000 | 6,144 | ~18 MB |
| **Total** | **~70,000** | — | **~430 MB** |

Volumen manejable para ChromaDB local en Docker con 2 GB de RAM asignados.

---

---

## 8. Profesionales — Ingenieros CIP y Abogados CAL <a name="professionals"></a>

Estas tablas almacenan los perfiles de los profesionales validados institucionalmente que participan en el Matchmaking (spec04). Combinan atributos estructurados (habilitación, especialidad, ubicación) con campos JSONB para el CV enriquecido y datos de la tarjeta marketplace.

```sql
-- ─────────────────────────────────────────────────────────────────────────────
-- INGENIEROS CIP
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE engineers_cip (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID REFERENCES users(id),      -- NULL si aún no registrado en plataforma

    -- Identificación institucional
    numero_cip              VARCHAR(20) NOT NULL UNIQUE,
    dni                     VARCHAR(8),
    nombre_completo         VARCHAR(300) NOT NULL,
    apellidos               VARCHAR(200),

    -- Habilitación (validada en tiempo real contra API CIP)
    habilitacion_vigente    BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_habilitacion      DATE,
    fecha_vencimiento_hab   DATE,
    last_cip_check          TIMESTAMPTZ,

    -- Especialidades
    especialidad_principal  VARCHAR(200) NOT NULL,
    /*
    Ejemplos relevantes para ZEEP:
    Mecánica Industrial | Ingeniería de Procesos | Automatización y Robótica |
    Ingeniería Civil | Logística y Cadena de Suministro | Electrónica e Instrumentación |
    Ingeniería Ambiental | Ingeniería de Sistemas | Ingeniería Industrial
    */
    especialidades          JSONB NOT NULL DEFAULT '[]',    -- ["Mecánica industrial", "CNC"]
    experiencia_zeep        BOOLEAN NOT NULL DEFAULT FALSE,
    anos_experiencia        SMALLINT,

    -- Sector preferido (para scoring en spec04)
    sector_preferido        sector_type,                    -- manufactura | ckd | tech
    ciiu_sectores           VARCHAR(10)[] DEFAULT '{}',    -- Códigos CIIU de experiencia

    -- Localización
    region                  VARCHAR(100),
    ciudad                  VARCHAR(100),
    ubigeo                  VARCHAR(6),
    coordenadas             POINT,
    distancia_puerto_chancay_km NUMERIC(8, 2),

    -- Idiomas (crítico para inversores chinos e internacionales)
    idiomas                 VARCHAR(5)[] NOT NULL DEFAULT '{es}',  -- ['es', 'en', 'zh']
    nivel_mandarin          VARCHAR(20),                   -- nativo | fluido | basico | ninguno
    nivel_ingles            VARCHAR(20),

    -- Disponibilidad y modalidad
    disponibilidad          disponibilidad_estado NOT NULL DEFAULT 'disponible',
    modalidad_trabajo       VARCHAR(20) DEFAULT 'mixto',   -- presencial | virtual | mixto
    tarifa_hora_usd         NUMERIC(8, 2),
    disponible_desde        DATE,

    -- ── CV ENRIQUECIDO (del CV subido o scraping de LinkedIn/CIP) ──────────
    cv_data                 JSONB NOT NULL DEFAULT '{}',
    /*
    {
      "educacion": [
          {"titulo": str, "especialidad": str, "institucion": str, "anio_egreso": int, "posgrado": bool}
      ],
      "experiencia_laboral": [
          {"empresa": str, "cargo": str, "periodo_inicio": str, "periodo_fin": str,
           "descripcion": str, "sector": str, "logros": [str]}
      ],
      "proyectos_destacados": [
          {"nombre": str, "cliente": str, "descripcion": str, "anio": int, "monto_usd": float}
      ],
      "certificaciones": [
          {"nombre": str, "organismo": str, "anio": int, "vigente": bool}
      ],
      "publicaciones": [str],
      "herramientas_software": [str],
      "areas_especializacion": [str],
      "resumen_profesional": str
    }
    */

    -- ── TARJETA MARKETPLACE ──────────────────────────────────────────────────
    foto_url                TEXT,
    descripcion_publica     TEXT,                          -- Bio corta (~200 chars)
    linkedin_url            VARCHAR(500),
    sitio_web               VARCHAR(500),
    video_presentacion_url  TEXT,                          -- Video pitch opcional

    -- Métricas de la plataforma
    rating_promedio         NUMERIC(3, 2) CHECK (rating_promedio BETWEEN 1 AND 5),
    total_reviews           INTEGER DEFAULT 0,
    reuniones_completadas   INTEGER DEFAULT 0,
    tasa_confirmacion_pct   NUMERIC(5, 2),                 -- % de reuniones confirmadas vs solicitadas

    -- Control
    marketplace_visible     BOOLEAN NOT NULL DEFAULT FALSE,
    validado_plataforma     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- ABOGADOS CAL
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE lawyers_cal (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID REFERENCES users(id),

    -- Identificación institucional
    numero_cal              VARCHAR(20) NOT NULL UNIQUE,
    dni                     VARCHAR(8),
    nombre_completo         VARCHAR(300) NOT NULL,
    apellidos               VARCHAR(200),

    -- Habilitación (validada contra API CAL)
    habilitacion_vigente    BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_habilitacion      DATE,
    fecha_vencimiento_hab   DATE,
    last_cal_check          TIMESTAMPTZ,

    -- Especialización
    especializacion_principal VARCHAR(200) NOT NULL,
    /*
    Áreas relevantes para ZEEP:
    Derecho Corporativo ZEEP | Derecho Aduanero y Comercio Exterior |
    Derecho Ambiental e Industrial | Propiedad Intelectual e I+D+i |
    Derecho Laboral Internacional | Derecho Tributario y Fiscal |
    Contratos Internacionales | Inversión Extranjera
    */
    especializaciones       JSONB NOT NULL DEFAULT '[]',
    certificacion_zeep      BOOLEAN NOT NULL DEFAULT FALSE,  -- Cert. específica en Ley 32449
    anos_experiencia        SMALLINT,

    -- Sector de experiencia (para scoring en spec04)
    sectores_experiencia    sector_type[],                  -- manufactura | ckd | tech
    experiencia_zeep        BOOLEAN NOT NULL DEFAULT FALSE,

    -- Localización
    region                  VARCHAR(100),
    ciudad                  VARCHAR(100),
    ubigeo                  VARCHAR(6),
    distancia_puerto_chancay_km NUMERIC(8, 2),

    -- Idiomas (especialmente crítico: ZH para inversores chinos)
    idiomas                 VARCHAR(5)[] NOT NULL DEFAULT '{es}',
    nivel_mandarin          VARCHAR(20),
    nivel_ingles            VARCHAR(20),
    otros_idiomas           JSONB DEFAULT '[]',            -- [{"idioma": "francés", "nivel": "básico"}]

    -- Disponibilidad
    disponibilidad          disponibilidad_estado NOT NULL DEFAULT 'disponible',
    modalidad_trabajo       VARCHAR(20) DEFAULT 'mixto',
    tarifa_hora_usd         NUMERIC(8, 2),

    -- ── CV / PERFIL ENRIQUECIDO ──────────────────────────────────────────────
    cv_data                 JSONB NOT NULL DEFAULT '{}',
    /*
    {
      "educacion": [
          {"titulo": str, "especialidad": str, "institucion": str, "anio_egreso": int,
           "pais": str, "posgrado": bool}
      ],
      "experiencia_laboral": [
          {"estudio_firma": str, "cargo": str, "periodo_inicio": str, "periodo_fin": str,
           "descripcion": str, "casos_destacados": [str]}
      ],
      "areas_practica": [str],
      "casos_relevantes": [
          {"descripcion": str, "resultado": str, "anio": int, "confidencial": bool}
      ],
      "certificaciones": [
          {"nombre": str, "organismo": str, "anio": int, "vigente": bool}
      ],
      "publicaciones_academicas": [str],
      "membresias": [str],                    -- ["IBA", "IPBA", "Cámara de Comercio Peruano-China"]
      "resumen_profesional": str
    }
    */

    -- ── TARJETA MARKETPLACE ──────────────────────────────────────────────────
    foto_url                TEXT,
    descripcion_publica     TEXT,
    linkedin_url            VARCHAR(500),
    sitio_web_estudio       VARCHAR(500),

    -- Métricas de la plataforma
    rating_promedio         NUMERIC(3, 2) CHECK (rating_promedio BETWEEN 1 AND 5),
    total_reviews           INTEGER DEFAULT 0,
    reuniones_completadas   INTEGER DEFAULT 0,
    tasa_confirmacion_pct   NUMERIC(5, 2),

    -- Control
    marketplace_visible     BOOLEAN NOT NULL DEFAULT FALSE,
    validado_plataforma     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reviews de profesionales (post-reunión, del inversor)
CREATE TABLE professional_reviews (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profesional_tipo    VARCHAR(20) NOT NULL,              -- engineer_cip | lawyer_cal
    profesional_id      UUID NOT NULL,
    investor_profile_id UUID NOT NULL REFERENCES investor_profiles(id),
    reunion_id          UUID NOT NULL,                     -- FK a reuniones (tabla siguiente)
    rating              SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comentario          TEXT,
    atributos           JSONB DEFAULT '{}',
    /*
    {
      "puntualidad": 1-5,
      "claridad_comunicacion": 1-5,
      "conocimiento_zeep": 1-5,
      "manejo_idioma": 1-5
    }
    */
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 9. Reuniones <a name="reuniones"></a>

Tabla dedicada para la agenda y gestión del ciclo de vida de cada reunión entre el inversor y un profesional o proveedor. Conecta con `match_candidatos` (origen del match) y con el Ledger (eventos `REUNION_*` y `MINUTA_REGISTRADA`).

```sql
CREATE TYPE reunion_modalidad AS ENUM ('virtual', 'presencial', 'hibrida');
CREATE TYPE reunion_estado AS ENUM (
    'pendiente',        -- Solicitada, esperando confirmación del profesional
    'confirmada',       -- Profesional confirmó fecha y hora
    'realizada',        -- Reunión completada; se puede registrar minuta
    'cancelada',        -- Cancelada por cualquiera de las partes
    'reprogramada',     -- Se canceló y se creó una nueva reunión sustituta
    'no_asistio'        -- Una parte no asistió
);

CREATE TABLE reuniones (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Origen del match
    investor_profile_id     UUID NOT NULL REFERENCES investor_profiles(id),
    match_candidato_id      UUID REFERENCES match_candidatos(id),

    -- Participantes
    inversor_user_id        UUID NOT NULL REFERENCES users(id),
    profesional_tipo        VARCHAR(20) NOT NULL,           -- engineer_cip | lawyer_cal | proveedor_local
    profesional_id          UUID,                           -- FK a engineers_cip.id / lawyers_cal.id / companies.ruc (como texto)
    profesional_nombre      VARCHAR(300) NOT NULL,          -- Desnormalizado para display rápido

    -- ── PROGRAMACIÓN ────────────────────────────────────────────────────────
    fecha_propuesta         TIMESTAMPTZ NOT NULL,           -- Fecha/hora propuesta por el inversor
    duracion_minutos        SMALLINT NOT NULL DEFAULT 60,
    modalidad               reunion_modalidad NOT NULL DEFAULT 'virtual',
    zona_horaria            VARCHAR(50) DEFAULT 'America/Lima',

    -- Ubicación o enlace virtual
    link_virtual            TEXT,                           -- Zoom/Meet/Teams URL
    direccion_fisica        TEXT,                           -- Si es presencial
    ubicacion_notas         TEXT,                           -- Instrucciones adicionales

    -- ── ESTADOS Y FECHAS CLAVE ───────────────────────────────────────────────
    estado                  reunion_estado NOT NULL DEFAULT 'pendiente',
    confirmada_at           TIMESTAMPTZ,
    realizada_at            TIMESTAMPTZ,
    cancelada_at            TIMESTAMPTZ,
    motivo_cancelacion      TEXT,
    reprogramada_en_id      UUID REFERENCES reuniones(id), -- Si se reprogramó, apunta a la nueva

    -- ── CONTENIDO DE LA REUNIÓN ──────────────────────────────────────────────
    agenda_previa           TEXT,                          -- Temas a tratar enviados antes de la reunión
    documentos_agenda       JSONB DEFAULT '[]',
    /*
    [{"nombre": str, "url": str, "tipo": str}]  -- Documentos compartidos en la agenda
    */

    -- ── MINUTA POST-REUNIÓN ──────────────────────────────────────────────────
    -- Completada por el Operador ZEEP o el profesional al marcar como REALIZADA
    minuta_registrada       BOOLEAN NOT NULL DEFAULT FALSE,
    minuta_participantes    JSONB DEFAULT '[]',
    /*
    [{"nombre": str, "rol": str, "email": str}]
    */
    minuta_acuerdos         JSONB DEFAULT '[]',            -- [str] — lista de acuerdos
    minuta_proximos_pasos   JSONB DEFAULT '[]',
    /*
    [{"descripcion": str, "responsable": str, "fecha_limite": str}]
    */
    minuta_documentos_comprometidos JSONB DEFAULT '[]',
    /*
    [{"documento": str, "responsable": str, "fecha_entrega": str}]
    */
    minuta_validada_por     UUID REFERENCES users(id),     -- Operador ZEEP o profesional que valida
    minuta_registrada_at    TIMESTAMPTZ,

    -- Referencia al evento del Ledger
    ledger_event_id         UUID,                          -- FK a ledger_events.id (MINUTA_REGISTRADA)

    -- ── FEEDBACK POST-REUNIÓN ────────────────────────────────────────────────
    notas_privadas_inversor TEXT,                          -- Notas privadas del inversor (no visibles)

    -- ── CONTROL ─────────────────────────────────────────────────────────────
    fase_roadmap            fase_nombre,                   -- Fase del roadmap en la que ocurre
    creada_por              UUID NOT NULL REFERENCES users(id),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Slots de disponibilidad propuestos (para negociación de horario)
CREATE TABLE reunion_slots (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reunion_id          UUID NOT NULL REFERENCES reuniones(id) ON DELETE CASCADE,
    fecha_hora          TIMESTAMPTZ NOT NULL,
    duracion_minutos    SMALLINT NOT NULL DEFAULT 60,
    propuesto_por       UUID NOT NULL REFERENCES users(id),
    aceptado            BOOLEAN,                           -- NULL=pendiente, TRUE=aceptado, FALSE=rechazado
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (reunion_id, fecha_hora)
);
```

---

### Índices — Profesionales y Reuniones

```sql
-- ═══════════════════════ ENGINEERS CIP ═══════════════════════
CREATE INDEX idx_engineers_numero_cip ON engineers_cip(numero_cip);
CREATE INDEX idx_engineers_user ON engineers_cip(user_id);
CREATE INDEX idx_engineers_habilitacion ON engineers_cip(habilitacion_vigente);
CREATE INDEX idx_engineers_especialidad ON engineers_cip(especialidad_principal);
CREATE INDEX idx_engineers_sector ON engineers_cip(sector_preferido);
CREATE INDEX idx_engineers_disponibilidad ON engineers_cip(disponibilidad);
CREATE INDEX idx_engineers_idiomas ON engineers_cip USING GIN(idiomas);
CREATE INDEX idx_engineers_especialidades_gin ON engineers_cip USING GIN(especialidades);
CREATE INDEX idx_engineers_cv_gin ON engineers_cip USING GIN(cv_data);
CREATE INDEX idx_engineers_geo ON engineers_cip USING GIST(coordenadas);
-- Full-text sobre nombre para búsqueda directa
CREATE INDEX idx_engineers_nombre_fts ON engineers_cip
    USING GIN(to_tsvector('spanish', nombre_completo || ' ' || apellidos));
CREATE INDEX idx_engineers_marketplace ON engineers_cip(marketplace_visible, habilitacion_vigente)
    WHERE marketplace_visible = TRUE;

-- ═══════════════════════ LAWYERS CAL ═══════════════════════
CREATE INDEX idx_lawyers_numero_cal ON lawyers_cal(numero_cal);
CREATE INDEX idx_lawyers_user ON lawyers_cal(user_id);
CREATE INDEX idx_lawyers_habilitacion ON lawyers_cal(habilitacion_vigente);
CREATE INDEX idx_lawyers_especializacion ON lawyers_cal(especializacion_principal);
CREATE INDEX idx_lawyers_cert_zeep ON lawyers_cal(certificacion_zeep);
CREATE INDEX idx_lawyers_disponibilidad ON lawyers_cal(disponibilidad);
CREATE INDEX idx_lawyers_idiomas ON lawyers_cal USING GIN(idiomas);
CREATE INDEX idx_lawyers_especializaciones_gin ON lawyers_cal USING GIN(especializaciones);
CREATE INDEX idx_lawyers_cv_gin ON lawyers_cal USING GIN(cv_data);
CREATE INDEX idx_lawyers_nombre_fts ON lawyers_cal
    USING GIN(to_tsvector('spanish', nombre_completo || ' ' || apellidos));
CREATE INDEX idx_lawyers_marketplace ON lawyers_cal(marketplace_visible, habilitacion_vigente)
    WHERE marketplace_visible = TRUE;

-- ═══════════════════════ COMPANIES (nuevos campos) ═══════════════════════
CREATE INDEX idx_companies_marketplace ON companies(marketplace_visible)
    WHERE marketplace_visible = TRUE;
CREATE INDEX idx_companies_web_enrichment_gin ON companies USING GIN(web_enrichment_data);
CREATE INDEX idx_companies_servicios ON companies USING GIN(servicios_principales);
CREATE INDEX idx_companies_enrichment_at ON companies(web_enrichment_at DESC NULLS LAST);

-- ═══════════════════════ REUNIONES ═══════════════════════
CREATE INDEX idx_reuniones_profile ON reuniones(investor_profile_id);
CREATE INDEX idx_reuniones_candidato ON reuniones(match_candidato_id);
CREATE INDEX idx_reuniones_inversor ON reuniones(inversor_user_id);
CREATE INDEX idx_reuniones_profesional ON reuniones(profesional_tipo, profesional_id);
CREATE INDEX idx_reuniones_estado ON reuniones(estado);
CREATE INDEX idx_reuniones_fecha ON reuniones(fecha_propuesta);
CREATE INDEX idx_reuniones_pendientes ON reuniones(estado, fecha_propuesta)
    WHERE estado IN ('pendiente', 'confirmada');
CREATE INDEX idx_reuniones_minuta ON reuniones(minuta_registrada)
    WHERE minuta_registrada = FALSE AND estado = 'realizada';
CREATE INDEX idx_reuniones_fase ON reuniones(fase_roadmap);
CREATE INDEX idx_reunion_slots_reunion ON reunion_slots(reunion_id);
CREATE INDEX idx_reunion_slots_pendientes ON reunion_slots(reunion_id, aceptado)
    WHERE aceptado IS NULL;

-- ═══════════════════════ REVIEWS ═══════════════════════
CREATE INDEX idx_reviews_profesional ON professional_reviews(profesional_tipo, profesional_id);
CREATE INDEX idx_reviews_profile ON professional_reviews(investor_profile_id);
```

---

## Resumen de Extensiones PostgreSQL Requeridas

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "vector";     -- pgvector para structured_opportunities
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- Mejora de búsqueda full-text difusa
CREATE EXTENSION IF NOT EXISTS "unaccent";   -- Normalización de acentos en FTS español
```
