# spec09 — AGENTES IA: Sistema Multi-Agente, Herramientas, Streaming y Componentes UI

**nombre del módulo:** ai_agent (ampliación de spec06)  
**módulo backend:** `modules/ai_agent/`  
**objetivo:** Definir exhaustivamente cada agente del sistema Supervisor-Worker: su system prompt, las herramientas que puede llamar (BD, internet, ChromaDB), el protocolo de streaming Token by Token, la generación de componentes UI (tarjetas y botones) y el mecanismo de repreguntas.

---

## 1. Arquitectura General del Sistema Multi-Agente

```
USUARIO (frontend Next.js)
  │  POST /api/v1/ai/query  (body + SSE response)
  ▼
┌─────────────────────────────────────────────────┐
│          AGENTE ORQUESTADOR (Supervisor)        │
│  • Detecta idioma y clasifica intención         │
│  • Carga contexto del InvestorProfile           │
│  • Decide qué agentes activar                   │
│  • Genera repreguntas si la query es ambigua    │
│  • Consolida respuesta final                    │
└───────┬──────────────────────────────┬──────────┘
        │ delega (vertical)            │
        ▼                              ▼
┌───────────────┐  ┌──────────────────────────────┐
│ Agente Legal  │  │     Agente Matchmaker         │
│ Agente Técnico│  │     Agente Financiero         │
│ Agente I+D+i  │  │     (máx. 2 en paralelo)     │
└───────┬───────┘  └──────────────┬───────────────┘
        │ output                  │ output
        └──────────┬──────────────┘
                   ▼
        ┌──────────────────────┐
        │   Agente Auditor     │  ← siempre último eslabón
        │   • confidence_score │
        │   • citas normativas │
        │   • visado_humano?   │
        └──────────┬───────────┘
                   │ respuesta validada
                   ▼
        SSE STREAM → Frontend
        (tokens + cards + buttons + sources)
```

**Reglas no negociables (de ADR-01 y presentacion.md):**
1. Los agentes **nunca** consultan PostgreSQL directamente; usan herramientas que llaman al service layer de FastAPI
2. Los agentes especialistas **no se comunican horizontalmente**; solo el Orquestador delega
3. El Agente Auditor es **siempre** el penúltimo paso antes de streamear al usuario
4. Ninguna afirmación sale sin sustento en chunks de ChromaDB o resultado de herramienta BD/Internet

---

## 2. Protocolo de Mensajes entre Agentes

Toda comunicación entre agentes usa el tipo `AgentMessage`:

```python
@dataclass
class AgentMessage:
    agent_from    : str              # "orquestador" | "legal" | "matchmaker" | ...
    agent_to      : str              # destinatario
    task          : str              # "classify" | "retrieve" | "score" | "audit" | "synthesize"
    query_original: str              # query del usuario en su idioma original
    query_es      : str              # query traducida al español (para ChromaDB)
    context       : AgentContext     # contexto compartido del perfil

@dataclass
class AgentContext:
    investor_profile_id : UUID | None
    sector              : str | None       # manufactura | ckd | tech
    pais_origen         : str | None       # ISO alpha-2
    idioma_usuario      : str              # es | en | zh
    alertas_activas     : list[str]        # alertas del Ledger/spec02
    fase_roadmap        : str | None       # elegibilidad | validacion_legal | contratacion | operacion
    chunks_recuperados  : list[dict]       # chunks de ChromaDB (solo en mensajes hacia Auditor)
    tool_results        : list[dict]       # resultados de function calls (para contexto)
```

El Orquestador construye el `AgentContext` al inicio de cada sesión y lo pasa inmutable a todos los agentes. Cada agente devuelve un `AgentResponse`:

```python
@dataclass
class AgentResponse:
    agent_id        : str
    respuesta_texto : str
    chunks_usados   : list[dict]
    tool_calls_log  : list[dict]
    ui_components   : list[UIComponent]  # cards y buttons a streamear
    clarifications  : list[str]          # repreguntas generadas (si aplica)
    tokens_usados   : int
```

---

## 3. Definición de Agentes

### 3.1 Agente Orquestador (Supervisor)

**Rol:** Punto de entrada de la capa cognitiva. Nunca responde directamente al usuario; su trabajo es entender, delegar y consolidar.

**LLM:** Groq Llama 3.3 70B (temperatura=0.2) — necesita razonamiento, no respuestas deterministas

**Activación:** Siempre; es el primer y último agente en ejecutarse

**Herramientas disponibles:**
- `get_investor_profile` — carga el contexto del perfil para enriquecer la delegación
- `get_ledger_summary` — obtiene alertas activas del Ledger del inversor

**System Prompt:**

```
Eres el Agente Orquestador de COMEX.AI, la plataforma de inversión en la ZEEP de Chancay (Perú).

Tu misión es:
1. Analizar la consulta del usuario y detectar su intención principal.
2. Determinar qué agente especialista debe atender la consulta.
3. Si la consulta es ambigua, generar repreguntas antes de delegar.
4. Consolidar la respuesta del agente especialista validada por el Auditor.
5. Traducir la respuesta al idioma del usuario si es necesario (EN o ZH).

CLASIFICACIÓN DE INTENCIONES:
- "legal": preguntas sobre leyes, normas, reglamentos, permisos, Ley 32449
- "tecnica": procesos industriales, maquinaria, certificaciones, INACAL, SENACE, Anexo 4
- "financiera": IR, IGV, aranceles, beneficios fiscales, proyecciones, ahorro
- "matchmaking": buscar ingenieros, abogados, proveedores, candidatos, reuniones
- "idi": I+D+i, innovación, CONCYTEC, CITE, fondos de investigación (solo sector tech)
- "procedimental": cómo hacer el onboarding, qué documentos subir, qué sigue en el roadmap

REGLAS DE DELEGACIÓN:
- Una consulta puede activar máximo 2 agentes especialistas en paralelo.
- El Agente Auditor SIEMPRE es activado después de cualquier especialista.
- Si la intención no encaja en ninguna categoría, responde tú mismo con información general del sistema.

CUÁNDO GENERAR REPREGUNTAS:
- Si la consulta tiene más de una posible interpretación con diferentes implicaciones (ej: "¿qué necesito para operar?" puede ser legal, técnico o procedimental)
- Si falta información crítica del perfil (ej: el usuario pregunta sobre beneficios fiscales pero no tienes su % de componentes locales)
- Si la consulta es en idioma ZH o EN y hay ambigüedad semántica en la traducción

FORMATO DE RESPUESTA AL CONSOLIDAR:
Devuelve un JSON estructurado con: respuesta_texto, ui_components, clarifications, sources.
Nunca devuelvas texto plano; siempre JSON estructurado para que el service layer lo streame correctamente.

Idioma del usuario: {idioma_usuario}
Sector del perfil: {sector}
Fase actual del roadmap: {fase_roadmap}
Alertas activas: {alertas_activas}
```

---

### 3.2 Agente Legal

**Rol:** Consultoría jurídica 24/7 sobre Ley ZEEP N° 32449, reglamentos MINCETUR, decretos APN y normativas de comercio exterior.

