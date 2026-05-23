# Architecture Decision Record — ADR-02

**fecha:** 2026-05-22  
**autor:** Jefferson Daniel Flores Montenegro  
**estado:** activo  
**relacionado con:** spec02, spec03, spec04, spec05, spec06, spec07

---

## Decisiones de Arquitectura: Fórmulas, Herramientas, Tecnología y Patrones

Este ADR documenta las decisiones de diseño tomadas al especificar los módulos de simulación de elegibilidad, matchmaking, ledger de trazabilidad, agente legal RAG y analítica PadronRUC. El objetivo es dejar registro del razonamiento detrás de cada elección para guiar implementaciones futuras.

---

## ADR-02-01: Modelo de Scoring de Elegibilidad — Lineal Ponderado vs ML

**Decisión:** Usar un modelo lineal ponderado (`V_final = ΣWi × Xi`) en lugar de un modelo de Machine Learning (regresión o red neuronal).

**Contexto:** El Score de Elegibilidad ZEEP es un insumo legal-regulatorio que el inversor usa para tomar decisiones de capital. Necesita ser explicable, auditable y reproducible.

**Razones:**
1. **Interpretabilidad obligatoria:** Los reguladores (MINCETUR, APN) pueden exigir explicación del puntaje. Un modelo de caja negra no es aceptable en contexto legal.
2. **Cold-start data:** En la fase MVP no hay suficientes inversiones históricas para entrenar un modelo ML con validez estadística (mínimo estimado: 500+ perfiles para regresión estable).
3. **Auditoría:** Los pesos Wi están documentados en este ADR y son revisables por el comité CIP/CAL; un modelo ML requiere proceso de validación adicional.
4. **Calibración iterativa:** Los pesos pueden ajustarse manualmente conforme se acumule feedback institucional, sin re-entrenamiento.

**Consecuencia:** Revisar la decisión en Q1 2027 cuando el Ledger acumule ≥ 500 perfiles completados. En ese momento, evaluar XGBoost con SHAP values para mantener interpretabilidad.

---

## ADR-02-02: Pesos del Modelo de Elegibilidad por Sector

**Decisión:** Pesos específicos para el modelo base y los deltas sectoriales (valores en spec02).

**Contexto:** Los pesos deben reflejar la realidad de la Ley ZEEP N° 32449 y el criterio del Operador ZEEP Chancay.

**Calibración inicial:**
- `W1=0.45` (Alineación sectorial): mayor peso porque sin actividad habilitada no hay elegibilidad, independientemente del resto
- `W2=0.25` (Velocidad): la plataforma promete reducir time-to-market; el score debe incentivar proyectos ágiles
- `W3=0.30` (Factor de zona): refleja la ventaja competitiva del puerto Chancay y penaliza proyectos geográficamente alejados
- `W4=0.20` (CL): refleja el requisito de 30% de componentes locales para 0% IR de la Ley 32449

**Fuente de calibración:** Entrevistas con el equipo legal de MINCETUR y el Operador ZEEP (primera iteración). Sujeto a ajuste post-piloto.

**Consecuencia:** Los pesos deben estar en una tabla de configuración en BD (no hardcoded), para poder ajustarlos sin despliegue.

---

## ADR-02-03: ChromaDB vs pgvector para el RAG Legal

**Decisión:** Usar ChromaDB para el almacenamiento vectorial del Agente Legal RAG, con pgvector como alternativa de fallback y para búsqueda semántica en PadronRUC.

**Contexto:** El sistema RAG requiere búsqueda vectorial de alta precisión sobre ~50,000 chunks normativos. PostgreSQL ya es la BD principal.

**Evaluación:**

| Criterio | ChromaDB | pgvector |
|---|---|---|
| Precisión de búsqueda ANN | Alta (HNSW nativo) | Alta (IVFFlat/HNSW) |
| Facilidad de uso en Python | Alta (API simplificada) | Media (requiere SQLAlchemy custom) |
| Gestión de metadatos y filtros | Nativa (metadata filtering) | SQL estándar (más flexible) |
| Mantenimiento operativo | Proceso separado (Docker) | Extensión PostgreSQL (un servicio menos) |
| Escalabilidad | Limitada en local (no distribuida) | Limitada en local |
| Cold-start / prototipo | Muy rápido | Requiere más setup |

**Decisión:** ChromaDB para el RAG legal (velocidad de prototipado, API simplificada para el equipo). pgvector para búsqueda semántica en PadronRUC (spec07) porque ya está en PostgreSQL y el volumen es manejable (~10M registros con embeddings de descripción breve).

