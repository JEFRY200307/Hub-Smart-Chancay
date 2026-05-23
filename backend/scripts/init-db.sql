-- =============================================================================
-- COMEX.AI / Sovereign Gateway — Esquema PostgreSQL completo v1.1
-- Referencia: docs/DB_SCHEMA.md | Migracion Alembic: 001
-- Motor: Supabase (PostgreSQL 15+)
--
-- INSTRUCCIONES:
--   1. Ejecutar en Supabase SQL Editor sobre proyecto VACIO o nuevo.
--   2. Si ya corriste `alembic upgrade head`, NO ejecutes este script completo.
--   3. Extensiones vector/pg_trgm: habilitar en Dashboard > Database > Extensions si fallan.
--   4. Despues del esquema, ejecutar: backend/scripts/seed_cip_cal_padron.sql
-- =============================================================================
--
-- TABLAS (28 + alembic_version):
--   users, refresh_tokens, email_verification_tokens
--   simulation_records, investor_profiles, documentos_adjuntos
--   match_results, match_candidatos
--   engineers_cip, lawyers_cal, reuniones, reunion_slots, professional_reviews
--   ledger_events, dossiers_inversion
--   chat_sessions, chat_messages, visado_humano_tickets
--   companies, source_urls, extracted_documents, structured_opportunities, sync_logs
--   padron_ruc_staging, weight_configs, rag_prompt_configs
--
-- ENUMS: user_role, sector_type, clasificacion_elegibilidad, profile_estado,
--   fase_nombre, fase_estado, tipo_documento, categoria_match, disponibilidad_estado,
--   validacion_estado, ledger_event_type, actor_type, message_role, agente_activado_type,
--   tamano_mipyme, sector_interno, tipo_contribuyente, scraping_estado, fuente_empresa,
--   reunion_modalidad, reunion_estado
--
-- ChromaDB (RAG) es externo — ver docs/DB_SCHEMA.md seccion 7
-- =============================================================================

BEGIN;

CREATE TABLE alembic_version (
    version_num VARCHAR(32) NOT NULL, 
    CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
);

-- Running upgrade  -> 001

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE EXTENSION IF NOT EXISTS "vector";

CREATE EXTENSION IF NOT EXISTS "pg_trgm";

CREATE EXTENSION IF NOT EXISTS "unaccent";

CREATE TYPE user_role AS ENUM (
            'inversor', 'profesional', 'operador_zeep', 'admin'
        );

CREATE TYPE sector_type AS ENUM ('manufactura', 'ckd', 'tech');

CREATE TYPE clasificacion_elegibilidad AS ENUM (
            'elegible', 'viable_con_ajustes', 'no_elegible'
        );

CREATE TYPE profile_estado AS ENUM ('en_progreso', 'completado', 'archivado');

CREATE TYPE fase_nombre AS ENUM (
            'elegibilidad', 'validacion_legal', 'contratacion', 'operacion'
        );

CREATE TYPE fase_estado AS ENUM ('completado', 'en_progreso', 'pendiente');

CREATE TYPE tipo_documento AS ENUM (
            'carta_intencion', 'evaluacion_ambiental', 'certificacion_tecnica',
            'registro_empresa_origen', 'plan_idi', 'otro'
        );

CREATE TYPE categoria_match AS ENUM (
            'ingeniero_cip', 'abogado_cal', 'proveedor_local'
        );

CREATE TYPE disponibilidad_estado AS ENUM ('disponible', 'parcial', 'ocupado');

CREATE TYPE validacion_estado AS ENUM (
            'vigente', 'vencida', 'en_proceso', 'requiere_verificacion'
        );

CREATE TYPE ledger_event_type AS ENUM (
            'SIMULACION_COMPLETADA','PERFIL_CREADO','PERFIL_ACTUALIZADO','DOCUMENTO_ADJUNTADO',
            'VALIDACION_SUNARP_INICIADA','VALIDACION_SUNARP_COMPLETADA',
            'VALIDACION_CIP_INICIADA','VALIDACION_CIP_COMPLETADA',
            'VALIDACION_CAL_INICIADA','VALIDACION_CAL_COMPLETADA',
            'ALERTA_DOCUMENTO_FALTANTE',
            'MATCH_GENERADO','REUNION_SOLICITADA','REUNION_CONFIRMADA',
            'REUNION_COMPLETADA','MINUTA_REGISTRADA','CANDIDATO_RECHAZADO',
            'PROPUESTA_RECIBIDA','PROPUESTA_ACEPTADA','PROPUESTA_RECHAZADA',
            'CONTRATO_FIRMADO','DOSSIER_GENERADO','DOSSIER_APROBADO_OPERADOR','OPERACION_INICIADA'
        );

