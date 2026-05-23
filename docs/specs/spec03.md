# spec03 — PROFILING: Onboarding Inteligente del Inversor

**nombre del módulo:** onboarding_profiling  
**flujo:** 02. PROFILING  
**objetivo:** Capturar el perfil completo del proyecto de inversión a través de un agente conversacional interactivo, construir el expediente digital del inversor y personalizar el roadmap de instalación con un diagnóstico estimado de 3 minutos.

---

## Descripción

El módulo de Profiling es el segundo paso del flujo de valor. Transforma los datos capturados en la Simulación (spec02) en un expediente estructurado que alimenta el Matchmaking (spec04), el Agente Legal RAG (spec06) y el Ledger de Trazabilidad (spec05). El agente orquestador guía al usuario con preguntas dinámicas adaptadas al sector seleccionado, reduciendo la fricción del formulario tradicional.

---

## Entidades del Dominio

### `InvestorProfile`

```
InvestorProfile
├── id: UUID
├── session_id: UUID  (hereda de SimulationRecord)
├── empresa_origen: EmpresaOrigen
├── proyecto: ProyectoInversion
├── perfil_tecnico: PerfilTecnico (por sector)
├── documentos: List[DocumentoAdjunto]
├── estado_roadmap: RoadmapEstado
└── created_at: datetime
```

### `EmpresaOrigen`

```
EmpresaOrigen
├── razon_social: str
├── pais_origen: str (ISO 3166-1 alpha-2)
├── numero_registro_extranjero: str  (RUC/VAT/EIN equivalente)
├── sector_ciiu: str  (código CIIU Rev. 4)
├── representante_legal: PersonaRepresentante
└── capital_declarado_usd: Decimal
```

### `ProyectoInversion`

```
ProyectoInversion
├── nombre_proyecto: str
├── descripcion_breve: str
├── monto_inversion_usd: Decimal
├── tipo_actividad: TipoActividad (enum por sector)
├── empleo_directo_proyectado: int
├── empleo_indirecto_proyectado: int
├── porcentaje_componentes_locales: float
├── fecha_inicio_estimada: date
├── duracion_construccion_meses: int
└── exportacion_pct: float
```

### `PerfilTecnico` (discriminated union por sector)

```
PerfilManufactura
├── tipo_proceso: str  (batch | continuo | discreto)
├── materias_primas_principales: List[str]
├── capacidad_produccion_anual: str  (en unidades o toneladas)
├── requiere_anexo_4: bool
└── certificaciones_ambientales: List[str]

PerfilCKD
├── producto_ensamblado: str
├── ratio_ckd_importado: float  [0-1]
├── lineas_montaje: int
├── mercado_destino: MercadoDestino  (exportacion | regional | interno)
└── certificaciones_tecnicas: List[str]  (ISO, CE, INACAL)

PerfilTech
├── tipo_servicio: TipoServicioTech  (software | ia | cloud | idi | logistica)
├── pct_servicios_exportables: float
├── requiere_datacenter: bool
├── ratio_empleos_tech: float  [0-1]
└── convenios_universidad: List[str]
```

---

## Flujo Paso a Paso

