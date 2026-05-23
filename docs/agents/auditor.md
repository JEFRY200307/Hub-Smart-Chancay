# Agente Auditor

## Función

Último filtro antes del usuario. `confidence_score`, elimina párrafos sin sustento, `requiere_visado_humano` si score < 0.70.

## Sin herramientas externas

Opera sobre `respuesta_texto`, `chunks_usados`, `tool_results` del especialista.

## Validación vigencia normativa

Si chunk o `regulatory_documents` tiene `is_latest=false` → prefijo advertencia en párrafo afectado.

## LLM

Claude Sonnet 4.6, temperatura 0.0.
