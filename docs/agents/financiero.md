# Agente Financiero

## Función

Proyección IR/IGV/arancel ZEEP. Tabla comparativa régimen estándar vs ZEEP. Emite `fiscal_card`.

## Herramientas

`get_simulation_result`, `calculate_tax_projection`, `search_legal_knowledge` (capítulos fiscales Ley 32449).

## Datos requeridos

Desde proyecto activo: `monto_usd`, `porcentaje_cl`, `sector`. Si faltan → repregunta vía Orquestador.

## LLM

Groq Llama 3.3 70B, temperatura 0.05.