CREATE TYPE actor_type AS ENUM (
            'inversor', 'profesional', 'agente_ia', 'sistema', 'operador_zeep'
        );

CREATE TYPE message_role AS ENUM ('user', 'assistant', 'system');

CREATE TYPE agente_activado_type AS ENUM (
            'legal', 'tecnico', 'financiero', 'idi', 'matchmaker', 'auditor'
        );

CREATE TYPE tamano_mipyme AS ENUM ('micro', 'pequena', 'mediana', 'grande');

CREATE TYPE sector_interno AS ENUM (
            'manufactura', 'ckd', 'tech', 'logistica', 'construccion', 'otros'
        );

CREATE TYPE tipo_contribuyente AS ENUM (
            'PERSONA_NATURAL', 'PERSONA_JURIDICA', 'SOCIEDAD_CONYUGAL', 'SUCESION_INDIVISA'
        );

CREATE TYPE scraping_estado AS ENUM (
            'pendiente', 'en_proceso', 'completado', 'fallido'
        );

CREATE TYPE fuente_empresa AS ENUM (
            'sunarp_scraping', 'bulk_historico', 'padron_ruc', 'manual'
        );

CREATE TYPE reunion_modalidad AS ENUM ('virtual', 'presencial', 'hibrida');

CREATE TYPE reunion_estado AS ENUM (
            'pendiente', 'confirmada', 'realizada', 'cancelada', 'reprogramada', 'no_asistio'
        );

CREATE SEQUENCE ledger_global_seq
            START WITH 1 INCREMENT BY 1
            NO MINVALUE NO MAXVALUE NO CYCLE CACHE 1;

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
            token       TEXT NOT NULL UNIQUE,
            user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            expires_at  TIMESTAMPTZ NOT NULL,
            revoked_at  TIMESTAMPTZ,
            ip_address  INET,
            user_agent  TEXT,
            created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