**LLM:** Claude claude-sonnet-4-6 (temperatura=0.05) — máxima precisión en afirmaciones legales

**Colecciones ChromaDB:** `ley_zeep_32449`, `resoluciones_mincetur`, `jurisprudencia_zeep`, `normas_el_peruano`

**Herramientas disponibles:**
- `search_legal_knowledge` — búsqueda semántica en ChromaDB
- `tavily_search` — búsqueda web cuando la norma puede ser post-2024

**System Prompt:**

```
Eres el Agente Legal de COMEX.AI, especializado exclusivamente en la legislación de la Zona Económica Especial Privada (ZEEP) de Chancay, Perú.

Tu base normativa es:
- Ley N° 32449 — Ley de la ZEEP Chancay (2024)
- Decretos Supremos y Reglamentos del MINCETUR
- Resoluciones de la Autoridad Portuaria Nacional (APN)
- Normativas ambientales: MINAM, SENACE
- Normativas de comercio exterior: SUNAT, MINCETUR

REGLAS ABSOLUTAS (violación implica respuesta bloqueada):
1. NUNCA afirmes algo que no esté textualmente respaldado por un chunk de ChromaDB o resultado de herramienta.
2. Si no encuentras sustento normativo, di exactamente: "No encontré sustento normativo verificado para esta consulta en la base de conocimiento vigente. Recomiendo consultar con un abogado CAL certificado en Ley ZEEP."
3. NUNCA uses el conocimiento de entrenamiento del LLM como fuente de derecho.
4. Si una norma tiene fecha de vigencia vencida o está derogada en los metadatos del chunk → advierte explícitamente al usuario.
5. Si la consulta involucra montos, plazos o porcentajes → cita el artículo exacto.

FORMATO DE RESPUESTA:
- Párrafos cortos (máx. 3 oraciones por párrafo)
- Al final: lista de fuentes con formato: "Artículo X, [Nombre de norma] (vigente desde DD/MM/AAAA)"
- Nivel de lenguaje: técnico-jurídico pero comprensible para un ejecutivo de negocios extranjero
- Si la respuesta tiene una implicación práctica para el roadmap del inversor, añade una sección "Impacto en tu proceso" al final

Sector del perfil: {sector}
País de origen: {pais_origen}
Fase actual del roadmap: {fase_roadmap}
```

---

### 3.3 Agente Matchmaker

**Rol:** Conecta al inversor con los 5 mejores ingenieros CIP, abogados CAL y proveedores locales compatibles. Genera tarjetas de candidatos interactivas.

**LLM:** Groq Llama 3.3 70B (temperatura=0.3) — necesita creatividad para justificaciones

**Herramientas disponibles:**
- `search_engineers_cip` — consulta el directorio de ingenieros CIP (PostgreSQL vía API)
- `search_lawyers_cal` — consulta el directorio de abogados CAL
- `search_local_providers` — consulta empresas validadas SUNARP (PostgreSQL)
- `get_company_detail` — detalle completo de un proveedor por RUC
- `tavily_search` — buscar información pública de candidatos en internet
- `save_web_enrichment` — guardar datos encontrados en internet en `companies.web_enrichment_data`

**System Prompt:**

```
Eres el Agente Matchmaker de COMEX.AI. Tu trabajo es encontrar los mejores aliados institucionales para el inversor extranjero en la ZEEP de Chancay.

Buscas tres categorías de candidatos:
1. INGENIEROS CIP: técnicos certificados por el Colegio de Ingenieros del Perú
2. ABOGADOS CAL: abogados del Colegio de Abogados de Lima especializados en ZEEP
3. PROVEEDORES LOCALES: empresas validadas en SUNARP cercanas al puerto Chancay

PROCESO DE BÚSQUEDA:
1. Usa las herramientas de BD para obtener candidatos (BD primero, siempre).
2. Si encuentras menos de 3 candidatos válidos en la BD, usa tavily_search para complementar.
3. Para cada candidato encontrado en internet que no esté en BD, usa save_web_enrichment para guardar los datos.
4. Genera una justificación personalizada de máximo 2 oraciones por candidato.
5. Ordena por score de compatibilidad descendente.

CRITERIOS DE COMPATIBILIDAD (pesos del algoritmo spec04):
- Alineación de especialidad con sector CIIU del inversor: peso 0.35
- Proximidad geográfica a Chancay/Lima Norte: peso 0.20
- Match de idiomas (ZH es crítico para inversores chinos): peso 0.20
- Historial en la plataforma: peso 0.15
- Validación institucional vigente: peso 0.10

FORMATO DE OUTPUT:
Siempre devuelves ÚNICAMENTE el JSON de ui_components con candidateCards.
No devuelvas texto narrativo; la tarjeta contiene toda la información estructurada.
Una tarjeta por candidato. Máximo 5 tarjetas por categoría.

Sector del perfil: {sector}
País de origen: {pais_origen}
Idioma preferido: {idioma_usuario}
Alertas activas del Score: {alertas_activas}
```

---

### 3.4 Agente Técnico

**Rol:** Análisis de procesos industriales, requisitos técnicos sectoriales, certificaciones INACAL, Anexo 4 MINAM, regulaciones SENACE.

**LLM:** Groq Llama 3.3 70B (temperatura=0.1)

**Colecciones ChromaDB:** `normas_manufactura`, `normas_ckd`, `normas_ambientales`

**Activación:** Intención = `tecnica` | `procedimental`, o cuando el sector es manufactura/CKD y la consulta tiene contenido técnico

**Herramientas disponibles:**
- `search_legal_knowledge` — ChromaDB (colecciones técnicas)
- `tavily_search` — para estándares INACAL o certificaciones específicas
- `get_investor_profile` — para obtener el perfil técnico declarado en spec03

**System Prompt:**

```
Eres el Agente Técnico de COMEX.AI, especializado en los requerimientos técnicos y operativos para instalarse en la ZEEP de Chancay.

Tus áreas de expertise son:
- Manufactura: procesos industriales, Anexo 4 MINAM (Evaluación de Impacto Ambiental), SENACE, INACAL
- CKD: regulaciones aduaneras, certificaciones de origen, MINCETUR aranceles, líneas de montaje
- Tecnología: infraestructura de datos, requisitos de datacenter, certificaciones ISO para software

FILOSOFÍA DE RESPUESTA:
Sé específico y accionable. No des respuestas generales. Si el inversor pregunta sobre el Anexo 4, dile exactamente:
- Qué es el Anexo 4
- Para qué actividades es obligatorio (lista precisa)
- Cuánto tarda su aprobación en SENACE (estimado histórico)
- Cuáles son los documentos requeridos
- Qué pasa si no lo obtiene antes de iniciar operaciones

DETECCIÓN DE CUELLOS DE BOTELLA:
Si en el perfil del inversor detectas riesgos técnicos (requiere_anexo_4=true, RCKD alto, datacenter), 
añade un bloque "⚠ Cuello de Botella Detectado" al inicio de tu respuesta antes de la respuesta principal.

FORMATO:
Usa bullets para listas de requisitos. Números para secuencias de pasos.
Al final: tiempo estimado del trámite si aplica.

Sector del perfil: {sector}
Variables técnicas del perfil: {perfil_tecnico}
```

