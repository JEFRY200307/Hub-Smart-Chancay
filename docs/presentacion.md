# [cite_start]COMEX.AI — Executive Pitch Blueprint [cite: 1]
[cite_start]**Inversión Extranjera Acelerada en la ZEEP con Trazabilidad Institucional de Extremo a Extremo** [cite: 2]

---

## [cite_start]1. El Abismo del Inversionista (La Problemática) [cite: 3]
El desembarco de capitales extranjeros en la Zona Económica Especial Privada (ZEEP) enfrenta tres barreras críticas que dilatan los tiempos de ejecución:

* [cite_start]**Incertidumbre Legal:** [cite: 4] [cite_start]Desconocimiento profundo de la Ley ZEEP (N° 32449) y proliferación de barreras burocráticas complejas para la instalación física y operativa de las empresas. [cite: 5]
* [cite_start]**Falta de Confianza:** [cite: 6] [cite_start]Asimetría de información que genera una alta dificultad para identificar proveedores locales idóneos y talento técnico (ingenieros) debidamente certificado. [cite: 7]
* [cite_start]**Desconexión Operativa:** [cite: 8] [cite_start]Ausencia total de trazabilidad y visibilidad en el flujo que transcurre desde la manifestación formal de la intención de invertir hasta la firma definitiva del contrato con el operador. [cite: 9]

---

## [cite_start]2. La Solución: El Puente Digital de Chancay (MVP) [cite: 10, 11, 12]
[cite_start]**COMEX.AI** es una plataforma integrada que optimiza la entrada al mayor hub portuario de Sudamérica mediante automatización inteligente: [cite: 1, 13, 19, 20]

* [cite_start]**Validación Automática:** Integración nativa vía API con los sistemas del Colegio de Ingenieros del Perú (CIP), Colegio de Abogados de Lima (CAL) y SUNARP. [cite: 14]
* [cite_start]**Agente RAG Especializado:** Consultoría legal y técnica 24/7 especializada en legislación peruana y sector corporativo, traduciendo el marco normativo en decisiones de negocio accionables. [cite: 15]
* [cite_start]**Ledger de Trazabilidad:** Un registro inmutable para la auditoría completa de todo el ciclo de la inversión. [cite: 16]

> [cite_start]### 🤖 Intervención del Sistema — Agente Vanguard (IA CIP Asiste) [cite: 38]
> [cite_start]*"Para la fase actual de Validación Legal, he analizado su perfil industrial. Recomiendo priorizar la carga del 'Certificado de Impacto Ambiental (Anexo 4)', ya que suele ser el cuello de botella más común para empresas de su sector en la zona económica especial."* [cite: 39, 40, 41, 42]

## Arquitectura del sistema 
Vista general
El sistema está diseñado bajo un enfoque modular desacoplado, dividiendo las responsabilidades en cuatro capas críticas bien definidas. Esto permite que el *vibe coding* y la generación de código mediante agentes autónomos (como Claude Code) se realicen de forma aislada sin riesgo de efectos secundarios o acoplamientos rígidos entre la interfaz de usuario, las reglas de negocio y los modelos de IA.
[PUNTOS DE CONTACTO] ➔ (FastAPI / REST) ➔ [NÚCLEO DEL SISTEMA] ➔ [AUTOMATIZACIÓN E IA] ➔ [SERVICIOS EXTERNOS]
### 2. Desglose Detallado por Capas

#### Capa 1: Puntos de Contacto (Presentation Layer)
* **Tecnología Base:** Aplicación Web SPA construida con **React**.
* **Comunicación:** Se conecta de manera exclusiva con el backend mediante peticiones asíncronas utilizando una **API REST**.
* **Responsabilidad:** Captura del perfil del inversionista extranjero (*Profiling*), renderizado dinámico de los formularios del diagnóstico inteligente (3 min) y visualización en tiempo real del mapa de procesos (*Stitch Views*).

#### Capa 2: Núcleo del Sistema (Core Backend & Storage)
* **Tecnología Base:** Servicio REST implementado en **Python** impulsado por el framework de alta velocidad **FastAPI**.
* **Responsabilidad:** Actúa como el controlador central del flujo de valor. Valida los tokens de autenticación, procesa las solicitudes del frontend, gestiona el estado del onboarding del inversor y sirve de puente seguro con el módulo de Inteligencia Artificial.
* **Sub-sistema de Almacenamiento (Persistencia Híbrida):**
    1.  **BD DINET (PostgreSQL):** Base de datos relacional encargada del almacenamiento estructurado y transaccional. Guarda la información del usuario, las minutas de reuniones, el estado del *Roadmap de Instalación* y el Ledger de Trazabilidad inmutable.
    2.  **BD DINET (Chroma):** Base de datos vectorial utilizada como memoria a largo plazo y motor de recuperación semántica (RAG). Indexa los fragmentos normativos (*chunks*) de la Ley ZEEP N° 32449, resoluciones del MINCETUR y decretos ambientales.

