#!/bin/sh
set -e

echo "[entrypoint] Esperando base de datos (Supabase)..."
until python -c "
import os, sys
from sqlalchemy import create_engine, text
url = os.environ.get('DATABASE_URL', '')
if not url:
    sys.exit(1)
if url.startswith('postgres://'):
    url = url.replace('postgres://', 'postgresql+psycopg2://', 1)
elif url.startswith('postgresql://') and '+psycopg2' not in url:
    url = url.replace('postgresql://', 'postgresql+psycopg2://', 1)
engine = create_engine(url, pool_pre_ping=True)
with engine.connect() as c:
    c.execute(text('SELECT 1'))
" 2>/dev/null; do
  sleep 2
done

echo "[entrypoint] Ejecutando migraciones Alembic..."
cd /app || exit 1
if [ ! -f alembic.ini ] || [ ! -d alembic/versions ]; then
  echo "[entrypoint] ERROR: falta alembic.ini o carpeta alembic/ en la imagen"
  ls -la /app
  exit 1
fi
alembic upgrade head

if [ "${RUN_SEED_ON_START:-true}" = "true" ]; then
  echo "[entrypoint] Cargando datos demo (si aplica)..."
  python scripts/seed_demo_data.py || true
fi

echo "[entrypoint] Iniciando API..."
exec "$@"