**Consecuencia:** Dos sistemas de vectores en el stack. En Q2 2026, si ChromaDB genera complejidad operativa, migrar RAG a pgvector y unificar.

---

## ADR-02-04: Patrón Supervisor-Worker para Orquestación de Agentes

**Decisión:** Implementar el patrón Supervisor-Worker (Agente Orquestador → Pool de Agentes Especialistas) con comunicación estrictamente vertical.

**Contexto:** El sistema tiene 5 agentes especializados (Legal, Matchmaker, Auditor, Técnico, Financiero) que deben colaborar sin acoplarse entre sí.

**Razones:**
1. **Trazabilidad:** Si los agentes se comunican en mesh, depurar el flujo de una respuesta es inviable. Con comunicación vertical, el Orquestador es el único punto de control.
2. **Independencia de desarrollo:** Cada agente puede desarrollarse, testearse y mejorarse de forma aislada; solo el Orquestador conoce cuándo activar cada uno.
3. **Política de Alucinación Cero:** El Agente Auditor siempre es el último eslabón, lo que es posible solo si el flujo es lineal (Orquestador → Especialista → Auditor → Orquestador).
4. **Escalabilidad futura:** Si un agente necesita ser ejecutado en un worker separado (queue), el Orquestador es el único punto que necesita saber esto.

**Restricción implementada:** Los agentes especialistas NO tienen acceso al `AgentPool` del Orquestador. Cada uno recibe solo su contexto específico como input y retorna solo su output tipado.

---

## ADR-02-05: Proveedor LLM Primario — Groq vs OpenAI vs Claude

**Decisión:** Groq como proveedor LLM primario (Llama 3.3 70B), con Google Gemini 1.5 Flash como fallback. Claude API reservado para casos de alta complejidad (validaciones legales críticas).

**Contexto:** El sistema hace múltiples llamadas LLM por cada flujo de usuario (scoring → profiling → matchmaking → legal RAG). El costo y la latencia son factores clave en MVP.

**Evaluación:**

| Criterio | Groq (Llama 70B) | OpenAI GPT-4o | Claude Sonnet | Gemini Flash |
|---|---|---|---|---|
| Latencia | Muy baja (inference acelerada) | Media | Media | Baja |
| Costo por token | Muy bajo | Alto | Alto | Bajo |
| Calidad (legal español) | Alta | Muy alta | Muy alta | Alta |
| Disponibilidad API | Alta | Alta | Alta | Alta |
| Rate limits MVP | Suficiente | Suficiente | Limitado (tier 1) | Suficiente |

**Decisión:** Groq para el 90% de las llamadas (matchmaking, scoring, perfiles). Claude API solo para validaciones legales donde la calidad supera el costo (Agente Auditor en consultas con confidence < 0.70).

**Consecuencia:** `LLMProvider` protocol en `domain/llm.py` es crítico para poder switchear sin cambios en los agentes. Cada agente recibe el proveedor por inyección de dependencias.

---

## ADR-02-06: Estrategia de Chunking para el RAG Legal

**Decisión:** RecursiveCharacterTextSplitter con `chunk_size=512 tokens`, `chunk_overlap=64 tokens`, preservando artículos como unidad mínima.

**Contexto:** Los documentos legales tienen estructura jerárquica (Título → Capítulo → Artículo → Inciso). Los chunks deben ser coherentes con esta estructura.

**Razones:**
1. **Artículo como unidad mínima:** Partir un artículo entre dos chunks elimina el contexto legal y genera alucinaciones. Se prohíbe romper un artículo salvo que supere 512 tokens.
2. **Overlap de 64 tokens:** Necesario para capturar referencias cruzadas ("según lo dispuesto en el artículo anterior") que aparecen al inicio de un artículo.
3. **512 tokens:** Equilibrio entre contexto suficiente y costo de embedding. Modelos de embedding tienen ventana de 512-8192 tokens; 512 maximiza precisión de similitud.

**Metadatos obligatorios por chunk:** `fuente`, `norma`, `articulo`, `fecha_vigencia`, `derogado` (bool). Sin metadatos, el Agente Auditor no puede verificar vigencia.

---

## ADR-02-07: Inmutabilidad del Ledger — Hashing en Aplicación vs Blockchain Externo

**Decisión:** Implementar inmutabilidad mediante hashing encadenado SHA-256 en la capa de aplicación sobre PostgreSQL, sin blockchain externo.

**Contexto:** El Ledger necesita ser auditable e inmutable. La opción máxima sería una blockchain pública o permisionada; la mínima sería solo timestamps.