#### Capa 3: Automatización e IA (Cognitive & Agentic Layer)
Esta capa abandona el paradigma determinista para implementar un patrón de **Orquestación Supervisor-Trabajador (Supervisor-Worker Pattern)**.

* **Agente Orquestador (Supervisor):** Es el punto de entrada de la lógica cognitiva. Recibe el contexto del usuario procesado por FastAPI, determina la intención y delega subtareas a los agentes especialistas, consolidando finalmente una respuesta unificada libre de alucinaciones.
* **Pool de Agentes Especialistas (Workers):**
    1.  **Agente Legal:** Especializado en la interpretación jurídica de la Ley N° 32449. Consulta ChromaDB para responder consultas 24/7.
    2.  **Agente Matchmaker:** Encargado del emparejamiento inteligente. Ejecuta las consultas cruzadas para conectar inversionistas con Ingenieros del CIP, Abogados del CAL y proveedores logísticos validados.
    3.  **Agente Auditor:** Implementa la política de "Alucinación Cero". Valida que los datos generados por otros agentes tengan un sustento normativo real o requieran visado humano institucional.
    4.  **Agente Técnico:** Analiza los perfiles industriales y gestiona los cuellos de botella técnicos (por ejemplo, alertar sobre la carga obligatoria del Certificado de Impacto Ambiental).
    5.  **Agente Financiero:** Encargado de procesar la función de viabilidad matemática y el cálculo del Score de Elegibilidad ZEEP en tiempo real.
* **Motor de Grounding y Búsqueda:** * **Tavily Search API:** Los agentes utilizan esta herramienta especializada para ejecutar búsquedas y consultas automáticas en la web abierta, asegurando que la información de empresas o regulaciones dinámicas no dependa únicamente del conocimiento estático del LLM.

#### Capa 4: Servicios y Entidades Externas (Integration Layer)
A través del motor de búsqueda y llamadas automatizadas estructuradas, la plataforma consume, contrasta e interactúa con el ecosistema público e institucional peruano:

* **Internet/Empresas:** Mapeo de mercado y recolección de datos comerciales de competidores o socios estratégicos.
* **SUNARP:** Verificación registral en tiempo real del estatus legal, vigencia de poderes y reputación de proveedores locales del Top 5.
* **MINCETUR:** Extracción de las últimas resoluciones y normativas arancelarias o de comercio exterior asociadas a las zonas económicas especiales.
* **Diario Oficial El Peruano:** Monitoreo automatizado de normas legales publicadas diariamente para mantener actualizado el motor RAG.
* **INACAL:** Consulta de estándares de calidad, calibración y certificaciones técnicas obligatorias para componentes locales manufacturados.
* **SENACE / PRODUCE:** Validación de marcos regulatorios de producción industrial y criterios de elegibilidad para manufactura pesada.
* **MINAM (Ministerio del Ambiente):** Fiscalización automática de normativas ecológicas vigentes y requisitos para la aprobación del Anexo 4 (Certificado de Impacto Ambiental).

---

##### 3. Reglas de Inyección para Herramientas de Desarrollo (Cursor / Claude Code)

Cuando ordenes modificaciones sobre este sistema a tus agentes de código, impón las siguientes restricciones de diseño basadas en el gráfico:

1.  **Pureza del Dominio:** Ninguna clase o función dentro de `AUTOMATIZACION_E_IA` (Agentes) puede realizar una consulta directa a la base de datos `PostgreSQL`. Toda persistencia debe ser solicitada a través de los endpoints o servicios expuestos por el `Nucleo_del_Sistema` (FastAPI).
2.  **Ilamiento de Agentes:** Los agentes especialistas (`Agente_Legal`, `Agente_Matchmaker`, etc.) no se comunican entre sí de forma horizontal. Toda la comunicación e intercambio de mensajes debe fluir verticalmente a través del `Agente_Orquestador`.
3.  **Abstracción de Consultas Externas:** Las consultas hacia entidades como SUNARP, MINAM o MINCETUR no se hacen mediante Web Scraping directo desde los controladores; se delegan al módulo de Búsqueda Web (`Tavily`), garantizando contratos de salida limpios en formato JSON.

