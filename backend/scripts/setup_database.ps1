# Crea el esquema en PostgreSQL (local Docker o Supabase)
# Uso:
#   $env:DATABASE_URL="postgresql+psycopg2://postgres.[ref]:[pass]@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
#   .\scripts\setup_database.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

if (-not $env:DATABASE_URL) {
    Write-Host "DATABASE_URL no definida. Copia backend/.env.example a backend/.env y configura Supabase o Docker."
    exit 1
}

Write-Host "Ejecutando Alembic upgrade head..."
alembic upgrade head

Write-Host "Cargando datos demo..."
python scripts/seed_demo_data.py

Write-Host "Listo. Verifica con: curl http://localhost:8000/health"