```
[PASO 1] Transferencia desde Simulación
  ├─ Recibe: session_id, sector, score_final, alertas del spec02
  ├─ Pre-rellena campos coincidentes (sector, CL, empleos, inversión)
  └─ Inicializa InvestorProfile con estado: EN_PROGRESO

[PASO 2] Identificación Corporativa
  ├─ Ingreso de razón social y país de origen
  ├─ Número de registro empresarial extranjero (RUC/VAT/EIN)
  ├─ Representante legal: nombre, DNI/pasaporte, cargo
  └─ Validación básica de formato (no requiere API externa aún)

[PASO 3] Detalle del Proyecto de Inversión
  ├─ Nombre del proyecto y descripción (campo libre, máx. 500 caracteres)
  ├─ Monto de inversión ajustado (puede corregir valor de simulación)
  ├─ Fecha estimada de inicio y duración de construcción
  └─ Porcentaje de exportación proyectada

[PASO 4] Formulario Técnico por Sector (dinámico)
  ├─ [Manufactura] Tipo de proceso, materias primas, capacidad, riesgo ambiental
  ├─ [CKD] Producto a ensamblar, ratio CKD, mercado destino, certificaciones
  └─ [Tech] Tipo de servicio tech, exportabilidad, empleos tech, data center

[PASO 5] Intervención del Agente Orquestador (IA conversacional)
  ├─ Analiza el perfil capturado hasta el momento
  ├─ Formula 2-3 preguntas de clarificación para optimizar el expediente:
  │   Ej: "¿Su proceso de manufactura genera efluentes líquidos? Esto determina
  │        si necesita el Anexo 4 de MINAM antes de la fase de Contratación."
  ├─ Si detecta inconsistencias (ej. CL declarado vs tipo de proceso), alerta
  └─ Sugiere ajustes al perfil para maximizar el score de elegibilidad

[PASO 6] Carga de Documentos (opcional en esta etapa)
  ├─ Documentos recomendados según sector y alertas del score:
  │   ├─ [Todos] Carta de intención de inversión
  │   ├─ [Manufactura] Pre-evaluación ambiental (si requiere Anexo 4)
  │   ├─ [CKD] Lista de certificaciones técnicas vigentes
  │   └─ [Tech] Descripción técnica del servicio / plan de I+D+i
  ├─ Formato aceptado: PDF, máx. 10 MB por archivo
  └─ Almacenamiento: bucket S3 / Azure Blob con referencia en PostgreSQL

[PASO 7] Generación del Roadmap de Instalación Personalizado
  ├─ 4 fases: Elegibilidad | Validación Legal | Contratación | Operación
  ├─ Estimación de días hábiles por fase según perfil del sector:
  │   ├─ Manufactura pesada: +5 días por trámite ambiental
  │   ├─ CKD exportación: +3 días por certificación técnica INACAL
  │   └─ Tech/Software: fase legal simplificada (-4 días)
  ├─ Hitos clave marcados según documentos pendientes
  └─ Asignación de estado inicial: Elegibilidad = COMPLETADO

[PASO 8] Persistencia y Notificación
  ├─ Guarda InvestorProfile completo en PostgreSQL
  ├─ Evento publicado: investor.profile.completed → dispara validación SUNARP
  └─ Redirect al Dashboard principal con Roadmap visible
```

---

## Patrones de Diseño

- **Strategy Pattern:** `PerfilTecnicoStrategy` con variantes por sector para construir el perfil técnico dinámicamente
- **Builder Pattern:** `InvestorProfileBuilder` acumula los pasos del formulario manteniendo estado entre pasos
- **Event-Driven:** Al completar el perfil, publica evento `investor.profile.completed` consumido por módulos de validación y matchmaking

## Integraciones

| Sistema | Uso | Momento |
|---|---|---|
| LLM (Groq) | Agente conversacional de clarificación | Paso 5 |
| SUNARP driver (spec01) | Validación de empresas locales relacionadas | Post-Paso 8 (async) |
| S3/Azure Blob | Almacenamiento de documentos adjuntos | Paso 6 |
| spec02 SimulationRecord | Herencia de datos de simulación | Paso 1 |

## Tests

- `test_transferencia_desde_simulacion`: InvestorProfile inicializado con datos de SimulationRecord
- `test_formulario_manufactura_campos_obligatorios`: error si requiere_anexo_4 no está definido para manufactura pesada
- `test_formulario_ckd_mercado_destino`: PerfilCKD con mercado_destino=exportacion genera roadmap con fase CKD-INACAL
- `test_agente_clarificacion_inconsistencia_cl`: agente detecta CL=50% pero proceso declarado es 100% importado
- `test_evento_profile_completed_publicado`: evento publicado correctamente al finalizar paso 8
- `test_roadmap_dias_manufactura_pesada`: roadmap Manufactura pesada suma +5 días por trámite ambiental