### [cite_start]Roadmap de Instalación y Control de Estado [cite: 23]
[cite_start]La plataforma segmenta el onboarding del inversor en un flujo controlado, reduciendo el tiempo de validación a solo **4 días hábiles**: [cite: 37]

| Fase | Estado | Descripción Técnica / Operativa |
| :--- | :--- | :--- |
| **1. [cite_start]Elegibilidad** [cite: 24] | [cite_start]`✓ COMPLETADO` [cite: 25] | [cite_start]Evaluación inicial de viabilidad y matriz de beneficios aprobada. [cite: 26] |
| **2. [cite_start]Validación Legal** [cite: 27] | [cite_start]`EN PROGRESO (45%)` [cite: 28, 30, 33] | [cite_start]Revisión de documentación corporativa y permisos ante la Autoridad Portuaria Nacional (APN). [cite: 29] |
| **3. [cite_start]Contratación** [cite: 31] | [cite_start]`PENDIENTE` [cite: 137] | [cite_start]Facilitación de *matchmaking* y formalización de proveedores locales. [cite: 32, 139] |
| **4. [cite_start]Operación** [cite: 34] | [cite_start]`PENDIENTE` [cite: 140] | [cite_start]Inicio formal de la actividad económica dentro de la zona. [cite: 35, 143] |

[cite_start]**AVANCE GLOBAL DEL PROYECTO: 35%** [cite: 36]

---

## [cite_start]3. El Flujo de Valor Continuo y Viabilidad Matemática [cite: 43]
[cite_start]El sistema procesa los requerimientos del inversor a través de cuatro etapas optimizadas por IA:
[01. GANCHO]        ➔ Cálculo de viabilidad matemática y beneficios tributarios ZEEP. 
[02. PROFILING]     ➔ Agente interactivo analiza el proyecto y recomienda ajustes de diseño. 
[03. MATCH]         ➔ Conexión automatizada con Ingenieros CIP, Abogados CAL y Proveedores. 
[04. LEDGER]        ➔ Trazabilidad inmutable de reuniones y cierre formal con el Operador ZEEP.

### Motor Algorítmico de Elegibilidad [cite: 45]
Para mitigar las conjeturas, la plataforma calcula el **Score de Elegibilidad ZEEP** en menos de 3 minutos aplicando la siguiente función de viabilidad: [cite: 46, 47, 48, 53, 54]

$$V=(W_{1}\times A)+(W_{2}\times \log(1+t))+(W_{3}\times Z)$$ [cite: 49]

* **Precisión Legal (100%):** Validado rigurosamente contra la Ley N° 32449 ZEEP. [cite: 55, 58, 61]
* **Optimización Fiscal:** Proyección de hasta **0% de Impuesto a la Renta (IR)** condicionado a la integración de un **30% de componentes locales** (ej. vinculación estratégica con el clúster metalmecánico de Lima Norte). [cite: 56, 59, 62, 68]

---

## 4. Arquitectura del Agente Orquestador: Alucinación Cero [cite: 64, 73]
La plataforma mitiga los riesgos de los LLMs tradicionales mediante una arquitectura de validación híbrida antes de exponer datos al inversor:

1.  **Ingreso del Proyecto:** El usuario indexa los detalles técnicos de su inversión. [cite: 72]
2.  **Análisis por IA:** El Motor RAG Especializado traduce las normativas y resoluciones vigentes del MINCETUR. [cite: 69, 70, 71, 75]
3.  **Auditoría de Seguridad:** Cada recomendación es visada por un comité mixto institucional CIP/CAL antes de su publicación. [cite: 74, 76, 77]
4.  **Decisión Accionable:** Entrega de directrices con trazabilidad legal garantizada. [cite: 78]

---

## 5. Ecosistema de Matchmaking y Confianza Institucional [cite: 81]
Automatización del enlace profesional eliminando la intermediación y la burocracia manual: [cite: 82]

* **Ingenieros CIP (+4,200 activos):** Validación en tiempo real de habilitación vigente y especialidad mediante el consumo de la API oficial del Colegio de Ingenieros del Perú. [cite: 83, 84, 85, 92, 93, 94]
* **Abogados CAL (+1,800 certificados):** Conexión directa con profesionales certificados por el Colegio de Abogados de Lima, bilingües (ES/EN/ZH) y expertos en normativa ZEEP. [cite: 86, 87, 88, 96, 97, 98]
* **Proveedores Locales (Top 5 validados):** Empresas de soporte logístico, construcción y servicios operativos en la zona Chancay/Callao validadas ante SUNARP. [cite: 89, 90, 91, 99, 100, 101, 102]

---

