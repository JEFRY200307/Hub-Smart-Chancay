"""Portafolio de proyectos + cache normativa

Revision ID: 002
Revises: 001
Create Date: 2026-05-23
"""

from alembic import op

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TYPE project_estado AS ENUM (
            'borrador',
            'simulado',
            'perfil_creado',
            'en_match',
            'archivado'
        )
    """)

    op.execute("""
        CREATE TABLE investment_projects (
            id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            investor_profile_id     UUID REFERENCES investor_profiles(id) ON DELETE SET NULL,
            session_id              UUID REFERENCES simulation_records(session_id) ON DELETE SET NULL,
            codigo                  VARCHAR(50) NOT NULL,
            nombre                  VARCHAR(500) NOT NULL,
            descripcion             TEXT,
            sector                  sector_type NOT NULL,
            estado                  project_estado NOT NULL DEFAULT 'borrador',
            monto_usd               NUMERIC(18, 2) NOT NULL DEFAULT 0,
            empleo_directo          INTEGER NOT NULL DEFAULT 0,
            empleo_indirecto        INTEGER NOT NULL DEFAULT 0,
            porcentaje_cl           NUMERIC(5, 2) NOT NULL DEFAULT 0,
            exportacion_pct         NUMERIC(5, 2) DEFAULT 0,
            pais_origen_capital     VARCHAR(2) NOT NULL DEFAULT 'PE',
            empresa_razon_social    VARCHAR(500) NOT NULL,
            is_active               BOOLEAN NOT NULL DEFAULT FALSE,
            created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)

    op.execute("""
        CREATE INDEX idx_investment_projects_user ON investment_projects(user_id)
    """)
    op.execute("""
        CREATE INDEX idx_investment_projects_user_active
        ON investment_projects(user_id) WHERE is_active = TRUE
    """)
    op.execute("""
        CREATE UNIQUE INDEX uq_investment_projects_user_codigo
        ON investment_projects(user_id, codigo)
    """)

    op.execute("""
        CREATE TRIGGER trg_investment_projects_updated_at
        BEFORE UPDATE ON investment_projects
        FOR EACH ROW EXECUTE FUNCTION set_updated_at()
    """)

    # Migrar perfiles existentes → un proyecto por perfil
    op.execute("""
        INSERT INTO investment_projects (
            user_id, investor_profile_id, session_id, codigo, nombre, descripcion,
            sector, estado, monto_usd, empleo_directo, empleo_indirecto,
            porcentaje_cl, exportacion_pct, pais_origen_capital, empresa_razon_social,
            is_active, created_at, updated_at
        )
        SELECT
            ip.user_id,
            ip.id,
            ip.session_id,
            'PRY-' || TO_CHAR(ip.created_at, 'YYYY') || '-' || LPAD(
                ROW_NUMBER() OVER (PARTITION BY ip.user_id ORDER BY ip.created_at)::TEXT, 3, '0'
            ),
            ip.proyecto_nombre,
            ip.proyecto_descripcion,
            ip.sector,
            CASE ip.estado
                WHEN 'completado' THEN 'perfil_creado'::project_estado
                WHEN 'archivado' THEN 'archivado'::project_estado
                ELSE 'perfil_creado'::project_estado
            END,
            ip.proyecto_monto_usd,
            ip.proyecto_empleo_directo,
            COALESCE(ip.proyecto_empleo_indirecto, 0),
            ip.proyecto_porcentaje_cl,
            COALESCE(ip.proyecto_exportacion_pct, 0),
            ip.empresa_pais_origen,
            ip.empresa_razon_social,
            FALSE,
            ip.created_at,
            ip.updated_at
        FROM investor_profiles ip
    """)

    op.execute("""
        UPDATE investment_projects p
        SET is_active = TRUE
        FROM (
            SELECT DISTINCT ON (user_id) id
            FROM investment_projects
            WHERE estado != 'archivado'
            ORDER BY user_id, updated_at DESC
        ) latest
        WHERE p.id = latest.id
    """)

    op.execute("""
        CREATE TYPE regulatory_fuente AS ENUM (
            'el_peruano', 'mincetur', 'sunarp', 'sunat', 'inacal', 'senace', 'minam', 'otro'
        )
    """)

    op.execute("""
        CREATE TABLE regulatory_documents (
            id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            fuente              regulatory_fuente NOT NULL,
            tipo_norma          VARCHAR(50) NOT NULL,
            numero              VARCHAR(100),
            titulo              VARCHAR(1000) NOT NULL,
            url_oficial         TEXT,
            fecha_publicacion   DATE,
            fecha_vigencia_hasta DATE,
            hash_contenido      VARCHAR(64) NOT NULL,
            contenido_resumen   TEXT,
            metadata            JSONB NOT NULL DEFAULT '{}',
            is_latest           BOOLEAN NOT NULL DEFAULT TRUE,
            created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)

    op.execute("""
        CREATE INDEX idx_regulatory_documents_fuente ON regulatory_documents(fuente)
    """)
    op.execute("""
        CREATE INDEX idx_regulatory_documents_latest
        ON regulatory_documents(fuente, tipo_norma, numero) WHERE is_latest = TRUE
    """)

    op.execute("""
        CREATE TRIGGER trg_regulatory_documents_updated_at
        BEFORE UPDATE ON regulatory_documents
        FOR EACH ROW EXECUTE FUNCTION set_updated_at()
    """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS regulatory_documents CASCADE")
    op.execute("DROP TYPE IF EXISTS regulatory_fuente")
    op.execute("DROP TABLE IF EXISTS investment_projects CASCADE")
    op.execute("DROP TYPE IF EXISTS project_estado")
