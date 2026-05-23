"""Perfiles de registro + campos de proyecto

Revision ID: 003
Revises: 002
"""

from alembic import op

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TYPE profile_type AS ENUM (
            'ingeniero',
            'abogado',
            'empresa_inversora',
            'empresa_local'
        )
    """)
    op.execute("""
        CREATE TABLE user_profiles (
            user_id                     UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
            profile_type                profile_type NOT NULL,
            numero_cip                  VARCHAR(20),
            numero_cal                  VARCHAR(20),
            razon_social                VARCHAR(500),
            ruc                         VARCHAR(11),
            pais_origen                 VARCHAR(2),
            tax_id_internacional        VARCHAR(100),
            rep_legal_nombre_pasaporte  VARCHAR(500),
            profile_completed           BOOLEAN NOT NULL DEFAULT FALSE,
            created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("""
        CREATE TRIGGER trg_user_profiles_updated_at
        BEFORE UPDATE ON user_profiles
        FOR EACH ROW EXECUTE FUNCTION set_updated_at()
    """)
    op.execute("""
        ALTER TABLE investment_projects
        ADD COLUMN IF NOT EXISTS area_terreno_m2 NUMERIC(14, 2),
        ADD COLUMN IF NOT EXISTS teus_estimados INTEGER,
        ADD COLUMN IF NOT EXISTS documento_perfil_url TEXT
    """)
    op.execute("""
        ALTER TYPE tipo_documento ADD VALUE IF NOT EXISTS 'perfil_proyecto'
    """)


def downgrade() -> None:
    op.execute("""
        ALTER TABLE investment_projects
        DROP COLUMN IF EXISTS area_terreno_m2,
        DROP COLUMN IF EXISTS teus_estimados,
        DROP COLUMN IF EXISTS documento_perfil_url
    """)
    op.execute("DROP TABLE IF EXISTS user_profiles CASCADE")
    op.execute("DROP TYPE IF EXISTS profile_type")