## 6. Ledger de Trazabilidad e Inteligencia Territorial [cite: 116, 127]
El Operador Privado ZEEP registra de manera obligatoria cada interacción, minuta de reunión e hito dentro de un ledger distribuido. [cite: 118, 128, 132]

* **Transparencia:** 100% de las reuniones auditadas bajo un esquema inmutable. [cite: 117, 129, 146]
* **Gobernanza Institucional:** Sincronización transparente con el CIP Lima y el MINCETUR para la posterior explotación de datos territoriales. [cite: 119, 147, 150, 155]
* **Cierre Operativo:** Generación automatizada del **Dossier de Inversión Pre-Aprobado**, consolidando toda la documentación técnica lista para la firma. [cite: 120, 144]

### Matriz de Gobernanza de Actores [cite: 166]

| Actor | Rol en la Plataforma | Valor Entregado |
| :--- | :--- | :--- |
| **CIP Lima** | Orquestador y Certificador. [cite: 167] | Garantía de calidad técnica e ingeniería nacional calificada. [cite: 167] |
| **Operador ZEEP** | Validador Final. [cite: 167] | Validación física/operativa de activos y registro de trazabilidad. [cite: 167] |
| **Empresa Extranjera** | Usuario Inversor. [cite: 167] | Mitigación drástica de riesgos y optimización de tiempos de despliegue. [cite: 167] |

---

## 7. Estrategia de Escalabilidad Técnica y de Negocio [cite: 176]
Para asegurar que **COMEX.AI** evoluione de un MVP enfocado en Chancay a una plataforma transversal de desarrollo económico, se define el siguiente modelo de escalabilidad modular e inteligencia futura: [cite: 1, 10, 151]

### A. Explotación de Datos e Inteligencia Territorial (Q1 2027) [cite: 152, 161]
La acumulación de transacciones e hitos históricos en el Ledger de Inversión habilitará una capa analítica avanzada ("Minería de Datos Territorial") orientada al CIP Lima y ministerios reguladores. [cite: 155, 157] Esta vertical permitirá:
* Identificar en tiempo real los cuellos de botella específicos en la tramitación y aprobación de contratos operativos. [cite: 163]
* Predecir los sectores industriales con mayor demanda de ingenieros CIP colegiados para orientar la oferta académica y profesional. [cite: 164]
* Medir la eficiencia macroeconómica y el impacto real de las exoneraciones fiscales de la Ley ZEEP en la atracción de capitales. [cite: 165]

### B. Indicadores Clave de Crecimiento (KPIs de Escalabilidad) [cite: 177]
El éxito del escalamiento de la plataforma se auditará bajo tres métricas de tracción técnica:
* **Time-to-Market de Inversión:** Reducción del ciclo promedio de instalación de meses de consultoría tradicional a días hábiles mediante la automatización de flujos con IA. [cite: 19, 60]
* **API Throughput & Concurrencia:** Capacidad de la arquitectura modular para procesar de forma simultánea consultas RAG concurrentes y validaciones directas CIP/CAL/SUNARP sin degradación de rendimiento. [cite: 14, 15, 170]
* **Densidad del Ecosistema:** Incremento porcentual de MIPYMEs locales integradas exitosamente en la cadena de suministro global del puerto mediante un empoderamiento real del ingeniero peruano. [cite: 174, 175]

### C. Línea de Tiempo y Roadmap de Expansión (Fechas) [cite: 178]
El despliegue tecnológico se ejecutará en fases incrementales controladas:
* **Fase 1 (Q1 2026): Pilotaje Funcional.** Estabilización de las integraciones API principales (CIP/CAL) en el Hub de Chancay y calibración del motor RAG. [cite: 69, 159, 170]
* **Fase 2 (Q1 2027): Activación de la Capa Analítica.** Lanzamiento de la infraestructura de Minería de Datos e Inteligencia Territorial basada en el Ledger histórico. [cite: 152, 155, 160]
* **Fase 3 (Q3 2027): Despliegue Multi-Zona.** Apertura del ecosistema a nuevos polos de inversión basándose en los indicadores de escalabilidad recopilados. [cite: 177]

### D. Visión para Otras Zonas Económicas Especiales (ZEE) [cite: 179]
Debido a la naturaleza modular y desacoplada de la arquitectura (diseñada con separación estricta entre la lógica de negocio y los adaptadores de infraestructura), la plataforma posee una capacidad de replicabilidad inmediata. [cite: 170] La visión contempla expandir el core de **COMEX.AI** para orquestar la atracción de inversiones en otras zonas estratégicas del Perú y hubs portuarios de Latinoamérica, requiriendo únicamente la parametrización de las leyes fiscales y la conexión a las APIs correspondientes. [cite: 1, 172]