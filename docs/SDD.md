# Sovereign Gateway (Smart Hub Chancay)
**Versión:** 1.0.0 | **Estado:** Draft | **Referencia:** RFC-001-ZEEP

## 1. Contexto y Visión (The "Why")
**Propósito del Sistema:** Sovereign Gateway es una plataforma B2B omnicanal impulsada por Inteligencia Artificial diseñada para eliminar la asimetría de información y la fricción burocrática en la Zona Especial de Desarrollo (ZEEP) de Chancay. Actúa como el puente verificable entre la inversión extranjera y la oferta de servicios local.

**Objetivos de Negocio:**
* Reducir el tiempo de onboarding legal de empresas extranjeras de meses a minutos mediante IA.
* Automatizar el 100% del matchmaking inicial entre necesidades de infraestructura extranjera y proveedores locales certificados.

**Modelo C4 - Nivel 1 (Contexto):**
El sistema se ubica en el centro. Interactúa con:
* Inversionista Extranjero (vía Web).
* Propietario/Operador Local (vía Web y WhatsApp).
* Sistemas Externos: APIs del Estado (MINCETUR, SUNARP - simuladas), Proveedores de LLM (OpenAI/Azure OpenAI), API de WhatsApp (Twilio/Meta).

## 2. Especificación de Contratos (The Source of Truth)
Definimos el "Qué" para paralelizar el trabajo entre el frontend y el backend desde el día uno.

* **Definición de Interfaz:** API RESTful documentada automáticamente mediante OpenAPI 3.1 (Swagger integrado en el framework).
* **Esquemas de Datos:** Validación estricta en tiempo de ejecución utilizando modelos Pydantic v2.
  * *Nota técnica:* Todo payload entrante y saliente, incluidos los esquemas para el Function Calling del LLM, se definirá con Pydantic para garantizar tipado estricto.
* **Casos de Error:** Implementación estándar RFC 7807 (Problem Details for HTTP APIs). En lugar de un simple `{ "error": "bad request" }`, el sistema devolverá: 
  ```json
  {
    "type": "https://gateway.zeep/errors/validation",
    "title": "Validation Failed",
    "status": 400,
    "detail": "El RUC proporcionado no es válido."
  }
  ```

## 3. Arquitectura del Sistema (Strategic Design)
Aplicando el concepto de Fractalidad, estructuramos el sistema en dos niveles para equilibrar la velocidad de la hackathon con la escalabilidad futura.

**Macro-Arquitectura (Nivel Sistema): Monolito Modular.**
Dado el tamaño del equipo (3 personas) y la necesidad de agilidad, evitamos la penalización operativa de los microservicios. Desplegaremos una única aplicación, pero con fronteras de dominio estrictamente aisladas.

**Micro-Arquitectura (Nivel Aplicación): Arquitectura Hexagonal (Ports & Adapters).**
Dentro de cada módulo del monolito, el dominio es el rey. Aislamos la lógica de Matchmaking y el flujo del Motor RAG de las dependencias externas (FastAPI, PostgreSQL, APIs del Estado).

**Architecture Decision Records (ADR):**
* **ADR-01: Backend Unificado vs Separado.** Decidimos usar un backend único. Se rechaza dividir el servicio de IA del transaccional inicialmente para reducir la latencia de red interna y centralizar los esquemas de datos.
* **ADR-02: Base de Datos Vectorial.** Decidimos usar pgvector sobre PostgreSQL en lugar de una base de datos vectorial dedicada (como ChromaDB o Pinecone) para simplificar la infraestructura y mantener la consistencia transaccional (ACID) entre los metadatos de las leyes y sus embeddings.

## 4. Patrones de Diseño y Lógica (Tactical Design)
Evitando la "pattern-itis", aplicamos combinaciones estratégicas justificadas por casos de uso reales.

