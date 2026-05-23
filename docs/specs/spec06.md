# spec06 — LEGAL AI: Agente RAG Especializado en Legislación ZEEP

**nombre del módulo:** agente_legal_rag  
**flujo:** Transversal (disponible en todas las fases del roadmap)  
**objetivo:** Proveer consultoría legal y técnica 24/7 mediante un agente RAG que responde consultas sobre la Ley ZEEP N° 32449, normativas MINCETUR, decretos ambientales y regulaciones sectoriales, con política de Alucinación Cero.

---

## Descripción

El Agente Legal RAG es la capa cognitiva de conocimiento normativo de la plataforma. Implementa el patrón Supervisor-Worker: el Agente Orquestador recibe la consulta del usuario y delega al Agente Legal para recuperación semántica en ChromaDB, al Agente Auditor para validación de la respuesta y al Agente Técnico cuando la consulta requiere interpretación sectorial. El resultado es una respuesta con fuente normativa citada, nivel de confianza y flag de requerimiento de visado humano cuando la incertidumbre es alta.

---

## Arquitectura del Sistema RAG

```
[USUARIO] → consulta en lenguaje natural (ES | EN | ZH)
     ↓
[Agente Orquestador]
     ├─ Detección de idioma (langdetect)
     ├─ Clasificación de intención: legal | técnica | financiera | procedimental
     └─ Delegación al agente especialista correspondiente
          ↓
[Agente Legal]  ←──────────── [ChromaDB: base de conocimiento]
     ├─ Embedding de la consulta (EmbeddingProvider)
     ├─ Búsqueda vectorial: top-K chunks relevantes (K=5)
     ├─ Re-ranking por relevancia y fecha de vigencia
     ├─ Construcción del prompt con contexto normativo
     └─ Generación de respuesta (LLM con temperatura=0.1)
          ↓
[Agente Auditor]  ←──────── [Tabla de fuentes normativas verificadas]
     ├─ Verifica que cada afirmación tiene sustento en los chunks recuperados
     ├─ Asigna confidence_score [0-1]
     ├─ Si confidence < 0.70 → activa flag REQUIERE_VISADO_HUMANO
     └─ Añade citas de fuente (artículo, norma, fecha de vigencia)
          ↓
[RESPUESTA FINAL AL USUARIO]
     ├─ Texto de respuesta
     ├─ Fuentes citadas (norma, artículo, fecha)
     ├─ Confidence score
     └─ Badge: ✓ Verificado | ⚠ Requiere visado CIP/CAL
```

---

## Base de Conocimiento (ChromaDB)

### Colecciones

| Colección | Contenido | Fuente | Actualización |
|---|---|---|---|
| `ley_zeep_32449` | Texto completo Ley N° 32449 y su reglamento | MINCETUR / El Peruano | Versionado (solo crece) |
| `resoluciones_mincetur` | Resoluciones ministeriales ZEEP y zonas francas | MINCETUR web | Semanal (cron) |
| `normas_el_peruano` | Decretos, normas publicadas | El Peruano scraping | Diario (cron) |
| `normas_ambientales` | Regulaciones MINAM, SENACE: Anexo 4, EIA | MINAM web | Semanal |
| `normas_manufactura` | Estándares PRODUCE, INACAL para manufactura | PRODUCE / INACAL | Mensual |
| `normas_ckd` | Regulaciones aduaneras, aranceles CKD, SUNAT | SUNAT / MINCETUR | Mensual |
| `normas_tech` | Régimen CITE, Ley I+D+i, CONCYTEC, nube | CONCYTEC / PCM | Mensual |
| `jurisprudencia_zeep` | Precedentes administrativos y resoluciones APN | APN | Trimestral |

### Pipeline de Ingesta de Documentos

```
[FUENTE] → [Scraper/Downloader] → [TextExtractor] → [Chunker] → [Embedder] → [ChromaDB]

TextExtractor:
  - PDF → PyMuPDF (texto nativo) o Tesseract OCR (escaneos)
  - HTML → BeautifulSoup + limpieza de boilerplate

Chunker:
  - Estrategia: RecursiveCharacterTextSplitter
  - chunk_size = 512 tokens, chunk_overlap = 64 tokens
  - Preserva estructura: artículo/inciso como unidad mínima de chunk

Embedder:
  - Modelo primario: text-embedding-3-small (OpenAI) o nomic-embed-text (Groq)
  - Dimensión: 1536 (OpenAI) o 768 (nomic)
  - Metadatos por chunk: fuente, norma, artículo, fecha_vigencia, colección

ChromaDB:
  - Persistencia en volumen Docker
  - Índice HNSW para búsqueda ANN eficiente
```

