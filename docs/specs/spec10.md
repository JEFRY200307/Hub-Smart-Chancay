# spec10 — Integración Frontend + Streaming Legal AI

**Módulos:** `frontend/`, `ai_agent`, `zeep_simulation`, `marketplace`  
**Objetivo:** UI CIP Lima conectada al backend; elegibilidad dinámica; chat con SSE.

## 1. Identidad visual (Manual CIP Lima)

| Token | HEX | Uso |
|-------|-----|-----|
| `--cip-red` | `#E31E24` | Primario, CTAs, énfasis |
| `--cip-gold` | `#D7B56D` | Bordes, acentos institucionales |
| `--cip-carbon` | `#2A2A29` | Texto principal |

## 2. Simulación ZEEP (`POST /api/v1/simulation/calculate`)

Formulario multi-paso con campos alineados a `SimulationRequestDTO`:

- `session_id` (UUID generado en cliente)
- `sector`: manufactura | ckd | tech
- `monto_inversion_usd`, `empleo_directo`, `empleo_indirecto`
- `porcentaje_cl`, `tiempo_instalacion_meses`, `pais_origen`, `exportacion_pct`
- `variables_sector` según sector (spec02)

Tras calcular → redirección a `/dashboard/results?session={uuid}`.

## 3. Resultados de elegibilidad (`GET /api/v1/simulation/{session_id}`)

- Score `v_final` (gauge dinámico)
- `clasificacion`, `proyeccion_fiscal`, `alertas`, `recomendaciones_agente`
- Sin mapa estático (eliminado)
- Match territorial: lista desde `GET /api/v1/marketplace/directory/providers` filtrada por sector

## 4. Legal AI — Streaming SSE

**Endpoint:** `POST /api/v1/ai/query/stream`  
**Auth:** Bearer JWT  
**Content-Type respuesta:** `text/event-stream`

Eventos JSON:

```json
{"type": "token", "content": "fragmento"}
{"type": "done", "session_id": "...", "message_id": "...", "confidence_score": 0.92, "sources": []}
```

UI tipo ChatGPT: sidebar sesiones, mensajes, indicador de escritura, botones escalar / nueva conversación / fuentes.

## 5. Directorio marketplace (lectura pública)

- `GET /api/v1/marketplace/directory/engineers`
- `GET /api/v1/marketplace/directory/lawyers`
- `GET /api/v1/marketplace/directory/providers`

`marketplace_visible = true` en BD (seed SQL `seed_cip_cal_padron.sql`).

## 6. Seed SQL

Archivo: `backend/scripts/seed_cip_cal_padron.sql`  
Generador: `python backend/scripts/generate_seed_sql.py`

Incluye 10 ingenieros CIP, 10 abogados CAL, 100 empresas PadronRUC, usuario demo.