| Categoría (GoF) | Patrón Aplicado | Justificación y Uso en el Sistema |
| --- | --- | --- |
| Creacional + Comportamiento | Factory + Strategy | Para el Motor de IA: Una `LLMFactory` instanciará la estrategia adecuada (`GPT4Strategy`, `ClaudeStrategy`) permitiendo intercambiar modelos base sin tocar los casos de uso del Asistente Legal. |
| Estructural + Comportamiento | Decorator + Observer | Para Observabilidad IA: Un decorador medirá la latencia y tokens consumidos de cada llamada al LLM, disparando un evento (Observer) para registrar la métrica de forma asíncrona y no bloquear la respuesta al usuario. |
| Estructural + Acceso a Datos | Repository + Unit of Work | Para Persistencia: El `TerrenoRepository` abstrae las consultas SQL. El Unit of Work garantiza atomicidad al registrar un terreno nuevo y sus imágenes asociadas en un solo bloque transaccional. |

## 5. User Stories y Criterios de Aceptación (BDD)
Las Historias de Usuario están organizadas en cuatro Épicas principales para facilitar la planificación de los Sprints.

**ÉPICA 1: Smart Dashboard & Onboarding B2B**
El núcleo para captar la atención del inversionista usando datos oficiales en tiempo real.
* **HU-01 | Autenticación y Roles (🔴 Crítica)**: Como Administrador del Sistema, quiero gestionar (crear, editar, eliminar) cuentas de Inversionistas, Operadores y Propietarios con diferentes roles, para asegurar el acceso autorizado a la plataforma.
* **HU-02 | Smart Dashboard de Contexto (🔴 Crítica)**: Como Inversionista Extranjero, quiero visualizar un Smart Dashboard inicial con noticias, beneficios fiscales y resoluciones de la ZEEP, para entender el contexto actual sin leer documentos extensos.
* **HU-03 | Scraper de Datos Oficiales (🔴 Crítica)**: Como Sistema (Backend/Scraper), quiero extraer diariamente información de portales web del gobierno (El Peruano, MINCETUR) mediante scraping y exponerla a través de una API interna, para alimentar el Smart Dashboard con datos oficiales actualizados.
* **HU-04 | Resumen Dinámico RAG (🟡 Alta)**: Como Sistema (Agente IA), quiero consumir la API del Scraper para clasificar, traducir y resumir automáticamente las noticias y leyes extraídas, para presentarlas de forma digerible y estructurada en el Smart Dashboard del Inversionista.

**ÉPICA 2: AI Legal Agent & Interacción Multimodal**
El valor diferencial de la plataforma para resolver la fricción burocrática.
* **HU-05 | Asesoría Legal Automatizada (🔴 Crítica)**: Como Inversionista Extranjero, quiero interactuar con un Agente IA (Chatbot) que me explique la normativa de la ZEEP basándose en documentos oficiales (RAG), para resolver dudas legales complejas en mi propio idioma sin intermediarios.
* **HU-06 | Ejecución Proactiva de Búsquedas mediante IA (🔴 Crítica)**: Como Sistema (Agente IA), quiero utilizar Function Calling basado en la intención del usuario, para extraer dinámicamente registros de la base de datos de operadores sin que el usuario navegue por el directorio manual.
  * *Criterios de Aceptación (Gherkin):*
    * `Given` que un usuario pregunta "Busco ingenieros certificados en frío" en el chat legal
    * `When` el AI Agent Service clasifica la intención como una búsqueda de directorio
    * `Then` el Agente ejecuta la herramienta `search_certified_operators(tag="frío")`
    * `And` retorna una lista formateada de 3 proveedores locales al usuario en lenguaje natural.
* **HU-07 | Interacción por Voz (🟢 Baja)**: Como Inversionista Extranjero, quiero utilizar comandos de voz (Speech-to-Text) para interactuar con el Agente IA en la plataforma web, para agilizar mis consultas sin necesidad de escribir.
* **HU-08 | Trazabilidad y Auditoría Legal (🟡 Alta)**: Como Sistema (Auditoría), quiero registrar los prompts ingresados y las fuentes citadas por el Agente IA, para que expertos legales (ej. Colegio de Abogados) puedan auditar periódicamente la calidad de las respuestas.

