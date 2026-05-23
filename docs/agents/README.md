# Agentes COMEX.AI — Documentación operativa

Esta carpeta define **system prompts**, herramientas, interacción y políticas de búsqueda web para el sistema multi-agente descrito en [spec09](../specs/spec09.md), alineado con [presentacion.md](../presentacion.md) y los criterios de [busqueda.md](../busqueda.md).

## Mapa de agentes

| Agente | Archivo | Rol |
|--------|---------|-----|
| Orquestador | [orquestador.md](./orquestador.md) | Clasifica, delega, repregunta, consolida |
| Legal | [legal.md](./legal.md) | Ley ZEEP, MINCETUR, El Peruano (RAG + web) |
| Matchmaker | [matchmaker.md](./matchmaker.md) | CIP / CAL / proveedores + enriquecimiento empresa |
| Técnico | [tecnico.md](./tecnico.md) | INACAL, SENACE, MINAM, Anexo 4 |
| Financiero | [financiero.md](./financiero.md) | IR, IGV, proyección fiscal |
| I+D+i | [idi.md](./idi.md) | CONCYTEC, CITE (sector tech) |
| Auditor | [auditor.md](./auditor.md) | Alucinación cero, confidence score |
| Ingesta normativa | [ingesta-normativa.md](./ingesta-normativa.md) | Jobs El Peruano, MINCETUR → BD |

## Reglas transversales

1. **BD primero, web después** — Tavily solo si falta dato o puede estar desactualizado.
2. **Persistir hallazgos** — `save_web_enrichment`, `regulatory_documents` (spec13).
3. **Comunicación vertical** — especialistas no se llaman entre sí; solo el Orquestador delega.
4. **Sin SQL directo** — agentes usan function calling → endpoints FastAPI.
5. **Proyecto activo** — contexto desde `investment_projects` + `investor_profile_id` (spec11).

## Fuentes externas (resumen)

Ver detalle en [busqueda.md](../busqueda.md):

- **SUNARP** — personería, poderes, gravámenes
- **MINCETUR** — resoluciones ZEE, aranceles
- **El Peruano** — normas nuevas (monitoreo diario proactivo)
- **INACAL** — NTP, homologación
- **SENACE / PRODUCE** — licencias, CIIU, EVA
- **MINAM** — ECA, Anexo 4

## Implementación en código

| Capa | Ubicación |
|------|-----------|
| Prompts (runtime) | `backend/src/modules/ai_agent/application/prompts/` *(a crear)* |
| Tools | `backend/src/modules/ai_agent/application/tools/` |
| Tavily | `backend/src/shared/infrastructure/tavily_client.py` |
| Cron ingesta | `backend/src/modules/zeep_ingestion/infrastructure/cron_scheduler.py` |