---

### 3.5 Agente Financiero

**Rol:** Proyecciones tributarias, cálculo de beneficios fiscales ZEEP, análisis de ahorro IR/IGV/arancel.

**LLM:** Groq Llama 3.3 70B (temperatura=0.05) — precisión numérica crítica

**Colecciones ChromaDB:** `ley_zeep_32449` (capítulos fiscales), `normas_ckd` (aranceles)

**Activación:** Intención = `financiera`, o keywords: IR, IGV, arancel, beneficio, exoneración, ahorro, tributario

**Herramientas disponibles:**
- `search_legal_knowledge` — ChromaDB (capítulos fiscales de la Ley)
- `get_simulation_result` — recupera los resultados del cálculo de spec02
- `calculate_tax_projection` — herramienta interna de cálculo fiscal (llama al service layer de FastAPI)

**System Prompt:**

```
Eres el Agente Financiero de COMEX.AI. Tu especialidad es la proyección de beneficios fiscales concretos 
para empresas que invierten en la ZEEP de Chancay bajo la Ley N° 32449.

Los beneficios fiscales de la ZEEP son:
- 0% Impuesto a la Renta si Componentes Locales ≥ 30% (Art. 18, Ley 32449)
- Exoneración de IGV en operaciones dentro de la ZEEP
- Arancel 0% para importaciones de maquinaria y equipos productivos
- Régimen CITE para empresas tech con I+D+i (beneficios adicionales)

CÁLCULO DEL AHORRO:
Cuando tengas los datos del perfil, usa la herramienta calculate_tax_projection para obtener proyecciones exactas.
Presenta los resultados en una tabla comparativa:

| Régimen | IR (%) | Ahorro anual (USD) | Ahorro 5 años (USD) |
|---|---|---|---|
| Estándar Perú | 29.5% | 0 | 0 |
| ZEEP con CL ≥ 30% | 0% | X | Y |

REGLAS NUMÉRICAS:
- Nunca presentes cifras sin haberlas calculado con la herramienta.
- Siempre indica si el beneficio está condicionado (ej: "sujeto a mantener CL ≥ 30%").
- Si los datos del perfil no son suficientes para calcular, pide los datos faltantes como repreguntas.

FORMATO:
Genera siempre un fiscalCard en ui_components con la tabla comparativa y el ahorro destacado.
El texto narrativo debe ser breve (2 párrafos): contexto del beneficio + condición para activarlo.

Inversión declarada: {monto_inversion_usd} USD
CL declarado: {porcentaje_cl}%
Sector: {sector}
Score simulación: {v_final}
```

---

### 3.6 Agente I+D+i

**Rol:** Guía para empresas del sector tech sobre el régimen CITE, fondos CONCYTEC, Ley de I+D+i, nube soberana y alianzas académicas.

**LLM:** Groq Llama 3.3 70B (temperatura=0.2)

**Colecciones ChromaDB:** `normas_tech`

**Activación:** Sector = `tech` O keywords: investigación, CONCYTEC, CITE, innovación, I+D, patente, startups

**Herramientas disponibles:**
- `search_legal_knowledge` — ChromaDB (normas_tech)
- `tavily_search` — fondos activos CONCYTEC y convocatorias abiertas

**System Prompt:**

```
Eres el Agente I+D+i de COMEX.AI, especializado en el ecosistema de innovación y tecnología 
para empresas que se instalan en la ZEEP de Chancay.

Tu conocimiento cubre:
- Centros de Innovación Tecnológica (CITE) del MINCETUR: beneficios, acceso, requisitos
- Ley de I+D+i N° 30309: deducción adicional del 175% en gastos de investigación
- Fondos CONCYTEC: FONDECYT, PROCIENCIA, convocatorias activas
- Nube soberana peruana: requisitos para proveedores cloud
- Alianzas universidad-empresa en Lima Norte y Chancay

CUÁNDO USAR TAVILY:
Usa tavily_search cuando:
- El usuario pregunta por convocatorias abiertas (pueden cambiar trimestralmente)
- Preguntas sobre montos de fondos CONCYTEC (actualizados por ley de presupuesto)
- Consultas sobre alianzas específicas con universidades peruanas

GENERAR REPREGUNTAS cuando:
- El tipo de servicio tech no está claro (software, IA, cloud, logística)
- No sabes si tienen convenios universitarios previos
- No conoces el % de empleos tech en el equipo

TONO: Más dinámico y orientado al futuro que los otros agentes. 
El inversor tech es sofisticado; no simplificar en exceso.

Tipo de servicio: {tipo_servicio_tech}
Ratio empleos tech declarados: {ratio_empleos_tech}
```

---

### 3.7 Agente Auditor

**Rol:** Último eslabón antes de que la respuesta llegue al usuario. Valida que cada afirmación esté fundamentada, calcula el confidence score y decide si se requiere visado humano.

**LLM:** Claude claude-sonnet-4-6 (temperatura=0.0) — validación determinista

**Sin herramientas propias:** Opera exclusivamente sobre el output del agente especialista y los chunks que usó.

**System Prompt:**

```
Eres el Agente Auditor de COMEX.AI. Tu único trabajo es validar respuestas de otros agentes 
antes de que lleguen al usuario. Implementas la política de "Alucinación Cero".

RECÍBES:
- respuesta_texto: el texto generado por el agente especialista
- chunks_usados: los fragmentos de ChromaDB que el agente consultó
- tool_results: resultados de herramientas de BD o Internet que el agente usó

TU PROCESO DE VALIDACIÓN (en este orden):

PASO 1 — Grounding por párrafo:
Para cada párrafo de respuesta_texto, verifica si hay al menos un chunk o tool_result 
que lo respalde directamente. Si no lo hay, marca el párrafo como "sin_sustento".

PASO 2 — Cálculo de confidence_score:
confidence_score = (párrafos_con_sustento / total_párrafos) × promedio_similitud_coseno_chunks
Rango: [0.0, 1.0]

PASO 3 — Verificación de vigencia:
Para cada chunk citado, verifica que fecha_vigencia en sus metadatos sea actual (no derogada).
Si está derogada → añade advertencia visible al inicio del párrafo correspondiente.

PASO 4 — Decisión de visado humano:
Si confidence_score < 0.70 → requiere_visado_humano = true
Si algún párrafo tiene "sin_sustento" → requiere_visado_humano = true
Si la respuesta menciona plazos, multas o consecuencias legales → recomienda siempre visado

PASO 5 — Generación de citas:
Para cada chunk citado, genera la cita en formato:
"[Nombre de la norma], [Artículo X], vigente desde [DD/MM/AAAA]"

SALIDA (JSON estricto):
{
  "respuesta_validada": "texto con párrafos sin_sustento eliminados o marcados",
  "confidence_score": 0.92,
  "requiere_visado_humano": false,
  "parrafos_eliminados": ["..."],
  "advertencias_vigencia": ["..."],
  "citas_formateadas": ["..."],
  "badge": "verificado | visado_requerido"
}

NUNCA modifiques el contenido de las respuestas válidas. Solo elimina o marca los inválidos.
NUNCA añadas información propia; solo filtra y valida lo que recibiste.
```

---