**ÉPICA 3: Marketplace & Matchmaking Transaccional**
El motor de conexiones comerciales.
* **HU-09 | Directorio de Proveedores Verificados (🔴 Crítica)**: Como Inversionista Extranjero, quiero buscar y filtrar operadores logísticos/servicios peruanos verificados en un directorio, para encontrar socios confiables para mi cadena de suministro.
* **HU-10 | Publicación de Necesidades/Proyectos (🟡 Alta)**: Como Operador Logístico Peruano, quiero publicar requerimientos de infraestructura (ej. automatización de terminal) en un feed de proyectos, para captar el interés de firmas internacionales.
* **HU-11 | Postulación a Proyectos (🟡 Alta)**: Como Inversionista Extranjero, quiero postular ("Inquire Access") en los proyectos publicados en el feed, para iniciar una negociación directa y formal con el operador local.
* **HU-12 | Matchmaking Automatizado (🟡 Alta)**: Como Sistema (Motor Matchmaking), quiero calcular un porcentaje de compatibilidad (Match Score) entre el perfil del Inversionista y los Proyectos/Servicios publicados, para generar notificaciones automatizadas por correo de oportunidades altamente relevantes.

**ÉPICA 4: Omnicanalidad y Validaciones Externas**
Inclusión de actores locales y seguridad jurídica.
* **HU-13 | Onboarding vía WhatsApp para Locales (🔴 Crítica)**: Como Propietario de Terrenos local, quiero interactuar con un Asistente IA a través de WhatsApp para registrar las características de mi terreno y subir fotos, para publicar mi oferta en el Marketplace web sin lidiar con interfaces web complejas.
* **HU-14 | Validación de Existencia Legal (🟡 Alta)**: Como Sistema (Integración), quiero conectarme a APIs externas simuladas (SUNARP, CIP), para validar que las empresas peruanas existan legalmente y los ingenieros estén colegiados antes de otorgarles la insignia de "Verificado".

## 6. Estrategia de IA
**Arquitectura de Datos para IA:** Combinación de RAG (Retrieval-Augmented Generation) para el análisis de la Ley ZEEP, y Function Calling (Tool Use) para interactuar con el módulo de Marketplace interno.
**Prompt Engineering Specs:** Los System Prompts estarán versionados como código. Se implementará un Guardrail a nivel de prompt que exija a la IA citar siempre el "Artículo de la Ley" (Metadato extraído de pgvector) para evitar alucinaciones legales.

## 7. Infraestructura y Stack Tecnológico (Framework 3 "S")
Evaluando Scalability, Speed y Skillset, este es el stack definitivo:
* **A. Lenguaje y Runtime:** Python 3.12. Su ecosistema es inigualable para la orquestación de IA y ofrece una velocidad de desarrollo masiva.
* **B. Persistencia:** PostgreSQL + pgvector (Relacional + Vectorial en el mismo motor). Ideal para aprovechar soluciones en la nube optimizadas para esto.
* **C. Comunicación y API:** FastAPI. Garantiza tipado estricto, inyección de dependencias nativa (perfecto para la Arquitectura Hexagonal) y generación automática de OpenAPI.
* **D. Interfaz UI:** Next.js (React) conectado vía REST.
* **E. Infraestructura y Deployment:** Contenedores Docker desplegados en un entorno serverless o PaaS (como Azure App Services o Container Apps) para cero mantenimiento inicial. Pipelines automáticos con GitHub Actions.

## 8. Estructura del Repositorio (Monorepo)
Diseñada para reflejar la Arquitectura Hexagonal dentro del Monolito Modular:

```plaintext
sovereign-gateway/
├── frontend/                  # Next.js app
├── backend/                   # FastAPI app
│   ├── src/
│   │   ├── shared/            # Kernel: Interfaces globales, Utils, Event Bus en memoria
│   │   ├── modules/           # Monolito Modular
│   │   │   ├── identity/      # Dominio: Usuarios, Roles, Auth
│   │   │   ├── marketplace/   # Dominio: Directorio, Terrenos, Proyectos
│   │   │   │   ├── domain/        # Entidades, Excepciones, Interfaces Repository
│   │   │   │   ├── application/   # Casos de Uso (ej. PublishProjectService)
│   │   │   │   └── infrastructure/# Adaptadores (Controllers, PostgresRepository)
│   │   │   ├── ai_agent/      # Dominio: RAG, Function Calling, Prompts
│   │   │   │   ├── domain/
│   │   │   │   ├── application/
│   │   │   │   └── infrastructure/
│   │   │   └── omnichannel/   # Dominio: Webhooks WhatsApp, Email, Scraper
│   ├── tests/
│   ├── pyproject.toml
│   └── Dockerfile
└── .github/workflows/         # CI/CD
```