**Evaluación:**

| Enfoque | Costo operativo | Auditabilidad | Velocidad escritura | Complejidad |
|---|---|---|---|---|
| Blockchain pública | Muy alto | Máxima | Lenta | Muy alta |
| Hyperledger (permisionada) | Alto | Alta | Media | Alta |
| Hash encadenado en PostgreSQL | Bajo | Alta (verificable) | Rápida | Baja |
| Solo timestamps | Ninguno | Baja | Rápida | Ninguna |

**Decisión:** Hash encadenado en PostgreSQL. Suficiente para la auditoría requerida por MINCETUR y el Operador ZEEP en la fase MVP. La clave es que el hash es **verificable públicamente** con el endpoint `/verify`, sin depender de terceros.

**Consecuencia:** Restricciones a nivel de BD (trigger NO UPDATE, RLS) son obligatorias. Sin ellas, la inmutabilidad es solo de aplicación y no resiste acceso directo a la BD.

---

## ADR-02-08: Estrategia de Ingesta PadronRUC — API SUNAT vs Descarga Bulk

**Decisión:** Descarga mensual del archivo bulk PadronRUC (TXT público de SUNAT) en lugar de consultas por RUC vía API.

**Contexto:** El PadronRUC tiene ~10M de registros. El módulo analítico necesita el padrón completo para análisis territorial, no solo consultas individuales.

**Razones:**
1. **API SUNAT (consulta individual):** Solo retorna datos de un RUC a la vez. Hacer 10M de consultas es inviable (rate limits, costo).
2. **Archivo bulk:** SUNAT publica mensualmente el PadronRUC completo como archivo TXT de descarga libre. Contiene todos los campos necesarios.
3. **Performance analítica:** Con el padrón en PostgreSQL local, las queries analíticas son instantáneas vs miles de llamadas API.
4. **Complementariedad con SUNARP:** El driver SUNARP (spec01) ya maneja consultas individuales para validación en tiempo real. PadronRUC cubre el análisis territorial masivo.

**Consecuencia:** Latencia de datos: máximo 1 mes de retraso en el padrón. Para validaciones individuales en tiempo real (spec04), se sigue usando el driver SUNARP + API CIP/CAL.

---

## ADR-02-09: Modelo de Predicción de Demanda CIP — Regresión Lineal Simple en Cold-Start

**Decisión:** Usar regresión lineal simple con 3 variables (`D_t`, `ΔInversionPipeline`, `ΔScorePromedio`) para la predicción de demanda de ingenieros CIP durante cold-start, usando datos históricos de PRODUCE/MINCETUR.

**Contexto:** El módulo analítico (spec07) incluye predicción de demanda de ingenieros CIP por especialidad. En el MVP no hay datos históricos propios.

**Razones:**
1. **Cold-start:** Sin 6 meses de datos propios del Ledger, cualquier modelo complejo sobreajustará ruido. La regresión lineal es honesta con datos escasos.
2. **Interpretabilidad:** El CIP Lima puede entender y cuestionar los coeficientes. Un modelo de cajas negras no generará confianza institucional.
3. **Datos de arranque:** PRODUCE y MINCETUR publican estadísticas sectoriales que sirven como proxy inicial de demanda histórica.

**Revisión:** Incorporar modelo ARIMA o Prophet en Q2 2027 cuando el Ledger tenga ≥ 12 meses de datos propios.

---

## ADR-02-10: Estrategia de Internacionalización del Agente Legal (ES/EN/ZH)

**Decisión:** El Agente Legal opera internamente en español (la base normativa es en español), detecta el idioma del usuario y traduce la respuesta final al idioma de la consulta.

**Contexto:** Los inversores chinos representan la audiencia principal inicial (contexto del puerto Chancay como joint venture con COSCO). Las respuestas deben estar disponibles en chino mandarín.

**Razones:**
1. **Base normativa en español:** Todas las leyes peruanas están en español. Traducir los chunks normativos a inglés o chino introduce riesgos de errores legales.
2. **Búsqueda más precisa en español:** Los embeddings en español sobre texto normativo español tienen mayor similitud coseno que embeddings multilingüe.
3. **Traducción de respuesta:** La respuesta generada (no los chunks fuente) es traducida al idioma del usuario. Los artículos citados se presentan en español con traducción del párrafo relevante.

**Implementación:** `langdetect` para detección de idioma → traducción de query a ES → RAG → respuesta en ES → traducción final a EN/ZH (LLM o DeepL API).