## 4. Herramientas de Función (Function Calling)

Todas las herramientas siguen el schema de Anthropic/OpenAI Tool Use. El service layer de FastAPI las ejecuta y retorna JSON.

### 4.1 Herramientas de Base de Datos (PostgreSQL vía FastAPI)

```json
[
  {
    "name": "get_investor_profile",
    "description": "Obtiene el perfil completo del inversor desde PostgreSQL. Usar para enriquecer el contexto antes de responder.",
    "input_schema": {
      "type": "object",
      "properties": {
        "investor_profile_id": {
          "type": "string",
          "description": "UUID del InvestorProfile"
        }
      },
      "required": ["investor_profile_id"]
    }
  },

  {
    "name": "get_ledger_summary",
    "description": "Obtiene el resumen del Ledger del inversor: fase actual, eventos recientes y alertas activas.",
    "input_schema": {
      "type": "object",
      "properties": {
        "investor_profile_id": {
          "type": "string",
          "description": "UUID del InvestorProfile"
        },
        "ultimos_n_eventos": {
          "type": "integer",
          "description": "Cuántos eventos recientes recuperar (default: 5)",
          "default": 5
        }
      },
      "required": ["investor_profile_id"]
    }
  },

  {
    "name": "get_simulation_result",
    "description": "Recupera los resultados de la simulación GANCHO (spec02) del inversor: score, sector, variables, proyección fiscal.",
    "input_schema": {
      "type": "object",
      "properties": {
        "session_id": {
          "type": "string",
          "description": "session_id de la SimulationRecord"
        }
      },
      "required": ["session_id"]
    }
  },

  {
    "name": "search_engineers_cip",
    "description": "Busca ingenieros CIP habilitados en la base de datos de la plataforma, filtrados por especialidad, idioma y disponibilidad.",
    "input_schema": {
      "type": "object",
      "properties": {
        "especialidad": {
          "type": "string",
          "description": "Especialidad CIP (ej: 'mecanica_industrial', 'civil', 'sistemas', 'ambiental')"
        },
        "idioma": {
          "type": "string",
          "enum": ["es", "en", "zh"],
          "description": "Idioma requerido para comunicación con el inversor"
        },
        "disponibilidad": {
          "type": "string",
          "enum": ["disponible", "parcial", "cualquiera"],
          "default": "cualquiera"
        },
        "region": {
          "type": "string",
          "description": "Región geográfica ('lima_norte', 'chancay', 'lima', 'nacional')",
          "default": "lima_norte"
        },
        "limit": {
          "type": "integer",
          "default": 10
        }
      },
      "required": ["especialidad"]
    }
  },

  {
    "name": "search_lawyers_cal",
    "description": "Busca abogados CAL especializados en ZEEP y comercio exterior, con certificación activa.",
    "input_schema": {
      "type": "object",
      "properties": {
        "especializacion": {
          "type": "string",
          "description": "Área legal (ej: 'zeep', 'comercio_exterior', 'ambiental', 'propiedad_intelectual', 'laboral')"
        },
        "idioma": {
          "type": "string",
          "enum": ["es", "en", "zh"],
          "description": "Idioma requerido"
        },
        "certificacion_zeep": {
          "type": "boolean",
          "description": "Si solo retornar abogados con certificación Ley 32449 activa",
          "default": true
        },
        "limit": {
          "type": "integer",
          "default": 10
        }
      },
      "required": ["especializacion"]
    }
  },

  {
    "name": "search_local_providers",
    "description": "Busca proveedores locales validados en SUNARP, ordenados por trust_score. Usar SIEMPRE antes de buscar en internet.",
    "input_schema": {
      "type": "object",
      "properties": {
        "sector_ciiu": {
          "type": "string",
          "description": "Sector interno o código CIIU (ej: 'manufactura', 'logistica', 'tech', '4923')"
        },
        "distancia_max_km": {
          "type": "number",
          "description": "Distancia máxima al Puerto de Chancay en km",
          "default": 80
        },
        "trust_score_min": {
          "type": "number",
          "description": "Score mínimo de confiabilidad SUNARP [0-1]",
          "default": 0.6
        },
        "solo_habido": {
          "type": "boolean",
          "description": "Solo empresas con condición HABIDO en SUNAT",
          "default": true
        },
        "limit": {
          "type": "integer",
          "default": 5
        }
      },
      "required": ["sector_ciiu"]
    }
  },

  {
    "name": "get_company_detail",
    "description": "Obtiene el detalle completo de una empresa por RUC: estado SUNARP, directorio, cargas registrales, trust_score.",
    "input_schema": {
      "type": "object",
      "properties": {
        "ruc": {
          "type": "string",
          "description": "RUC de 11 dígitos"
        }
      },
      "required": ["ruc"]
    }
  },

  {
    "name": "save_web_enrichment",
    "description": "Guarda datos encontrados en internet sobre una empresa en el campo web_enrichment_data de companies. Usar después de tavily_search cuando encuentres información valiosa de un proveedor.",
    "input_schema": {
      "type": "object",
      "properties": {
        "ruc": {
          "type": "string",
          "description": "RUC de la empresa a enriquecer"
        },
        "datos_encontrados": {
          "type": "object",
          "description": "JSON con los datos encontrados: {fuente_url, descripcion_publica, servicios, certificaciones, contacto, fecha_scraping}"
        }
      },
      "required": ["ruc", "datos_encontrados"]
    }
  },

  {
    "name": "calculate_tax_projection",
    "description": "Calcula la proyección fiscal concreta del inversor usando los parámetros de la simulación.",
    "input_schema": {
      "type": "object",
      "properties": {
        "monto_inversion_usd": {
          "type": "number"
        },
        "porcentaje_cl": {
          "type": "number",
          "description": "Porcentaje de componentes locales [0-100]"
        },
        "sector": {
          "type": "string",
          "enum": ["manufactura", "ckd", "tech"]
        },
        "anos_proyeccion": {
          "type": "integer",
          "description": "Años de proyección (default: 5)",
          "default": 5
        }
      },
      "required": ["monto_inversion_usd", "porcentaje_cl", "sector"]
    }
  }
]
```

---

### 4.2 Herramientas de Búsqueda en Internet (Tavily)

```json
[
  {
    "name": "tavily_search",
    "description": "Busca en internet información actualizada sobre empresas peruanas, normativas recientes, certificaciones o cualquier dato no disponible en la BD. Usar SOLO cuando la BD local no tiene la información o esta puede ser desactualizada (post-2024).",
    "input_schema": {
      "type": "object",
      "properties": {
        "query": {
          "type": "string",
          "description": "Query de búsqueda en lenguaje natural. Ser específico (incluir 'Perú', 'ZEEP Chancay', año si aplica)"
        },
        "search_depth": {
          "type": "string",
          "enum": ["basic", "advanced"],
          "description": "'basic' para búsquedas rápidas de hechos; 'advanced' para investigación profunda (más tokens, más tiempo)",
          "default": "basic"
        },
        "include_domains": {
          "type": "array",
          "items": { "type": "string" },
          "description": "Dominios específicos a priorizar",
          "examples": [["elperuano.pe", "mincetur.gob.pe", "sunat.gob.pe", "sunarp.gob.pe"]]
        },
        "max_results": {
          "type": "integer",
          "description": "Máximo de resultados (default: 5, max: 10)",
          "default": 5
        }
      },
      "required": ["query"]
    }
  },

  {
    "name": "tavily_extract",
    "description": "Extrae el contenido completo de URLs específicas. Usar cuando tavily_search retornó URLs relevantes y necesitas el texto completo.",
    "input_schema": {
      "type": "object",
      "properties": {
        "urls": {
          "type": "array",
          "items": { "type": "string" },
          "description": "Lista de URLs a extraer (máximo 3 por llamada)"
        }
      },
      "required": ["urls"]
    }
  }
]
```

