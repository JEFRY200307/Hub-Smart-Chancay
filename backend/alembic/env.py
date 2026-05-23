import os
import sys
from pathlib import Path
from logging.config import fileConfig

try:
    from dotenv import load_dotenv

    load_dotenv(Path(__file__).resolve().parents[1] / ".env", override=True)
except ImportError:
    pass
from sqlalchemy import engine_from_config, pool
from alembic import context

# Permite ejecutar `alembic` desde backend/ en el host (fuera de Docker)
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

# Importar todos los modelos para que SQLModel registre sus metadatos
# (necesario para autogenerate, aunque usamos migraciones manuales)
from sqlmodel import SQLModel

# Módulos con entidades
import src.modules.identity.domain.entities          # noqa: F401
import src.modules.zeep_ingestion.domain.entities    # noqa: F401
import src.modules.onboarding.domain.entities        # noqa: F401
import src.modules.marketplace.domain.entities       # noqa: F401
import src.modules.ai_agent.domain.entities          # noqa: F401
import src.modules.zeep_simulation.domain.entities   # noqa: F401
import src.modules.ledger.domain.entities            # noqa: F401
import src.modules.analytics_padron_ruc.domain.entities  # noqa: F401

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = SQLModel.metadata

# Sobreescribir la URL con la variable de entorno
DATABASE_URL = os.environ.get("DATABASE_URL", "")
if DATABASE_URL:
    # SQLAlchemy 2.x necesita el driver correcto para asyncpg/psycopg2
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg2://", 1)
    config.set_main_option("sqlalchemy.url", DATABASE_URL)


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
