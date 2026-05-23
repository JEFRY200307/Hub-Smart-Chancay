# Ingesta normativa proactiva (El Peruano + MINCETUR)

No es un agente conversacional; es el **pipeline de datos** que alimenta RAG y al Agente Legal.

## Tabla `regulatory_documents` (spec13)

Persiste normas con control de versión (`is_latest`, `hash_contenido`).

## Jobs programados

| Job | Cron | Agente lógico | Acción |
|-----|------|---------------|--------|
| `ingest_el_peruano_daily` | `0 6 * * *` America/Lima | Legal (batch) | Tavily → extract → upsert → queue Chroma reindex |
| `ingest_mincetur_weekly` | `0 7 * * 1` | Legal (batch) | Resoluciones ZEE en mincetur.gob.pe |
| `sunarp_enrichment_on_match` | On-demand | Matchmaker | Al recomendar proveedor sin completeness |

## Flujo El Peruano (proactivo)

```
1. tavily_search(
     query="site:elperuano.pe normas legales ZEEP OR Chancay OR 32449",
     search_depth="advanced",
     max_results=10
   )
2. Para cada URL nueva (no en regulatory_documents.url_oficial):
     tavily_extract([url])
     hash = sha256(contenido)
     SI hash != existente:
         marcar viejo is_latest=false
         INSERT regulatory_documents (is_latest=true)
         enqueue chroma_index(document_id)
3. Log en sync_logs (módulo zeep_ingestion)
```

## Flujo MINCETUR

Igual con dominio `mincetur.gob.pe` y `tipo_norma` in (`rm`, `resolución`, `manual_zee`).

## Pregunta «¿Es la última actualización?»

Antes de responder el Agente Legal:

```python
doc = get_regulatory_document(numero="32449", tipo="ley")
if not doc or not doc.is_latest:
    trigger_ingest_el_peruano(query=f"Ley {numero}")
```

## Referencia

Criterios detallados por entidad: [busqueda.md](../busqueda.md).
