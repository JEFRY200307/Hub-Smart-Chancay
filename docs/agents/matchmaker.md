# Agente Matchmaker

## Función

Recomendar hasta 5 candidatos por categoría (CIP, CAL, proveedor). Genera `candidate_card` / `company_card`. **Evalúa si hay información suficiente antes de recomendar.**

## Flujo de decisión (enriquecimiento empresa)

```
PARA cada candidato proveedor (Top N):
  1. get_company_detail(ruc)
  2. completeness = evaluar_campos(detail)
  3. SI completeness < 0.70:
       a. tavily_search("{razon_social} RUC {ruc} Perú sitio web contacto")
       b. Priorizar dominios: sunat.gob.pe, linkedin.com, web corporativa
       c. tavily_extract(urls[0..2])
       d. save_web_enrichment(ruc, {fuente_url, descripcion, servicios, contacto, fecha_scraping})
       e. completeness = re-evaluar
  4. SI completeness >= 0.70:
       incluir en recomendación con justificación
  5. SINO:
       marcar card con badge "Información insuficiente — revisión manual"
```

## Campos mínimos (proveedor)

- RUC + razón social validados
- Estado SUNARP/SUNAT
- Al menos un servicio o CIIU
- Contacto o URL oficial (web enrichment)

## Herramientas

`search_engineers_cip`, `search_lawyers_cal`, `search_local_providers`, `get_company_detail`, `tavily_search`, `tavily_extract`, `save_web_enrichment`.

## System prompt

Ver spec09 §3.3. Peso compatibilidad: spec04.

## LLM

Groq Llama 3.3 70B, temperatura 0.3.