---

## Política de Alucinación Cero

El Agente Auditor aplica las siguientes reglas antes de entregar la respuesta:

1. **Grounding obligatorio:** Cada párrafo de respuesta debe estar sustentado por al menos un chunk recuperado. Si no hay chunks relevantes → respuesta: *"No se encontró sustento normativo para esta consulta en la base de conocimiento vigente."*
2. **Confidence scoring:** Se calcula como la similitud coseno promedio de los top-K chunks con la consulta. Si `confidence < 0.70` → badge `⚠ Requiere visado CIP/CAL`.
3. **Fecha de vigencia:** El Auditor verifica que los chunks citados correspondan a normas vigentes (no derogadas). Chunks de normas derogadas son etiquetados y el Auditor advierte al usuario.
4. **Prohibición de especulación:** El prompt del Agente Legal incluye instrucción explícita: *"Nunca especules sobre la aplicación de una norma si no tienes el texto legal exacto en el contexto."*
5. **Escalamiento a visado humano:** Consultas con `confidence < 0.70` generan un ticket de revisión visible para el comité CIP/CAL de la plataforma.

---

## Pool de Agentes Especialistas

### Agente Legal
- **Especialidad:** Ley ZEEP N° 32449, reglamento MINCETUR, APN
- **Colecciones ChromaDB:** `ley_zeep_32449`, `resoluciones_mincetur`, `jurisprudencia_zeep`
- **Temperatura LLM:** 0.1 (respuestas deterministas)

### Agente Técnico
- **Especialidad:** Procesos industriales, normativas de manufactura, CKD, INACAL, SENACE
- **Colecciones ChromaDB:** `normas_manufactura`, `normas_ckd`, `normas_ambientales`
- **Activado cuando:** Clasificación de intención = técnica | procedimental + sector manufactura/CKD

### Agente Financiero
- **Especialidad:** Beneficios tributarios ZEEP, aranceles, proyecciones fiscales
- **Colecciones ChromaDB:** `ley_zeep_32449` (capítulos fiscales), `normas_ckd` (aranceles)
- **Activado cuando:** Consulta contiene keywords: IR, IGV, arancel, beneficio, exoneración

### Agente de I+D+i (Nuevo para Sector Tech)
- **Especialidad:** Régimen CITE, Ley de I+D+i, fondos CONCYTEC, nube soberana
- **Colecciones ChromaDB:** `normas_tech`
- **Activado cuando:** Sector del perfil = Servicios/Tech O consulta contiene keywords: investigación, CONCYTEC, CITE, innovación

### Agente Auditor
- **Rol:** Validación de todas las respuestas de agentes especialistas antes de entregar al usuario
- **Sin colección propia:** Opera sobre los chunks ya recuperados por el agente especialista
- **Output:** confidence_score, citas normativas validadas, flag REQUIERE_VISADO_HUMANO

---

## Reglas de Comunicación entre Agentes

Per ADR-02 y presentacion.md, los agentes NO se comunican horizontalmente:
- Los agentes especialistas no se llaman entre sí
- Solo el Agente Orquestador puede delegar a un especialista
- El Agente Auditor siempre es el último eslabón antes de retornar al Orquestador

---

## Flujo Paso a Paso