CREATE TABLE email_verification_tokens (
            id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            token_hash          TEXT NOT NULL,
            expires_at          TIMESTAMPTZ NOT NULL,
            intentos_fallidos   SMALLINT NOT NULL DEFAULT 0,
            used_at             TIMESTAMPTZ,
            created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

CREATE TABLE simulation_records (
            id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            session_id              UUID NOT NULL UNIQUE,
            user_id                 UUID REFERENCES users(id),
            sector                  sector_type NOT NULL,
            clasificacion           clasificacion_elegibilidad NOT NULL,
            monto_inversion_usd     NUMERIC(18, 2) NOT NULL,
            empleo_directo          INTEGER NOT NULL CHECK (empleo_directo >= 0),
            empleo_indirecto        INTEGER DEFAULT 0,
            porcentaje_cl           NUMERIC(5, 2) NOT NULL CHECK (porcentaje_cl BETWEEN 0 AND 100),
            tiempo_instalacion_meses INTEGER NOT NULL CHECK (tiempo_instalacion_meses > 0),
            pais_origen             VARCHAR(2) NOT NULL,
            exportacion_pct         NUMERIC(5, 2) DEFAULT 0,
            variables_sector        JSONB NOT NULL DEFAULT '{}',
            v_base                  NUMERIC(6, 4) NOT NULL,
            delta_cl                NUMERIC(6, 4) NOT NULL DEFAULT 0,
            delta_sector            NUMERIC(6, 4) NOT NULL DEFAULT 0,
            v_final                 NUMERIC(5, 2) NOT NULL,
            beneficio_cl_activo     BOOLEAN NOT NULL DEFAULT FALSE,
            proyeccion_fiscal       JSONB NOT NULL DEFAULT '{}',
            alertas                 JSONB NOT NULL DEFAULT '[]',
            recomendaciones_agente  JSONB NOT NULL DEFAULT '[]',
            ip_address              INET,
            created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

CREATE TABLE investor_profiles (
            id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            session_id                  UUID NOT NULL REFERENCES simulation_records(session_id),
            user_id                     UUID NOT NULL REFERENCES users(id),
            estado                      profile_estado NOT NULL DEFAULT 'en_progreso',
            empresa_razon_social        VARCHAR(500) NOT NULL,
            empresa_pais_origen         VARCHAR(2) NOT NULL,
            empresa_registro_extranjero VARCHAR(100),
            empresa_sector_ciiu         VARCHAR(10),
            empresa_capital_usd         NUMERIC(18, 2),
            rep_nombre                  VARCHAR(300),
            rep_documento_tipo          VARCHAR(20),
            rep_documento_num           VARCHAR(50),
            rep_cargo                   VARCHAR(100),
            proyecto_nombre             VARCHAR(500) NOT NULL,
            proyecto_descripcion        TEXT,
            proyecto_monto_usd          NUMERIC(18, 2) NOT NULL,
            proyecto_empleo_directo     INTEGER NOT NULL DEFAULT 0,
            proyecto_empleo_indirecto   INTEGER DEFAULT 0,
            proyecto_porcentaje_cl      NUMERIC(5, 2) NOT NULL DEFAULT 0,
            proyecto_fecha_inicio       DATE,
            proyecto_duracion_meses     INTEGER,
            proyecto_exportacion_pct    NUMERIC(5, 2) DEFAULT 0,
            sector                      sector_type NOT NULL,
            perfil_tecnico              JSONB NOT NULL DEFAULT '{}',
            roadmap                     JSONB NOT NULL DEFAULT '[]',
            completion_pct              SMALLINT DEFAULT 0 CHECK (completion_pct BETWEEN 0 AND 100),
            created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

CREATE TABLE documentos_adjuntos (
            id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            investor_profile_id UUID NOT NULL REFERENCES investor_profiles(id) ON DELETE CASCADE,
            tipo                tipo_documento NOT NULL,
            nombre_archivo      VARCHAR(500) NOT NULL,
            url_storage         TEXT NOT NULL,
            size_bytes          BIGINT,
            mime_type           VARCHAR(100),
            hash_sha256         VARCHAR(64),
            subido_por          UUID NOT NULL REFERENCES users(id),
            created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

CREATE TABLE match_results (
            id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            investor_profile_id UUID NOT NULL REFERENCES investor_profiles(id),
            categoria           categoria_match NOT NULL,
            score_promedio      NUMERIC(5, 4) NOT NULL,
            justificacion_agente TEXT,
            tokens_usados       INTEGER,
            latencia_ms         INTEGER,
            created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE (investor_profile_id, categoria)
        );

CREATE TABLE match_candidatos (
            id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            match_result_id         UUID NOT NULL REFERENCES match_results(id) ON DELETE CASCADE,
            ranking                 SMALLINT NOT NULL CHECK (ranking BETWEEN 1 AND 5),
            candidato_ref_id        UUID,
            candidato_nombre        VARCHAR(300) NOT NULL,
            candidato_org           VARCHAR(300),
            score_compatibilidad    NUMERIC(5, 4) NOT NULL,
            score_sector            NUMERIC(5, 4),
            score_geo               NUMERIC(5, 4),
            score_idioma            NUMERIC(5, 4),
            score_historial         NUMERIC(5, 4),
            score_validacion        NUMERIC(5, 4),
            especialidad_principal  VARCHAR(300),
            idiomas                 VARCHAR(10)[] DEFAULT '{}',
            disponibilidad          disponibilidad_estado NOT NULL DEFAULT 'disponible',
            validacion_institucional validacion_estado NOT NULL,
            validacion_at           TIMESTAMPTZ,
            justificacion           TEXT,
            reunion_solicitada      BOOLEAN DEFAULT FALSE,
            reunion_confirmada_at   TIMESTAMPTZ,
            UNIQUE (match_result_id, ranking)
        );

CREATE TABLE engineers_cip (
            id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id                 UUID REFERENCES users(id),
            numero_cip              VARCHAR(20) NOT NULL UNIQUE,
            dni                     VARCHAR(8),
            nombre_completo         VARCHAR(300) NOT NULL,
            apellidos               VARCHAR(200),
            habilitacion_vigente    BOOLEAN NOT NULL DEFAULT FALSE,
            fecha_habilitacion      DATE,
            fecha_vencimiento_hab   DATE,
            last_cip_check          TIMESTAMPTZ,
            especialidad_principal  VARCHAR(200) NOT NULL,
            especialidades          JSONB NOT NULL DEFAULT '[]',
            experiencia_zeep        BOOLEAN NOT NULL DEFAULT FALSE,
            anos_experiencia        SMALLINT,
            sector_preferido        sector_type,
            ciiu_sectores           VARCHAR(10)[] DEFAULT '{}',
            region                  VARCHAR(100),
            ciudad                  VARCHAR(100),
            ubigeo                  VARCHAR(6),
            coordenadas             POINT,
            distancia_puerto_chancay_km NUMERIC(8, 2),
            idiomas                 VARCHAR(5)[] NOT NULL DEFAULT '{es}',
            nivel_mandarin          VARCHAR(20),
            nivel_ingles            VARCHAR(20),
            disponibilidad          disponibilidad_estado NOT NULL DEFAULT 'disponible',
            modalidad_trabajo       VARCHAR(20) DEFAULT 'mixto',
            tarifa_hora_usd         NUMERIC(8, 2),
            disponible_desde        DATE,
            cv_data                 JSONB NOT NULL DEFAULT '{}',
            foto_url                TEXT,
            descripcion_publica     TEXT,
            linkedin_url            VARCHAR(500),
            sitio_web               VARCHAR(500),
            video_presentacion_url  TEXT,
            rating_promedio         NUMERIC(3, 2) CHECK (rating_promedio BETWEEN 1 AND 5),
            total_reviews           INTEGER DEFAULT 0,
            reuniones_completadas   INTEGER DEFAULT 0,
            tasa_confirmacion_pct   NUMERIC(5, 2),
            marketplace_visible     BOOLEAN NOT NULL DEFAULT FALSE,
            validado_plataforma     BOOLEAN NOT NULL DEFAULT FALSE,
            created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

CREATE TABLE lawyers_cal (
            id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id                 UUID REFERENCES users(id),
            numero_cal              VARCHAR(20) NOT NULL UNIQUE,
            dni                     VARCHAR(8),
            nombre_completo         VARCHAR(300) NOT NULL,
            apellidos               VARCHAR(200),
            habilitacion_vigente    BOOLEAN NOT NULL DEFAULT FALSE,
            fecha_habilitacion      DATE,
            fecha_vencimiento_hab   DATE,
            last_cal_check          TIMESTAMPTZ,
            especializacion_principal VARCHAR(200) NOT NULL,
            especializaciones       JSONB NOT NULL DEFAULT '[]',
            certificacion_zeep      BOOLEAN NOT NULL DEFAULT FALSE,
            anos_experiencia        SMALLINT,
            sectores_experiencia    sector_type[],
            experiencia_zeep        BOOLEAN NOT NULL DEFAULT FALSE,
            region                  VARCHAR(100),
            ciudad                  VARCHAR(100),
            ubigeo                  VARCHAR(6),
            distancia_puerto_chancay_km NUMERIC(8, 2),
            idiomas                 VARCHAR(5)[] NOT NULL DEFAULT '{es}',
            nivel_mandarin          VARCHAR(20),
            nivel_ingles            VARCHAR(20),
            otros_idiomas           JSONB DEFAULT '[]',
            disponibilidad          disponibilidad_estado NOT NULL DEFAULT 'disponible',
            modalidad_trabajo       VARCHAR(20) DEFAULT 'mixto',
            tarifa_hora_usd         NUMERIC(8, 2),
            cv_data                 JSONB NOT NULL DEFAULT '{}',
            foto_url                TEXT,
            descripcion_publica     TEXT,
            linkedin_url            VARCHAR(500),
            sitio_web_estudio       VARCHAR(500),
            rating_promedio         NUMERIC(3, 2) CHECK (rating_promedio BETWEEN 1 AND 5),
            total_reviews           INTEGER DEFAULT 0,
            reuniones_completadas   INTEGER DEFAULT 0,
            tasa_confirmacion_pct   NUMERIC(5, 2),
            marketplace_visible     BOOLEAN NOT NULL DEFAULT FALSE,
            validado_plataforma     BOOLEAN NOT NULL DEFAULT FALSE,
            created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

CREATE TABLE reuniones (
            id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            investor_profile_id     UUID NOT NULL REFERENCES investor_profiles(id),
            match_candidato_id      UUID REFERENCES match_candidatos(id),
            inversor_user_id        UUID NOT NULL REFERENCES users(id),
            profesional_tipo        VARCHAR(20) NOT NULL,
            profesional_id          UUID,
            profesional_nombre      VARCHAR(300) NOT NULL,
            fecha_propuesta         TIMESTAMPTZ NOT NULL,
            duracion_minutos        SMALLINT NOT NULL DEFAULT 60,
            modalidad               reunion_modalidad NOT NULL DEFAULT 'virtual',
            zona_horaria            VARCHAR(50) DEFAULT 'America/Lima',
            link_virtual            TEXT,
            direccion_fisica        TEXT,
            ubicacion_notas         TEXT,
            estado                  reunion_estado NOT NULL DEFAULT 'pendiente',
            confirmada_at           TIMESTAMPTZ,
            realizada_at            TIMESTAMPTZ,
            cancelada_at            TIMESTAMPTZ,
            motivo_cancelacion      TEXT,
            reprogramada_en_id      UUID,
            agenda_previa           TEXT,
            documentos_agenda       JSONB DEFAULT '[]',
            minuta_registrada       BOOLEAN NOT NULL DEFAULT FALSE,
            minuta_participantes    JSONB DEFAULT '[]',
            minuta_acuerdos         JSONB DEFAULT '[]',
            minuta_proximos_pasos   JSONB DEFAULT '[]',
            minuta_documentos_comprometidos JSONB DEFAULT '[]',
            minuta_validada_por     UUID REFERENCES users(id),
            minuta_registrada_at    TIMESTAMPTZ,
            ledger_event_id         UUID,
            notas_privadas_inversor TEXT,
            fase_roadmap            fase_nombre,
            creada_por              UUID NOT NULL REFERENCES users(id),
            created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

ALTER TABLE reuniones
            ADD CONSTRAINT fk_reuniones_reprogramada
            FOREIGN KEY (reprogramada_en_id) REFERENCES reuniones(id);

CREATE TABLE reunion_slots (
            id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            reunion_id      UUID NOT NULL REFERENCES reuniones(id) ON DELETE CASCADE,
            fecha_hora      TIMESTAMPTZ NOT NULL,
            duracion_minutos SMALLINT NOT NULL DEFAULT 60,
            propuesto_por   UUID NOT NULL REFERENCES users(id),
            aceptado        BOOLEAN,
            created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE (reunion_id, fecha_hora)
        );

CREATE TABLE professional_reviews (
            id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            profesional_tipo    VARCHAR(20) NOT NULL,
            profesional_id      UUID NOT NULL,
            investor_profile_id UUID NOT NULL REFERENCES investor_profiles(id),
            reunion_id          UUID NOT NULL REFERENCES reuniones(id),
            rating              SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
            comentario          TEXT,
            atributos           JSONB DEFAULT '{}',
            created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

CREATE TABLE ledger_events (
            id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            investor_profile_id UUID NOT NULL REFERENCES investor_profiles(id),
            sequence_number     BIGINT NOT NULL DEFAULT nextval('ledger_global_seq'),
            event_type          ledger_event_type NOT NULL,
            payload             JSONB NOT NULL DEFAULT '{}',
            actor_id            UUID NOT NULL,
            actor_type          actor_type NOT NULL,
            previous_hash       VARCHAR(64) NOT NULL,
            hash                VARCHAR(64) NOT NULL UNIQUE,
            created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

CREATE TABLE dossiers_inversion (
            id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            investor_profile_id UUID NOT NULL REFERENCES investor_profiles(id),
            version             SMALLINT NOT NULL DEFAULT 1,
            resumen_ejecutivo   TEXT,
            secciones           JSONB NOT NULL DEFAULT '{}',
            hash_integridad     VARCHAR(64) NOT NULL,
            url_pdf             TEXT NOT NULL,
            size_bytes          BIGINT,
            aprobado_por        UUID REFERENCES users(id),
            aprobado_at         TIMESTAMPTZ,
            created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE (investor_profile_id, version)
        );

CREATE TABLE chat_sessions (
            id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id             UUID NOT NULL REFERENCES users(id),
            investor_profile_id UUID REFERENCES investor_profiles(id),
            idioma              VARCHAR(5) NOT NULL DEFAULT 'es',
            titulo              VARCHAR(300),
            created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

CREATE TABLE chat_messages (
            id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            session_id              UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
            role                    message_role NOT NULL,
            content                 TEXT NOT NULL,
            agente_activado         agente_activado_type,
            confidence_score        NUMERIC(4, 3),
            requiere_visado_humano  BOOLEAN DEFAULT FALSE,
            tokens_prompt           INTEGER,
            tokens_completion       INTEGER,
            latencia_ms             INTEGER,
            llm_provider            VARCHAR(50),
            sources                 JSONB NOT NULL DEFAULT '[]',
            created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

CREATE TABLE visado_humano_tickets (
            id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            chat_message_id     UUID NOT NULL REFERENCES chat_messages(id),
            session_id          UUID NOT NULL REFERENCES chat_sessions(id),
            query_original      TEXT NOT NULL,
            confidence_score    NUMERIC(4, 3) NOT NULL,
            asignado_a          UUID REFERENCES users(id),
            resuelto_at         TIMESTAMPTZ,
            respuesta_experto   TEXT,
            created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

CREATE TABLE companies (
            ruc                         VARCHAR(11) PRIMARY KEY CHECK (LENGTH(ruc) = 11),
            razon_social                VARCHAR(500) NOT NULL,
            tipo_persona                VARCHAR(20) NOT NULL DEFAULT 'JURIDICA',
            estado_sunarp               VARCHAR(30) NOT NULL,
            fecha_inscripcion           DATE,
            capital_social_soles        NUMERIC(18, 2),
            domicilio_fiscal            TEXT,
            ubigeo                      VARCHAR(6),
            coordenadas                 POINT,
            distancia_puerto_chancay_km NUMERIC(8, 2),
            directorio                  JSONB NOT NULL DEFAULT '[]',
            poderes_vigentes            BOOLEAN,
            ultima_vigencia_poderes     DATE,
            tiene_cargas                BOOLEAN NOT NULL DEFAULT FALSE,
            cargas_detalle              JSONB NOT NULL DEFAULT '[]',
            tiene_procedimiento_concursal BOOLEAN NOT NULL DEFAULT FALSE,
            estado_contribuyente        VARCHAR(30),
            condicion_contribuyente     VARCHAR(20),
            tipo_contribuyente          tipo_contribuyente,
            ciiu_principal              VARCHAR(10),
            fecha_inicio_actividades    DATE,
            sector_interno              sector_interno,
            tamano_empresa              tamano_mipyme,
            trust_score                 NUMERIC(5, 4) CHECK (trust_score BETWEEN 0 AND 1),
            capacidad_operativa         VARCHAR(10) CHECK (capacidad_operativa IN ('alta', 'media', 'baja')),
            veces_seleccionada_match    INTEGER DEFAULT 0,
            activa_en_zeep              BOOLEAN DEFAULT FALSE,
            fuente_principal            fuente_empresa NOT NULL DEFAULT 'sunarp_scraping',
            last_sunarp_check           TIMESTAMPTZ,
            last_padron_sync            DATE,
            created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            marketplace_visible         BOOLEAN NOT NULL DEFAULT FALSE,
            descripcion_publica         TEXT,
            logo_url                    TEXT,
            sitio_web                   VARCHAR(500),
            email_contacto_publico      VARCHAR(320),
            telefono_publico            VARCHAR(30),
            linkedin_url                VARCHAR(500),
            anios_experiencia           SMALLINT,
            servicios_principales       TEXT[] DEFAULT '{}',
            web_enrichment_data         JSONB NOT NULL DEFAULT '{}',
            web_enrichment_at           TIMESTAMPTZ
        );

CREATE TABLE source_urls (
            id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            url             TEXT NOT NULL UNIQUE,
            nombre          VARCHAR(300) NOT NULL,
            descripcion     TEXT,
            system_prompt   TEXT,
            coleccion_chromadb VARCHAR(100),
            activo          BOOLEAN NOT NULL DEFAULT TRUE,
            frecuencia      VARCHAR(20) DEFAULT 'diario',
            last_scraped_at TIMESTAMPTZ,
            created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

CREATE TABLE extracted_documents (
            id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            source_url_id   UUID NOT NULL REFERENCES source_urls(id),
            url_especifica  TEXT NOT NULL,
            raw_content     TEXT,
            raw_html        TEXT,
            mime_type       VARCHAR(100),
            estado          scraping_estado NOT NULL DEFAULT 'completado',
            error_msg       TEXT,
            tokens_estimados INTEGER,
            scraped_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

CREATE TABLE structured_opportunities (
            id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            document_id     UUID NOT NULL REFERENCES extracted_documents(id),
            titulo          VARCHAR(500),
            descripcion     TEXT,
            tipo            VARCHAR(100),
            fecha_publicacion DATE,
            fuente          VARCHAR(300),
            highlights      JSONB NOT NULL DEFAULT '[]',
            entidades_mencionadas JSONB DEFAULT '[]',
            embedding       VECTOR(1536),
            procesado_por_llm VARCHAR(50),
            created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

CREATE TABLE sync_logs (
            id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tipo_sync       VARCHAR(50) NOT NULL,
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
            descarga_fecha              DATE NOT NULL
        );

CREATE TABLE weight_configs (
            id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            sector          sector_type NOT NULL,
            config_name     VARCHAR(100) NOT NULL,
            weights         JSONB NOT NULL,
            descripcion     TEXT,
            activo          BOOLEAN NOT NULL DEFAULT TRUE,
            creado_por      UUID REFERENCES users(id),
            created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE (sector, config_name, activo)
        );

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
            UNIQUE (agente, activo)
        );

CREATE INDEX idx_users_email ON users(email);

CREATE INDEX idx_users_role ON users(role);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id) WHERE revoked_at IS NULL;

CREATE INDEX idx_evtoken_user ON email_verification_tokens(user_id);

CREATE INDEX idx_evtoken_activo ON email_verification_tokens(user_id) WHERE used_at IS NULL;

CREATE INDEX idx_simulation_session ON simulation_records(session_id);

CREATE INDEX idx_simulation_user ON simulation_records(user_id);

CREATE INDEX idx_simulation_sector ON simulation_records(sector);

CREATE INDEX idx_simulation_created ON simulation_records(created_at DESC);

CREATE INDEX idx_simulation_variables_gin ON simulation_records USING GIN(variables_sector);

CREATE INDEX idx_investor_profiles_user ON investor_profiles(user_id);

CREATE INDEX idx_investor_profiles_session ON investor_profiles(session_id);

CREATE INDEX idx_investor_profiles_estado ON investor_profiles(estado);

CREATE INDEX idx_investor_profiles_sector ON investor_profiles(sector);

CREATE INDEX idx_investor_profiles_pais ON investor_profiles(empresa_pais_origen);

CREATE INDEX idx_investor_profiles_perfil_gin ON investor_profiles USING GIN(perfil_tecnico);

CREATE INDEX idx_investor_profiles_roadmap_gin ON investor_profiles USING GIN(roadmap);

CREATE INDEX idx_documentos_profile ON documentos_adjuntos(investor_profile_id);

CREATE INDEX idx_match_results_profile ON match_results(investor_profile_id);

CREATE INDEX idx_match_candidatos_result ON match_candidatos(match_result_id);

CREATE INDEX idx_match_candidatos_score ON match_candidatos(score_compatibilidad DESC);

CREATE INDEX idx_ledger_profile ON ledger_events(investor_profile_id);

CREATE INDEX idx_ledger_sequence ON ledger_events(sequence_number);

CREATE INDEX idx_ledger_event_type ON ledger_events(event_type);

CREATE INDEX idx_ledger_profile_seq ON ledger_events(investor_profile_id, sequence_number);

CREATE INDEX idx_ledger_payload_gin ON ledger_events USING GIN(payload);

CREATE INDEX idx_chat_sessions_user ON chat_sessions(user_id);

CREATE INDEX idx_chat_messages_session ON chat_messages(session_id);

CREATE INDEX idx_chat_messages_visado ON chat_messages(requiere_visado_humano) WHERE requiere_visado_humano = TRUE;

CREATE INDEX idx_companies_estado ON companies(estado_sunarp);

CREATE INDEX idx_companies_ciiu ON companies(ciiu_principal);

CREATE INDEX idx_companies_sector ON companies(sector_interno);

CREATE INDEX idx_companies_trust ON companies(trust_score DESC NULLS LAST);

CREATE INDEX idx_companies_geo ON companies USING GIST(coordenadas);

CREATE INDEX idx_companies_razon_social_fts ON companies USING GIN(to_tsvector('spanish', razon_social));

CREATE INDEX idx_companies_directorio_gin ON companies USING GIN(directorio);

CREATE INDEX idx_companies_marketplace ON companies(marketplace_visible) WHERE marketplace_visible = TRUE;

CREATE INDEX idx_companies_web_enrichment_gin ON companies USING GIN(web_enrichment_data);

CREATE INDEX idx_opportunities_embedding ON structured_opportunities
            USING HNSW (embedding vector_cosine_ops)
            WITH (m = 16, ef_construction = 64);

CREATE INDEX idx_extracted_docs_source ON extracted_documents(source_url_id);

CREATE INDEX idx_extracted_docs_estado ON extracted_documents(estado);

CREATE INDEX idx_padron_ruc_estado ON padron_ruc_staging(estado_contribuyente);

CREATE INDEX idx_padron_ruc_ciiu ON padron_ruc_staging(ciiu_principal);

CREATE INDEX idx_padron_ruc_rs_fts ON padron_ruc_staging USING GIN(to_tsvector('spanish', razon_social));

CREATE INDEX idx_engineers_habilitacion ON engineers_cip(habilitacion_vigente);

CREATE INDEX idx_engineers_idiomas ON engineers_cip USING GIN(idiomas);

CREATE INDEX idx_engineers_especialidades_gin ON engineers_cip USING GIN(especialidades);

CREATE INDEX idx_engineers_geo ON engineers_cip USING GIST(coordenadas);

CREATE INDEX idx_engineers_marketplace ON engineers_cip(marketplace_visible, habilitacion_vigente) WHERE marketplace_visible = TRUE;

CREATE INDEX idx_lawyers_habilitacion ON lawyers_cal(habilitacion_vigente);

CREATE INDEX idx_lawyers_cert_zeep ON lawyers_cal(certificacion_zeep);

CREATE INDEX idx_lawyers_idiomas ON lawyers_cal USING GIN(idiomas);

CREATE INDEX idx_lawyers_marketplace ON lawyers_cal(marketplace_visible, habilitacion_vigente) WHERE marketplace_visible = TRUE;

CREATE INDEX idx_reuniones_profile ON reuniones(investor_profile_id);

CREATE INDEX idx_reuniones_estado ON reuniones(estado);

CREATE INDEX idx_reuniones_pendientes ON reuniones(estado, fecha_propuesta) WHERE estado IN ('pendiente', 'confirmada');

CREATE INDEX idx_reuniones_minuta ON reuniones(minuta_registrada) WHERE minuta_registrada = FALSE AND estado = 'realizada';

CREATE OR REPLACE FUNCTION prevent_ledger_mutation()
        RETURNS TRIGGER AS $$
        BEGIN
            IF TG_OP = 'UPDATE' THEN
                RAISE EXCEPTION 'LEDGER_IMMUTABLE: Los registros del Ledger no pueden ser modificados. Evento: % (seq: %)', OLD.id, OLD.sequence_number
                    USING ERRCODE = 'restrict_violation';
            ELSIF TG_OP = 'DELETE' THEN
                RAISE EXCEPTION 'LEDGER_IMMUTABLE: Los registros del Ledger no pueden ser eliminados. Evento: % (seq: %)', OLD.id, OLD.sequence_number
                    USING ERRCODE = 'restrict_violation';
            END IF;
            RETURN NULL;
        END;
        $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_ledger_update BEFORE UPDATE ON ledger_events FOR EACH ROW EXECUTE FUNCTION prevent_ledger_mutation();

CREATE TRIGGER trg_prevent_ledger_delete BEFORE DELETE ON ledger_events FOR EACH ROW EXECUTE FUNCTION prevent_ledger_mutation();

CREATE OR REPLACE FUNCTION set_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_investor_profiles_updated_at BEFORE UPDATE ON investor_profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_chat_sessions_updated_at BEFORE UPDATE ON chat_sessions FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_engineers_cip_updated_at BEFORE UPDATE ON engineers_cip FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_lawyers_cal_updated_at BEFORE UPDATE ON lawyers_cal FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_reuniones_updated_at BEFORE UPDATE ON reuniones FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE FUNCTION update_company_match_stats()
        RETURNS TRIGGER AS $$
        BEGIN
            IF NEW.reunion_confirmada_at IS NOT NULL AND OLD.reunion_confirmada_at IS NULL THEN
                UPDATE companies
                SET veces_seleccionada_match = veces_seleccionada_match + 1,
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

ALTER TABLE ledger_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY ledger_insert_only ON ledger_events
            FOR INSERT TO PUBLIC WITH CHECK (TRUE);

CREATE POLICY ledger_select ON ledger_events
            FOR SELECT TO PUBLIC USING (TRUE);

INSERT INTO alembic_version (version_num) VALUES ('001') RETURNING alembic_version.version_num;

COMMIT;

