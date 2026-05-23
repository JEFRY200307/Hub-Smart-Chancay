# spec13 — Marketplace de servicios: ficha de detalle y enriquecimiento web

**Módulos:** `marketplace/`, `zeep_ingestion/` (companies), `ai_agent/` (herramientas)  
**Referencias:** spec04 (matchmaking), spec09 (agentes), `docs/busqueda.md`

---

## 1. Objetivo

Cada tarjeta del directorio (ingeniero CIP, abogado CAL, proveedor PadronRUC) debe abrir una **ficha de detalle** con información suficiente para decidir contacto o reunión, incluyendo datos enriquecidos desde web cuando la BD no los tiene.

---

## 2. Rutas frontend

| Tipo | Ruta | Parámetro |
|------|------|-----------|
| Ingeniero | `/[locale]/services/engineers/[id]` | UUID `engineers_cip.id` |
| Abogado | `/[locale]/services/lawyers/[id]` | UUID `lawyers_cal.id` |
| Proveedor | `/[locale]/services/providers/[ruc]` | RUC 11 dígitos |

Desde `ServicesDirectory`: cada tarjeta es un `<Link href={...}>`.

---

## 3. API de detalle

| Método | Ruta | Auth |
|--------|------|------|
| GET | `/api/v1/marketplace/directory/engineers/{id}` | Opcional |
| GET | `/api/v1/marketplace/directory/lawyers/{id}` | Opcional |
| GET | `/api/v1/marketplace/directory/providers/{ruc}` | Opcional |
| POST | `/api/v1/marketplace/directory/providers/{ruc}/enrich` | JWT — dispara enriquecimiento Tavily |

### EngineerDetailDTO (ejemplo)

```json
{
  "id": "uuid",
  "nombre": "Ing. Carlos Ramírez Torres",
  "numero_cip": "CIP-058423",
  "especialidades": ["mecanica_industrial"],
  "idiomas": ["es", "en"],
  "disponibilidad": "disponible",
  "habilitacion_vigente": true,
  "descripcion_publica": "...",
  "rating_promedio": 4.8,
  "foto_url": "...",
  "region": "lima_norte",
  "certificaciones": [],
  "enrichment": {
    "completeness_score": 0.85,
    "fuentes": ["bd_cip", "web"],
    "ultima_actualizacion": "2026-05-22T10:00:00Z"
  },
  "actions": [
    { "label": "Solicitar reunión", "action": "request_meeting" },
    { "label": "Agregar a match", "action": "add_to_shortlist" }
  ]
}
```

### ProviderDetailDTO

Incluye: `ruc`, `razon_social`, `estado_sunarp`, `trust_score`, `servicios_principales`, `web_enrichment_data`, `directorio`, `distancia_puerto_chancay_km`, mapa de contacto si existe.

---

## 4. Política de enriquecimiento (Matchmaker + ingesta)

Antes de recomendar un proveedor en matchmaking:

```
1. get_company_detail(ruc) → completeness_score
2. SI completeness_score < 0.7:
     tavily_search("RUC {ruc} {razon_social} sitio web oficial Perú")
     tavily_extract(urls_oficiales)
     save_web_enrichment(ruc, datos)
3. Re-evaluar completeness_score
4. Generar candidate_card / company_card con badge "Datos verificados web"
```

Campos mínimos para recomendar (`completeness_score`):

| Campo | Peso |
|-------|------|
| razón social + RUC en BD | 0.25 |
| estado SUNARP/SUNAT | 0.20 |
| servicios o CIIU | 0.20 |
| contacto o web oficial | 0.20 |
| trust_score > 0.6 | 0.15 |

---

## 5. Normativa MINCETUR y El Peruano (cache BD)

Tabla `regulatory_documents` (migración 002):

| Campo | Descripción |
|-------|-------------|
| `fuente` | mincetur \| el_peruano \| sunarp \| ... |
| `tipo_norma` | ley \| ds \| rm \| resolución |
| `numero` | ej. Ley 32449 |
| `titulo` | |
| `url_oficial` | |
| `fecha_publicacion` | |
| `fecha_vigencia_hasta` | null si vigente |
| `hash_contenido` | SHA-256 del texto |
| `contenido_resumen` | TEXT |
| `metadata` | JSONB |
| `is_latest` | BOOLEAN — Agente Legal compara antes de citar |

**Jobs proactivos (cron):**

- **El Peruano:** diario, query Tavily + `include_domains: ["elperuano.pe"]`, keywords ZEEP, Chancay, 32449.
- **MINCETUR:** semanal, resoluciones ZEE en `mincetur.gob.pe`.

Flujo Agente Legal:

```
1. search_legal_knowledge (ChromaDB)
2. SI confidence baja o fecha_chunk < 90 días:
     consultar regulatory_documents WHERE fuente='mincetur' AND is_latest
3. SI no hay registro o is_latest=false:
     tavily_search → persistir → re-indexar ChromaDB (job async)
```

Ver `docs/agents/ingesta-normativa.md` y `docs/busqueda.md`.

---

## 6. UI ficha detalle

- Hero: nombre, badges (CIP/CAL/VIGENTE), score compatibilidad si viene de match
- Tabs: Resumen | Validación institucional | Contacto | Fuentes
- Botón «Solicitar reunión» (si hay `investor_profile_id` activo)
- Spinner «Enriqueciendo datos…» al llamar POST enrich

---

## 7. Tests

- `test_get_engineer_detail_404`
- `test_get_provider_detail_con_web_enrichment`
- `test_enrich_provider_llama_tavily_mock`
- `test_regulatory_document_upsert_is_latest`