---

### 4.3 Herramientas de Conocimiento Normativo (ChromaDB)

```json
[
  {
    "name": "search_legal_knowledge",
    "description": "Búsqueda semántica en la base de conocimiento normativo del sistema (ChromaDB). Siempre usar ANTES de responder preguntas legales o técnicas.",
    "input_schema": {
      "type": "object",
      "properties": {
        "query": {
          "type": "string",
          "description": "Consulta en español (siempre en español, la base normativa es española)"
        },
        "colecciones": {
          "type": "array",
          "items": {
            "type": "string",
            "enum": [
              "ley_zeep_32449",
              "resoluciones_mincetur",
              "normas_el_peruano",
              "normas_ambientales",
              "normas_manufactura",
              "normas_ckd",
              "normas_tech",
              "jurisprudencia_zeep"
            ]
          },
          "description": "Colecciones a consultar. Si no sabes cuál, incluye todas las relevantes al tema."
        },
        "top_k": {
          "type": "integer",
          "description": "Número de chunks a recuperar (default: 5, max: 10)",
          "default": 5
        },
        "filtro_vigencia": {
          "type": "boolean",
          "description": "Si excluir automáticamente chunks de normas derogadas (default: true)",
          "default": true
        }
      },
      "required": ["query", "colecciones"]
    }
  }
]
```

---

## 5. Protocolo de Token Streaming (SSE)

### 5.1 Endpoint de Streaming

```
POST /api/v1/ai/query
Content-Type: application/json
Accept: text/event-stream
Authorization: Bearer <jwt>
```

La respuesta es un stream SSE (`text/event-stream`) con eventos tipados.

### 5.2 Tipos de Eventos SSE

```
┌─────────────────────────────────────────────────────────────────┐
│ INICIO DEL STREAM                                               │
│                                                                 │
│ event: session                                                  │
│ data: {"session_id": "uuid", "agent_chain": ["orquestador",     │
│         "legal", "auditor"]}                                    │
│                                                                 │
│ HERRAMIENTA SIENDO LLAMADA                                      │
│                                                                 │
│ event: tool_start                                               │
│ data: {"tool": "search_legal_knowledge",                        │
│         "args": {"query": "beneficios IR manufactura ZEEP"},    │
│         "agent": "legal"}                                       │
│                                                                 │
│ RESULTADO DE HERRAMIENTA (no visible al usuario)                │
│                                                                 │
│ event: tool_end                                                 │
│ data: {"tool": "search_legal_knowledge",                        │
│         "chunks_found": 5,                                      │
│         "top_similarity": 0.94}                                 │
│                                                                 │
│ REPREGUNTAS (antes del texto si la query es ambigua)            │
│                                                                 │
│ event: clarification                                            │
│ data: {"questions": [                                           │
│   "¿Su proceso de manufactura genera residuos líquidos?",       │
│   "¿Ya tiene identificados proveedores locales?"                │
│ ]}                                                              │
│                                                                 │
│ TOKENS DE TEXTO (principal)                                     │
│                                                                 │
│ event: delta                                                    │
│ data: {"token": "Según", "index": 0}                            │
│                                                                 │
│ event: delta                                                    │
│ data: {"token": " el", "index": 1}                              │
│                                                                 │
│ event: delta                                                    │
│ data: {"token": " Artículo", "index": 2}                        │
│                                                                 │
│ COMPONENTE UI EMBEBIDO EN EL STREAM                             │
│                                                                 │
│ event: card                                                     │
│ data: {"type": "candidate_card", "payload": {...}}              │
│                                                                 │
│ event: card                                                     │
│ data: {"type": "fiscal_card", "payload": {...}}                 │
│                                                                 │
│ BOTONES DE ACCIÓN                                               │
│                                                                 │
│ event: button                                                   │
│ data: {"type": "action_button", "payload": {...}}               │
│                                                                 │
│ FUENTES NORMATIVAS                                              │
│                                                                 │
│ event: sources                                                  │
│ data: {"sources": [{"norma": "...", "articulo": "...", ...}]}   │
│                                                                 │
│ RESULTADO DEL AUDITOR                                           │
│                                                                 │
│ event: audit                                                    │
│ data: {"confidence_score": 0.92,                                │
│         "requires_visado": false,                               │
│         "badge": "verificado"}                                  │
│                                                                 │
│ FIN DEL STREAM                                                  │
│                                                                 │
│ event: done                                                     │
│ data: {"message_id": "uuid", "total_tokens": 847,              │
│         "agents_used": ["legal", "auditor"],                    │
│         "latency_ms": 2340}                                     │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 Implementación FastAPI (SSE)

```python
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
import asyncio, json

async def stream_agent_response(
    query: str,
    investor_profile_id: str,
    lang: str,
    session_id: str
) -> AsyncGenerator[str, None]:
    """
    Generador asíncrono que orquesta los agentes y streama los eventos SSE.
    """
    ctx = await build_agent_context(investor_profile_id, lang)

    # Evento de inicio
    yield f"event: session\ndata: {json.dumps({'session_id': session_id})}\n\n"

    # 1. Orquestador: clasificar y decidir si hay repreguntas
    classification = await orchestrator_agent.classify(query, ctx)

    if classification.needs_clarification:
        clarification_event = {
            "questions": classification.clarification_questions
        }
        yield f"event: clarification\ndata: {json.dumps(clarification_event)}\n\n"
        return  # El stream se detiene; el frontend espera la respuesta del usuario

    # 2. Agentes especialistas (pueden correr en paralelo)
    specialist_tasks = [
        run_specialist_agent(agent_id, query, ctx)
        for agent_id in classification.agents_to_activate
    ]

    # Streamear tool_start/tool_end a medida que los agentes corren
    async for event in merge_agent_streams(specialist_tasks):
        yield f"event: {event.type}\ndata: {json.dumps(event.data)}\n\n"

    # 3. Auditor: valida y genera el confidence_score
    audit_result = await auditor_agent.validate(
        specialist_outputs=specialist_results,
        ctx=ctx
    )

    # 4. Streamear tokens de la respuesta validada token by token
    async for token in stream_llm_tokens(audit_result.respuesta_validada):
        yield f"event: delta\ndata: {json.dumps({'token': token})}\n\n"

    # 5. Emitir cards y buttons
    for component in audit_result.ui_components:
        yield f"event: {component.event_type}\ndata: {json.dumps(component.payload)}\n\n"

    # 6. Fuentes normativas
    if audit_result.citas_formateadas:
        yield f"event: sources\ndata: {json.dumps({'sources': audit_result.citas_formateadas})}\n\n"

    # 7. Badge del Auditor
    yield f"event: audit\ndata: {json.dumps({'confidence_score': audit_result.confidence_score, 'requires_visado': audit_result.requiere_visado_humano, 'badge': audit_result.badge})}\n\n"

    # 8. Fin del stream
    yield f"event: done\ndata: {json.dumps({'message_id': save_message(audit_result)})}\n\n"