```
[PASO 1] Recepción de Consulta
  ├─ Endpoint: POST /api/v1/ai/query
  ├─ Payload: { "query": str, "investor_profile_id": UUID, "idioma": str }
  ├─ Requiere autenticación (Depends(get_current_user))
  └─ Añade contexto: sector del InvestorProfile + alertas activas del Ledger

[PASO 2] Agente Orquestador: Clasificación y Delegación
  ├─ Detecta idioma (langdetect o fasttext)
  ├─ Clasifica intención con prompt zero-shot (legal/técnica/financiera/procedimental)
  ├─ Determina agente(s) a activar (puede activar hasta 2 en paralelo)
  └─ Traduce consulta a español si está en EN o ZH (para búsqueda en ChromaDB)

[PASO 3] Agente Especialista: Recuperación RAG
  ├─ Genera embedding de la consulta traducida
  ├─ Búsqueda vectorial en colecciones correspondientes: top-5 chunks
  ├─ Re-ranking: ordena por (similitud coseno × factor_vigencia)
  └─ Construye prompt: [system_prompt] + [chunks como contexto] + [consulta del usuario]

[PASO 4] Generación de Respuesta (LLM)
  ├─ LLM primario: Groq (Llama 3.3 70B) con temperatura=0.1
  ├─ LLM fallback: Google GenAI (Gemini 1.5 Flash) si Groq no disponible
  ├─ Si respuesta en inglés/chino: responde en el idioma original de la consulta
  └─ Respuesta estructurada: texto + lista de artículos citados

[PASO 5] Agente Auditor: Validación
  ├─ Verifica grounding párrafo por párrafo
  ├─ Calcula confidence_score
  ├─ Verifica fechas de vigencia de normas citadas
  ├─ Si confidence < 0.70 → activa REQUIERE_VISADO_HUMANO
  └─ Añade citas formateadas: "Art. 15, Ley N° 32449 (vigente desde 2024-07-01)"

[PASO 6] Búsqueda Complementaria con Tavily (opcional)
  ├─ Activado si confidence < 0.85 Y la consulta menciona normativas post-2024
  ├─ Tavily busca en MINCETUR, El Peruano, SUNAT con la consulta como query
  ├─ Los resultados se pasan al Agente Auditor para validación adicional
  └─ No se mezclan con los chunks de ChromaDB directamente (pipeline separado)

[PASO 7] Respuesta Final al Usuario
  ├─ Texto de respuesta en idioma del usuario
  ├─ Sección "Fuentes Normativas Citadas" con links a El Peruano cuando disponible
  ├─ Confidence badge: ✓ Verificado (≥0.70) | ⚠ Requiere visado (< 0.70)
  └─ Botón: [Escalar a Abogado CAL] si confidence < 0.70

[PASO 8] Persistencia
  └─ ChatSession + ChatMessage guardados en PostgreSQL para historial y analítica
```

---

## API Endpoints

```
POST   /api/v1/ai/query          # Consulta al agente RAG
GET    /api/v1/ai/history        # Historial de consultas del usuario
POST   /api/v1/ai/escalate       # Escalar a revisión humana CIP/CAL
POST   /api/v1/ai/ingest/url     # Ingestar nueva URL en ChromaDB (admin)
POST   /api/v1/ai/ingest/pdf     # Ingestar PDF en ChromaDB (admin)
GET    /api/v1/ai/knowledge/stats # Estado de las colecciones ChromaDB
```

---

## Patrones de Diseño

- **Supervisor-Worker:** Agente Orquestador delega a pool de especialistas; no hay comunicación horizontal entre workers
- **Strategy Pattern:** `LLMProvider` protocol para Groq/Gemini/Claude con fallback automático
- **Factory Pattern:** `AgentFactory.create(intent_type)` instancia el agente especialista correcto
- **Decorator Pattern:** `ObservabilityDecorator` en cada llamada LLM: registra latencia, tokens usados, confidence scores

## Tests

- `test_query_legal_responde_con_cita`: consulta sobre Ley 32449 → respuesta contiene artículo citado
- `test_confidence_bajo_activa_flag_visado`: chunk con baja similitud → confidence < 0.70 → REQUIERE_VISADO_HUMANO=true
- `test_query_en_chino_respondida_en_chino`: consulta en ZH → respuesta en ZH (traducción interna transparente)
- `test_norma_derogada_advertida`: chunk con fecha_vigencia en el pasado → advertencia de norma derogada en respuesta
- `test_agente_idi_activado_sector_tech`: perfil sector=tech + consulta sobre CONCYTEC → Agente I+D+i activado
- `test_fallback_llm_groq_falla`: Groq no disponible → Gemini retorna respuesta válida
- `test_historial_guardado_postgresql`: 3 consultas → 3 ChatMessage en BD correctamente asociados al usuario
