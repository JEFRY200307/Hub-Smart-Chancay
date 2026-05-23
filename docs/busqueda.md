# GUÍA_CONEXIÓN_SERVICIOS: Propósito y Criterios de Búsqueda para Agentes de IA

Para asegurar la política de "Alucinación Cero" y alimentar correctamente los motores RAG en el onboarding del inversor, el Agente Orquestador debe realizar consultas estructuradas (vía Tavily o APIs integradas) enfocándose en los siguientes objetivos específicos por cada entidad de la lista.

**Implementación operativa:** ver carpeta [`docs/agents/`](../agents/README.md) (prompts, herramientas, flujos de persistencia en BD). Especificaciones: [spec09](../specs/spec09.md), [spec13](../specs/spec13.md).

---

## 1. SUNARP (Superintendencia Nacional de los Registros Públicos)
* **Propósito en la plataforma:** Validación de la personería jurídica e historial de los actores comerciales para mitigar el riesgo operativo del inversor.
* **Qué debe buscar el agente exactamente:**
    * **Vigencia de Poderes:** Verificar si los representantes legales que firman las cartas de intención tienen las facultades vigentes para comprometer a la empresa.
    * **Búsqueda por Razón Social / RUC:** Validar la constitución legal de las empresas locales del "Top 5" que aplican al matchmaking como proveedores logísticos o constructores.
    * **Títulos en trámite:** Monitorear si existen gravámenes o alertas registrales sobre los activos del operador privado o de los proveedores.

## 2. MINCETUR (Ministerio de Comercio Exterior y Turismo)
* **Propósito en la plataforma:** Actualización regulatoria del marco fiscal y normativo de las Zonas Económicas Especiales (ZEE).
* **Qué debe buscar el agente exactamente:**
    * **Resoluciones Ministeriales de Apertura/Modificación:** Extraer las últimas disposiciones de la alta dirección sobre cuotas, beneficios aduaneros y arancelarios específicos de la Ley N° 32449.
    * **Manuales de Operaciones ZEE:** Reglas y guías procedimentales actualizadas para la administración de zonas especiales privadas.
    * **Tratados Comerciales Vigentes:** Cruce de datos sobre aranceles preferenciales que el inversor extranjero puede aprovechar al exportar desde el puerto de Chancay.

## 3. Diario Oficial El Peruano
* **Propósito en la plataforma:** Mantener el estado del arte legal en tiempo real, garantizando que el motor RAG no use leyes derogadas.
* **Qué debe buscar el agente exactamente:**
    * **Separata de Normas Legales (Sección Economía/Producción):** Búsqueda diaria automatizada de nuevas leyes, decretos supremos o fe de erratas que impacten directamente a la Ley ZEEP o al puerto de Chancay.
    * **Jurisprudencia Tributaria y Resoluciones del Tribunal Fiscal:** Casos de éxito o apelaciones resueltas que dicten pautas sobre cómo la SUNAT interpreta los beneficios del 0% de Impuesto a la Renta (IR).

## 4. INACAL (Instituto Nacional de Calidad)
* **Propósito en la plataforma:** Asegurar que los proveedores locales cumplan con los estándares técnicos internacionales exigidos por la manufactura global.
* **Qué debe buscar el agente exactamente:**
    * **Normas Técnicas Peruanas (NTP):** Requisitos de calidad para los sectores metalmecánico, logístico y de construcción (crítico para validar el 30% de componentes locales).
    * **Directorio de Centros de Homologación:** Encontrar laboratorios acreditados para certificar que el talento técnico o los materiales cumplen con los estándares de la cadena de valor del inversor.

## 5. SENACE / PRODUCE (Servicio Nacional de Certificación Ambiental para las Inversiones Sostenibles / Ministerio de la Producción)
* **Propósito en la plataforma:** Viabilidad técnica, licencias de manufactura industrial y permisos de operaciones para el ensamblaje o producción.
* **Qué debe buscar el agente exactamente:**
    * **TUPA de PRODUCE (Texto Único de Procedimientos Administrativos):** Requisitos exactos y tiempos para la obtención de licencias de funcionamiento de plantas de manufactura pesada o ligera.
    * **Clasificación Industrial Internacional Uniforme (CIIU):** Validar si el código CIIU específico del proyecto del inversor califica dentro de la Sección C permitida por la Ley ZEEP.
    * **Plataforma EVA (SENACE):** Estado de las evaluaciones ambientales preliminares sectoriales aplicables a parques industriales.

## 6. MINAM (Ministerio del Ambiente)
* **Propósito en la plataforma:** El principal cuello de botella del onboarding. Mitigación de riesgos en la validación ambiental obligatoria.
* **Qué debe buscar el agente exactamente:**
    * **Estándares de Calidad Ambiental (ECA) y Límites Máximos Permisibles (LMP):** Parámetros vigentes para emisiones, efluentes y ruido industrial aplicables a la zona costera de Chancay.
    * **Términos de Referencia Comunes para el Anexo 4:** Estructura legal exacta del "Certificado de Impacto Ambiental" (o DIA/EIA-sd según el sector) requerido para iniciar obras físicas en la ZEEP.