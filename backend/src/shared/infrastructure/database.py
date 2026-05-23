import os
from pathlib import Path

from sqlmodel import create_engine, Session, text

try:
    from dotenv import load_dotenv

    load_dotenv(Path(__file__).resolve().parents[3] / ".env", override=True)
except ImportError:
    pass

# Supabase (ADR-01)
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://chancay_admin:chancay_password@localhost:5432/sovereign_gateway",
)

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg2://", 1)
elif DATABASE_URL.startswith("postgresql://") and "+psycopg2" not in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)

_connect_args: dict = {}
if "supabase" in DATABASE_URL and ":6543" in DATABASE_URL:
    # Pooler transaction mode: desactiva prepared statements (compat. PgBouncer)
    _connect_args["prepare_threshold"] = None

engine = create_engine(
    DATABASE_URL,
    echo=os.getenv("SQL_ECHO", "false").lower() == "true",
    pool_pre_ping=True,
    connect_args=_connect_args,
)


def check_database_connection() -> dict:
    try:
        with engine.connect() as conn:
            row = conn.execute(text("SELECT version()")).scalar()
            return {"connected": True, "version": str(row)[:80]}
    except Exception as exc:
        return {"connected": False, "error": str(exc)}

def get_session():
    """Dependencia de FastAPI para inyectar la sesión en los endpoints"""
    with Session(engine) as session:
        yield session
