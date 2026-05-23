# spec11 — Portafolio de proyectos de inversión

**Módulos:** `onboarding/`, `zeep_simulation/`, `ledger/`, `marketplace/`  
**Migración:** `alembic/versions/20260523_002_portfolio_and_regulatory_cache.py`  
**Objetivo:** Una empresa inversora puede registrar **múltiples proyectos** ZEEP; cada proyecto tiene su simulación, perfil, matchmaking y ledger asociados.

---

## 1. Modelo de dominio

```
User (inversor)
  └── InvestorCompany (opcional v2; v1: datos empresa en cada perfil)
        └── InvestmentProject (1..N)
              ├── SimulationRecord (session_id)
              ├── InvestorProfile (1:1 por proyecto activo)
              ├── MatchResults
              └── LedgerEvents (vía investor_profile_id)
```

### Tabla `investment_projects`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID PK | Identificador del proyecto |
| `user_id` | UUID FK → users | Dueño (empresa inversora) |
| `investor_profile_id` | UUID FK nullable | Perfil generado tras onboarding de este proyecto |
| `session_id` | UUID FK nullable | Última simulación GANCHO vinculada |
| `codigo` | VARCHAR(50) | Código corto legible (`PRY-2026-001`) |
| `nombre` | VARCHAR(500) | Nombre del proyecto en Chancay |
| `descripcion` | TEXT | Descripción ejecutiva |
| `sector` | sector_type | manufactura \| ckd \| tech |
| `estado` | project_estado | borrador \| simulado \| perfil_creado \| en_match \| archivado |
| `monto_usd` | NUMERIC(18,2) | Inversión estimada |
| `empleo_directo` | INT | |
| `empleo_indirecto` | INT | |
| `porcentaje_cl` | NUMERIC(5,2) | Componentes locales % |
| `exportacion_pct` | NUMERIC(5,2) | |
| `pais_origen_capital` | VARCHAR(2) | ISO alpha-2 |
| `empresa_razon_social` | VARCHAR(500) | Snapshot al crear |
| `is_active` | BOOLEAN | Proyecto seleccionado en UI (solo uno true por user) |
| `created_at` / `updated_at` | TIMESTAMPTZ | |

**Índices:** `(user_id)`, `(user_id, is_active)`, `(estado)`.

### Migración de datos existentes

```sql
INSERT INTO investment_projects (...)
SELECT ... FROM investor_profiles;
-- Marcar el más reciente por user como is_active = true
```

Los campos `proyecto_*` en `investor_profiles` se mantienen por compatibilidad (deprecados en spec12 UI).

---

## 2. API REST

Prefijo: `/api/v1/projects` — Auth: JWT inversor (solo sus proyectos).

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/` | Lista portafolio del usuario (paginado) |
| POST | `/` | Crea proyecto en estado `borrador` |
| GET | `/{project_id}` | Detalle + resumen ledger/match |
| PATCH | `/{project_id}` | Actualiza campos editables |
| POST | `/{project_id}/activate` | Marca `is_active=true`, desactiva otros |
| DELETE | `/{project_id}` | Archiva (`estado=archivado`) |

### POST `/` body

```json
{
  "nombre": "Hub logístico ZEEP Fase 1",
  "sector": "tech",
  "monto_usd": 5000000,
  "empleo_directo": 100,
  "empleo_indirecto": 50,
  "porcentaje_cl": 35,
  "exportacion_pct": 40,
  "pais_origen_capital": "CN",
  "empresa_razon_social": "Shanghai Pacific Holdings Ltd."
}
```

### Respuesta lista

```json
{
  "items": [{
    "id": "uuid",
    "codigo": "PRY-2026-003",
    "nombre": "...",
    "sector": "tech",
    "estado": "perfil_creado",
    "monto_usd": 5000000,
    "is_active": true,
    "investor_profile_id": "uuid|null",
    "completion_pct": 75
  }],
  "total": 3
}
```

---

## 3. Flujo UI

1. **Onboarding** crea/actualiza el proyecto activo (no solo un perfil suelto).
2. Tras `POST /onboarding/profiles`, backend enlaza `investment_projects.investor_profile_id` y `estado=perfil_creado`.
3. **Portafolio** (`/dashboard/portfolio`): tabla de proyectos + botón «Nuevo proyecto» → onboarding con `?project=new`.
4. Selector de proyecto activo en header del dashboard (dropdown).

---

## 4. Reglas de negocio

- Máximo **20 proyectos** activos (no archivados) por usuario.
- Matchmaking y Legal AI usan `investor_profile_id` del **proyecto activo**.
- `localStorage` clave `comex_active_project_id` sincronizada con `POST .../activate`.

---

## 5. Tests

- `test_create_project_borrador`
- `test_activate_project_solo_uno_activo`
- `test_list_projects_solo_del_usuario`
- `test_onboarding_vincula_project_id`