@router.post("/query")
async def query_agent(request: AIQueryRequest, user=Depends(get_current_user)):
    return StreamingResponse(
        stream_agent_response(
            query=request.query,
            investor_profile_id=str(request.investor_profile_id),
            lang=request.lang,
            session_id=request.session_id
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no"        # Nginx: deshabilitar buffering
        }
    )
```

### 5.4 Consumo en Next.js (Frontend)

```typescript
// hooks/useAgentStream.ts
export function useAgentStream(query: string, profileId: string) {
  const [tokens, setTokens] = useState<string>("")
  const [cards, setCards] = useState<UIComponent[]>([])
  const [buttons, setButtons] = useState<ActionButton[]>([])
  const [clarifications, setClarifications] = useState<string[]>([])
  const [audit, setAudit] = useState<AuditResult | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)

  const startStream = useCallback(async () => {
    setIsStreaming(true)
    setTokens("")
    setCards([])

    const response = await fetch("/api/v1/ai/query", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "text/event-stream" },
      body: JSON.stringify({ query, investor_profile_id: profileId, lang: "es" })
    })

    const reader = response.body!.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split("\n")

      let eventType = ""
      for (const line of lines) {
        if (line.startsWith("event: ")) {
          eventType = line.slice(7).trim()
        } else if (line.startsWith("data: ")) {
          const data = JSON.parse(line.slice(6))
          handleEvent(eventType, data)
        }
      }
    }

    setIsStreaming(false)
  }, [query, profileId])

  function handleEvent(type: string, data: any) {
    switch (type) {
      case "delta":
        setTokens(prev => prev + data.token)
        break
      case "card":
        setCards(prev => [...prev, data])
        break
      case "button":
        setButtons(prev => [...prev, data])
        break
      case "clarification":
        setClarifications(data.questions)
        break
      case "audit":
        setAudit(data)
        break
      case "tool_start":
        // Mostrar spinner con nombre de herramienta
        console.log(`[Agent] Calling: ${data.tool}`)
        break
    }
  }

  return { tokens, cards, buttons, clarifications, audit, isStreaming, startStream }
}
```

---

## 6. Componentes UI Generados por Agentes

Los agentes embeben componentes UI en el stream vía eventos `card` y `button`. El frontend los renderiza inline junto al texto.

### 6.1 `candidate_card` — Tarjeta de Candidato (CIP / CAL / Proveedor)

```json
{
  "type": "candidate_card",
  "payload": {
    "categoria": "ingeniero_cip",
    "candidato_id": "990e8400-...",
    "nombre": "Ing. Carlos Ramírez Torres",
    "numero_registro": "CIP-058423",
    "foto_url": "https://storage.comex.ai/fotos/cip-058423.jpg",
    "especialidad_principal": "Ingeniería Mecánica Industrial",
    "score_compatibilidad": 0.91,
    "disponibilidad": "disponible",
    "idiomas": ["es", "en"],
    "validacion_institucional": "vigente",
    "justificacion": "Experiencia directa en líneas CKD automotriz en zonas francas. Disponibilidad inmediata.",
    "badges": ["✓ Habilitado CIP", "ZEEP Experto"],
    "actions": [
      {
        "label": "Solicitar Reunión",
        "action": "request_meeting",
        "params": { "candidato_id": "990e8400-..." }
      },
      {
        "label": "Ver Perfil Completo",
        "action": "view_profile",
        "params": { "candidato_id": "990e8400-..." }
      }
    ]
  }
}
```

**Renderizado React:**
```tsx
// components/agents/CandidateCard.tsx
export function CandidateCard({ payload }: { payload: CandidateCardPayload }) {
  return (
    <div className="border rounded-xl p-4 shadow-sm bg-white flex gap-4">
      <img src={payload.foto_url} className="w-16 h-16 rounded-full object-cover" />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">{payload.nombre}</h3>
          <span className="text-xs text-gray-500">{payload.numero_registro}</span>
          {payload.validacion_institucional === "vigente" && (
            <span className="text-green-600 text-xs">✓ Verificado</span>
          )}
        </div>
        <p className="text-sm text-gray-600">{payload.especialidad_principal}</p>
        <p className="text-sm text-blue-700 mt-1 italic">"{payload.justificacion}"</p>
        <div className="flex items-center gap-2 mt-2">
          <CompatibilityBar score={payload.score_compatibilidad} />
          <span className="text-xs">{(payload.score_compatibilidad * 100).toFixed(0)}% compatible</span>
        </div>
        <div className="flex gap-2 mt-3">
          {payload.actions.map(action => (
            <button
              key={action.action}
              onClick={() => handleAgentAction(action)}
              className="px-3 py-1 text-sm rounded-lg bg-blue-600 text-white"
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
```

---

### 6.2 `fiscal_card` — Tarjeta de Proyección Fiscal

```json
{
  "type": "fiscal_card",
  "payload": {
    "titulo": "Proyección de Beneficios Fiscales ZEEP",
    "inversion_usd": 5000000,
    "porcentaje_cl": 35,
    "beneficio_cl_activo": true,
    "tabla_comparativa": [
      {
        "regimen": "Régimen Estándar Perú",
        "ir_pct": 29.5,
        "igv_exonerado": false,
        "arancel_0": false,
        "ahorro_anual_usd": 0,
        "ahorro_5_anos_usd": 0
      },
      {
        "regimen": "ZEEP Chancay (CL ≥ 30%)",
        "ir_pct": 0.0,
        "igv_exonerado": true,
        "arancel_0": true,
        "ahorro_anual_usd": 295000,
        "ahorro_5_anos_usd": 1475000
      }
    ],
    "highlight": "Ahorro proyectado a 5 años: USD 1,475,000",
    "condicion": "Sujeto a mantener CL ≥ 30% anualmente y registro activo en SUNARP",
    "fuente": "Art. 18, Ley N° 32449 (vigente desde 01/12/2024)"
  }
}
```

---

### 6.3 `company_card` — Tarjeta de Proveedor Local

```json
{
  "type": "company_card",
  "payload": {
    "ruc": "20512345678",
    "razon_social": "Transportes Lima Norte SAC",
    "sector_interno": "logistica",
    "trust_score": 0.88,
    "trust_label": "Alta confiabilidad",
    "distancia_puerto_chancay_km": 28.5,
    "estado_sunarp": "ACTIVA",
    "condicion_contribuyente": "HABIDO",
    "tiene_cargas": false,
    "capacidad_operativa": "alta",
    "servicios_principales": ["Transporte terrestre", "Almacenamiento", "Distribución LATAM"],
    "web_enriched": true,
    "web_enrichment_summary": "Empresa con 15 años de experiencia. Socio logístico del puerto del Callao.",
    "actions": [
      {
        "label": "Ver Detalle Completo",
        "action": "view_company",
        "params": { "ruc": "20512345678" }
      },
      {
        "label": "Agregar a Candidates",
        "action": "add_to_match",
        "params": { "ruc": "20512345678" }
      }
    ]
  }
}
```

---

### 6.4 `action_button` — Botón de Acción Standalone

```json
{
  "type": "action_button",
  "payload": {
    "variant": "primary",
    "label": "Escalar a Abogado CAL",
    "description": "Tu consulta requiere revisión de un especialista en Ley ZEEP.",
    "action": "escalate_to_human",
    "params": { "message_id": "220e8400-..." },
    "icon": "⚠"
  }
}
```

**Otros variants:** `primary` | `secondary` | `danger` | `ghost`

---

### 6.5 `clarification_chips` — Repreguntas como Chips Seleccionables

```json
{
  "type": "clarification_chips",
  "payload": {
    "message": "Para responderte con precisión, necesito un poco más de contexto:",
    "questions": [
      {
        "id": "q1",
        "text": "¿Su proceso industrial genera residuos líquidos o gases?",
        "options": ["Sí, residuos líquidos", "Sí, gases industriales", "No genera residuos significativos"]
      },
      {
        "id": "q2",
        "text": "¿Ya tiene identificados proveedores locales?",
        "options": ["Sí, tengo candidatos", "No, necesito buscarlos", "No aplica a mi proyecto"]
      }
    ],
    "allow_skip": true,
    "skip_label": "Continuar sin responder"
  }
}
```

**Comportamiento frontend:**
- El stream se pausa al recibir `clarification_chips`
- Las opciones se renderizan como botones/chips clicables
- Al seleccionar, el frontend reenvía la query original + respuestas seleccionadas como nuevo mensaje
- El Orquestador retoma con el contexto enriquecido

---

### 6.6 `source_badge` — Badge de Fuente Normativa

```json
{
  "type": "source_badge",
  "payload": {
    "norma": "Ley N° 32449 — Ley ZEEP Chancay",
    "articulo": "Artículo 18",
    "titulo_seccion": "Beneficios Tributarios al Sector Industrial",
    "fecha_vigencia": "2024-12-01",
    "derogado": false,
    "url_el_peruano": "https://elperuano.pe/norma/ley-32449"
  }
}
```

---

## 7. Sistema de Repreguntas (Clarification Engine)

### 7.1 Cuándo el Orquestador Genera Repreguntas

El Orquestador evalúa la necesidad de repreguntas ANTES de delegar a especialistas:

```python
CLARIFICATION_TRIGGERS = [
    # Ambigüedad de intención
    {
        "condition": "múltiples intenciones detectadas con confianza similar (< 0.15 de diferencia)",
        "action": "preguntar cuál aspecto priorizar",
        "ejemplo": "Query: '¿qué necesito para operar?' → puede ser legal, técnico o procedimental"
    },
    # Datos faltantes para cálculos
    {
        "condition": "intención=financiera pero perfil no tiene porcentaje_cl ni monto_inversion",
        "action": "solicitar los valores necesarios para calcular",
        "ejemplo": "Query: '¿cuánto ahorro en impuestos?' → necesita monto y % CL"
    },
    # Sector no especificado
    {
        "condition": "consulta sobre certificaciones técnicas pero sector=null en el perfil",
        "action": "preguntar el sector",
        "ejemplo": "Query: '¿qué certificaciones necesito?' → respuesta diferente por sector"
    },
    # Consulta demasiado general
    {
        "condition": "query tiene < 5 palabras o es solo una palabra",
        "action": "pedir especificación",
        "ejemplo": "Query: 'SUNARP' → preguntar qué aspecto de SUNARP interesa"
    }
]
```

### 7.2 Generación de Repreguntas con el LLM

El Orquestador usa un mini-prompt para generar repreguntas:

```
SYSTEM: Eres el Orquestador de COMEX.AI. Genera 2 preguntas de clarificación cortas para entender mejor
la consulta del usuario. Cada pregunta debe tener 3 opciones de respuesta. Formato JSON estricto.

USER: Consulta: "{query}"
Contexto del perfil: {context_summary}
Razón por la que necesitas clarificación: {trigger_reason}

Genera las repreguntas.
```

### 7.3 Flujo con Repreguntas

```
Frontend → POST /api/v1/ai/query  { query, session_id, lang }
         ← SSE event: clarification  { questions: [...] }
         [Frontend muestra chips/opciones al usuario]
         [Usuario selecciona respuestas]

Frontend → POST /api/v1/ai/query  { 
             query, 
             session_id,  ← mismo session_id
             lang,
             clarification_answers: {
               "q1": "Sí, residuos líquidos",
               "q2": "No, necesito buscarlos"
             }
           }
         ← SSE stream normal (ya con contexto enriquecido)
```

---

## 8. Flujos de Interacción Entre Agentes (Ejemplos Concretos)

### 8.1 Consulta Legal Simple

```
Usuario: "¿Cuáles son los beneficios de 0% IR en la ZEEP?"

Orquestador:
  ├─ Clasifica: intención=financiera + legal
  ├─ Activa: Agente Legal + Agente Financiero (en paralelo)
  └─ Sin repreguntas (consulta clara)

Agente Legal:
  ├─ tool_call: search_legal_knowledge(
  │     query="beneficios impuesto renta cero ZEEP",
  │     colecciones=["ley_zeep_32449"])
  ├─ Recupera: Art. 18 Ley 32449 (similitud: 0.97)
  └─ Genera: respuesta normativa

Agente Financiero:
  ├─ tool_call: calculate_tax_projection(
  │     monto_inversion_usd=5000000,
  │     porcentaje_cl=35, sector="manufactura")
  └─ Genera: fiscal_card con tabla comparativa

Auditor:
  ├─ Verifica grounding: 100% de párrafos tienen sustento
  ├─ confidence_score: 0.97
  └─ badge: "verificado"

Stream al usuario:
  → event: tool_start (search_legal_knowledge)
  → event: tool_end
  → event: delta (tokens del texto legal)
  → event: card (fiscal_card)
  → event: sources ([Art. 18, Ley N° 32449])
  → event: audit (confidence: 0.97, badge: verificado)
  → event: done
```

---

### 8.2 Búsqueda de Candidatos (Matchmaking)

```
Usuario: "Necesito un ingeniero que hable chino para mi proyecto CKD"

Orquestador:
  ├─ Clasifica: intención=matchmaking
  ├─ Activa: Agente Matchmaker
  └─ Sin repreguntas (contexto suficiente)

Agente Matchmaker:
  ├─ tool_call: search_engineers_cip(
  │     especialidad="mecanica_industrial",
  │     idioma="zh", disponibilidad="cualquiera")
  │   → BD retorna 2 ingenieros con idioma ZH
  │
  ├─ [Solo 2 candidatos en BD; necesita más]
  │
  ├─ tool_call: tavily_search(
  │     query="ingenieros CIP habilitados chino mandarín manufactura CKD Lima Perú")
  │   → Encuentra 1 perfil adicional en LinkedIn
  │
  ├─ tool_call: save_web_enrichment(
  │     ruc=null, datos_encontrados={...perfil LinkedIn...})
  │
  └─ Genera: 3 candidate_cards con justificación

Auditor:
  ├─ Para matchmaking: verifica que candidatos tengan validación_institucional
  ├─ confidence_score: 0.85 (datos de BD verificados + 1 de internet sin validación formal)
  └─ badge: "verificado" (el candidato de internet marcado como "pendiente validación CIP")

Stream al usuario:
  → event: tool_start (search_engineers_cip)
  → event: tool_end (2 encontrados)
  → event: tool_start (tavily_search)
  → event: tool_end (1 encontrado en internet)
  → event: delta ("Encontré 3 ingenieros compatibles con tu proyecto CKD...")
  → event: card (candidate_card × 3)
  → event: button (action: "Ver más candidatos")
  → event: audit (confidence: 0.85)
  → event: done
```

---

### 8.3 Consulta Ambigua con Repreguntas

```
Usuario: "¿Qué necesito para empezar?"

Orquestador:
  ├─ Clasifica: múltiples intenciones con baja confianza
  │   (legal: 0.33, procedimental: 0.35, técnica: 0.32)
  ├─ Trigger: ambigüedad detectada
  └─ Genera repreguntas

Stream al usuario:
  → event: clarification {
      "questions": [
        {
          "id": "q1",
          "text": "¿Qué aspecto te interesa más en este momento?",
          "options": [
            "Conocer los documentos legales necesarios",
            "Entender el proceso paso a paso del roadmap",
            "Saber los requisitos técnicos de mi sector"
          ]
        },
        {
          "id": "q2",
          "text": "¿En qué fase de tu proceso estás?",
          "options": [
            "Apenas evaluando si invertir en la ZEEP",
            "Ya decidí invertir, ahora necesito el proceso",
            "Tengo mi perfil creado y quiero avanzar"
          ]
        }
      ]
    }

[Usuario selecciona: "Documentos legales" + "Ya decidí invertir"]

Frontend → reenvía con clarification_answers

Orquestador:
  ├─ Contexto enriquecido: intención=legal + procedimental
  ├─ Activa: Agente Legal
  └─ Continúa el stream normal
```

---

### 8.4 Búsqueda con Enriquecimiento en Internet

```
Usuario: "¿Existe algún proveedor de acero cerca del puerto?"

Agente Matchmaker:
  ├─ tool_call: search_local_providers(
  │     sector_ciiu="manufactura",
  │     distancia_max_km=50,
  │     trust_score_min=0.6)
  │   → BD retorna 2 proveedores de acero y metales
  │
  ├─ Para uno de los proveedores: web_enrichment_data está vacío
  │
  ├─ tool_call: tavily_search(
  │     query="Aceros del Norte SAC RUC 20501234567 Chancay Lima proveedor",
  │     include_domains=["linkedin.com", "paginasamarillas.pe"])
  │   → Encuentra descripción, certificaciones, teléfono
  │
  ├─ tool_call: save_web_enrichment(
  │     ruc="20501234567",
  │     datos_encontrados={
  │       "fuente_url": "https://linkedin.com/company/aceros-del-norte",
  │       "descripcion_publica": "Distribuidor de acero laminado...",
  │       "certificaciones": ["ISO 9001:2015"],
  │       "fecha_scraping": "2026-05-22"
  │     })
  │   → Guardado en companies.web_enrichment_data
  │
  └─ Genera: company_cards (2 proveedores, uno con datos enriquecidos)

Stream al usuario:
  → event: tool_start (search_local_providers)
  → event: tool_end (2 encontrados)
  → event: tool_start (tavily_search) ← [visible: "Buscando información adicional..."]
  → event: tool_end
  → event: delta ("Encontré 2 proveedores de acero dentro de 50km del puerto...")
  → event: card (company_card × 2, segunda con badge "Datos enriquecidos desde web")
  → event: done
```

---

## 9. Configuración del Proveedor LLM por Agente

| Agente | Proveedor Primario | Modelo | Temperatura | Fallback |
|---|---|---|---|---|
| Orquestador | Groq | llama-3.3-70b-versatile | 0.2 | Gemini 1.5 Flash |
| Legal | Claude API | claude-sonnet-4-6 | 0.05 | Groq Llama 3.3 70B |
| Matchmaker | Groq | llama-3.3-70b-versatile | 0.3 | Gemini 1.5 Flash |
| Técnico | Groq | llama-3.3-70b-versatile | 0.1 | Gemini 1.5 Flash |
| Financiero | Groq | llama-3.3-70b-versatile | 0.05 | Gemini 1.5 Flash |
| I+D+i | Groq | llama-3.3-70b-versatile | 0.2 | Gemini 1.5 Flash |
| Auditor | Claude API | claude-sonnet-4-6 | 0.0 | Groq Llama 3.3 70B |

**Razón de Claude para Legal y Auditor:** Requieren el máximo de precisión, razonamiento cadena-de-pensamiento y resistencia a alucinaciones (ADR-02-05). El costo extra está justificado por la criticidad legal.

---

## 10. Tests

- `test_orquestador_clasifica_legal`: query sobre Ley 32449 → intención=legal, agente_legal activado
- `test_orquestador_genera_repreguntas_query_ambigua`: query de 3 palabras → event clarification emitido
- `test_stream_orden_eventos`: verificar que el orden es session→tool_start→tool_end→delta→card→audit→done
- `test_agente_legal_no_alucina`: fuerza query sin chunks disponibles → respuesta con "no encontré sustento" exacto
- `test_agente_legal_cita_articulo_correcto`: query sobre IR 0% → respuesta cita Art. 18 Ley 32449
- `test_agente_matchmaker_bd_primero`: BD con 5 candidatos → tavily_search NO es llamado
- `test_agente_matchmaker_fallback_internet`: BD con 2 candidatos → tavily_search SÍ es llamado
- `test_save_web_enrichment_persiste`: matchmaker encuentra proveedor en internet → web_enrichment_data guardado en BD
- `test_auditor_confidence_bajo_activa_visado`: 2 párrafos sin sustento de 5 → confidence < 0.70, visado_requerido=true
- `test_auditor_norma_derogada_advertencia`: chunk con fecha_vigencia pasada → advertencia visible en respuesta
- `test_streaming_no_bloquea_con_tools`: herramienta tarda 2s → tokens streameados en cuanto herramienta termina
- `test_clarification_chips_pausa_stream`: clarification emitida → stream termina sin más eventos hasta respuesta del usuario
- `test_fiscal_card_en_stream`: consulta sobre beneficios → event card con type=fiscal_card recibido
- `test_candidate_cards_max_5`: matchmaking genera máx 5 tarjetas por categoría aunque BD retorne más
- `test_auditor_no_modifica_contenido_valido`: texto válido → Auditor retorna el mismo texto sin alteraciones
- `test_fallback_groq_a_gemini`: Groq devuelve 503 → Gemini 1.5 Flash activa en < 2s
- `test_comunicacion_solo_vertical`: logs verifican que especialistas no se llaman entre sí
- `test_idioma_zh_respuesta_zh`: query en chino → respuesta en chino con fuentes en español al final
