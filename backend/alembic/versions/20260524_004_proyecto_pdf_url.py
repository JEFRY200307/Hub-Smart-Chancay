"""URL del PDF de proyecto en investor_profiles

Revision ID: 004
Revises: 003
"""

from alembic import op

revision = "004"
down_revision = "003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        ALTER TABLE investor_profiles
        ADD COLUMN IF NOT EXISTS proyecto_documento_pdf_url TEXT
    """)
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_investor_profiles_pdf_url
        ON investor_profiles(proyecto_documento_pdf_url)
        WHERE proyecto_documento_pdf_url IS NOT NULL
    """)


def downgrade() -> None:
    op.execute("""
        ALTER TABLE investor_profiles
        DROP COLUMN IF EXISTS proyecto_documento_pdf_url
    """)
