# Backend COMEX.AI — Setup

## 1. Variables de entorno

Copia `backend/.env.example` → `backend/.env` y configura Supabase, Gmail SMTP, Groq y Tavily.

```env
DATABASE_URL=postgresql+psycopg2://postgres.[PROJECT_REF]:[PASSWORD]@aws-1-us-west-2.pooler.supabase.com:6543/postgres?sslmode=require
```

### Esquema completo en Supabase

En el **SQL Editor**, pega y ejecuta (proyecto vacío o nuevo):

1. `backend/scripts/init-db.sql` — esquema v1.1 completo (`docs/DB_SCHEMA.md`)
2. `backend/scripts/seed_cip_cal_padron.sql` — 10 CIP + 10 CAL + 100 empresas PadronRUC

Si ya tienes tablas por `alembic upgrade head`, **no** vuelvas a ejecutar `init-db.sql`.

## 2. Docker Compose (recomendado)

Desde la raíz del monorepo:

```bash
docker compose up --build
```

| Servicio | URL |
|----------|-----|
| API + Swagger | http://localhost:8000/docs |
| Health + Supabase | http://localhost:8000/health |
| ChromaDB (local) | http://localhost:8001 |

**No hay PostgreSQL ni frontend en Docker.**  
- BD: Supabase (`backend/.env`)  
- Frontend: Vercel en producción; local con `cd frontend && npm run dev` → http://localhost:3000

El contenedor `api` ejecuta `alembic upgrade head` y seed demo al arrancar.

## 3. Migraciones manuales (alternativa a init-db.sql)

Desde `backend/` con el mismo `DATABASE_URL`:

```powershell
alembic upgrade head
python scripts/seed_demo_data.py
# o: ejecutar seed_cip_cal_padron.sql en Supabase
```

Si el pooler en puerto **6543** falla en DDL, usa el pooler en modo sesión (puerto **5432**) o la conexión directa del panel Supabase.

## 4. API sin Docker

```bash
cd backend
uvicorn src.main:app --reload --port 8000
```

Asegura `CHROMA_HOST=localhost` y `CHROMA_PORT=8001` (o levanta solo Chroma: `docker compose up -d chromadb`).

## 5. Verificación

```bash
python scripts/verify_api_contracts.py
curl http://localhost:8000/health
```
