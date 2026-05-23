# spec04 — MATCH: Motor de Matchmaking Institucional

**nombre del módulo:** matchmaking  
**flujo:** 03. MATCH  
**objetivo:** Conectar automáticamente al inversor con los profesionales e instituciones idóneas (Ingenieros CIP, Abogados CAL, Proveedores SUNARP) mediante un algoritmo de compatibilidad multicriteria, eliminando la intermediación manual.

---

## Descripción

El módulo de Matchmaking toma el `InvestorProfile` construido en Profiling (spec03) y ejecuta el Agente Matchmaker para identificar y rankear los mejores candidatos en tres categorías: ingenieros técnicos certificados CIP, abogados corporativos CAL especializados en ZEEP y proveedores logísticos validados en SUNARP. El resultado es un shortlist de Top 5 por categoría con score de compatibilidad, justificación generada por IA y disponibilidad estimada.

---

## Entidades del Dominio

### `MatchResult`

```
MatchResult
├── id: UUID
├── investor_profile_id: UUID
├── categoria: CategoriaMatch (ingeniero_cip | abogado_cal | proveedor_local)
├── candidatos: List[CandidatoMatch]  (máx. 5)
├── score_promedio: float
├── justificacion_agente: str
└── created_at: datetime

CandidatoMatch
├── candidato_id: UUID
├── nombre: str
├── score_compatibilidad: float  [0-1]
├── especialidad_principal: str
├── disponibilidad: DisponibilidadEstado  (disponible | parcial | ocupado)
├── idiomas: List[str]  (es, en, zh)
├── validacion_institucional: ValidacionEstado  (vigente | vencida | en_proceso)
└── justificacion: str  (generada por LLM)
```

---

## Algoritmo de Compatibilidad

### Función de Score por Candidato

$$S_{candidato} = (W_1 \times E_{sector}) + (W_2 \times D_{geo}) + (W_3 \times I_{idioma}) + (W_4 \times H_{hist}) + (W_5 \times V_{inst})$$

| Variable | Descripción | Rango | Peso |
|---|---|---|---|
| `E_sector` | Alineación de especialidad del candidato con el sector CIIU del inversor | [0,1] | W1=0.35 |
| `D_geo` | Proximidad geográfica (Chancay/Lima Norte vs resto del país) | [0,1] | W2=0.20 |
| `I_idioma` | Match de idiomas: chino mandarín suma +0.3 para inversores de China; inglés +0.15 | [0,1] | W3=0.20 |
| `H_hist` | Historial de transacciones exitosas en la plataforma (cold-start=0.5) | [0,1] | W4=0.15 |
| `V_inst` | Validación institucional vigente y sin observaciones | {0, 0.5, 1.0} | W5=0.10 |

### Ajustes por Categoría

**Ingenieros CIP:**
- Bonus `+0.15` si la especialidad coincide con el proceso técnico declarado (ej. mecánica industrial para CKD)
- Bonus `+0.10` si tiene experiencia acreditada en zonas económicas especiales (campo en perfil CIP)
- Penalización `-0.20` si habilitación CIP vencida (verificada vía API CIP en tiempo real)

**Abogados CAL:**
- Bonus `+0.20` si está certificado en Ley ZEEP N° 32449 (campo especialización CAL)
- Bonus `+0.15` por idioma: ZH para inversores chinos, EN para resto de Asia/Europa
- Penalización `-0.30` si no tiene certificación ZEEP vigente

**Proveedores Locales:**
- Bonus `+0.15` si tiene contrato activo con el Operador ZEEP Chancay
- Bonus `+0.10` si tiene certificación SUNARP vigente sin cargas registrales
- Variable `capacidad_operativa` del perfil SUNARP: normalizada y sumada directamente
- Penalización `-0.25` si tiene procedimientos concursales activos (dato SUNARP)

---

## Fuentes de Datos de Candidatos

| Fuente | Tipo | Método de Acceso | Frecuencia de Actualización |
|---|---|---|---|
| CIP Lima API | Ingenieros habilitados | API REST (OAuth2 institucional) | Tiempo real (query por RUC/CIP) |
| CAL API | Abogados certificados | API REST institucional | Tiempo real |
| SUNARP (spec01 driver) | Proveedores locales | PostgreSQL local + refresh semanal | Semanal (cron APScheduler) |
| Plataforma interna | Historial de matches y ratings | PostgreSQL | Tiempo real |

---

## Flujo Paso a Paso

```
[PASO 1] Recepción del InvestorProfile
  ├─ Extrae: sector CIIU, país de origen, idioma preferido, necesidades técnicas
  ├─ Extrae: alertas de spec02 (requiere_anexo_4, riesgo CKD, etc.)
  └─ Determina categorías prioritarias según sector y roadmap:
      ├─ Manufactura: Ingeniero (prioridad 1), Proveedor (2), Abogado (3)
      ├─ CKD: Ingeniero CKD (1), Abogado aduanero (2), Proveedor logístico (3)
      └─ Tech: Abogado IP/tech (1), Proveedor cloud/datacenter (2), Ingeniero (3)

[PASO 2] Query de Candidatos por Categoría
  ├─ CIP: llamada a API CIP filtrando por especialidad CIIU + región Lima/Chancay
  ├─ CAL: llamada a API CAL filtrando por especialización ZEEP + idioma
  ├─ Proveedores: query en PostgreSQL (tabla companies del spec01) con filtros:
  │   ├─ sector compatible
  │   ├─ sin cargas registrales graves
  │   └─ capacidad_operativa > umbral mínimo
  └─ Pool inicial: máx. 50 candidatos por categoría para scoring

[PASO 3] Scoring Multicriteria
  ├─ Calcula S_candidato para cada candidato del pool
  ├─ Aplica ajustes específicos por categoría
  └─ Ordena por score descendente

[PASO 4] Intervención del Agente Matchmaker (LLM)
  ├─ Recibe: Top 10 candidatos por categoría con scores y atributos
  ├─ Recibe: resumen del InvestorProfile y alertas activas
  ├─ Genera justificación personalizada para Top 5 de cada categoría:
  │   Ej: "El Ing. Ramírez (CIP 58423) tiene experiencia directa en líneas
  │        CKD automotriz en zonas francas, idioma inglés y disponibilidad
  │        inmediata. Recomendado como primera opción dado su historial
  │        certificado con el Operador ZEEP en la misma categoría industrial."
  ├─ Detecta si el pool tiene menos de 5 candidatos válidos y genera alerta
  └─ Propone fecha tentativa de primera reunión (según disponibilidad declarada)

[PASO 5] Validación en Tiempo Real
  ├─ Re-verifica habilitación CIP/CAL de los Top 5 al momento de presentar
  ├─ Re-verifica estado registral SUNARP de proveedores Top 5
  └─ Marca candidatos con validación fallida como REQUIERE_VERIFICACION

[PASO 6] Presentación de Resultados al Usuario
  ├─ Vista de 3 columnas: Ingenieros | Abogados | Proveedores
  ├─ Cada tarjeta muestra:
  │   ├─ Nombre, foto (si disponible), institución validadora
  │   ├─ Score de compatibilidad (barra visual)
  │   ├─ Especialidad, idiomas, disponibilidad
  │   ├─ Justificación del Agente Matchmaker
  │   └─ Botones: [Solicitar Reunión] [Ver Perfil Completo]
  └─ Filtros: por idioma, disponibilidad, especialidad

[PASO 7] Solicitud de Reunión
  ├─ Usuario selecciona candidato(s) y solicita primera reunión
  ├─ Sistema genera evento de reunión en el Ledger (spec05)
  ├─ Notificación al candidato vía email/WhatsApp
  └─ Estado del match: PENDIENTE → REUNIÓN_PROGRAMADA

[PASO 8] Persistencia
  └─ MatchResult guardado en PostgreSQL con scores, candidatos, justificaciones y timestamp
```

---

## Patrones de Diseño

- **Strategy Pattern:** `MatchScoringStrategy` con variantes `CIPMatchStrategy`, `CALMatchStrategy`, `ProveedorMatchStrategy`
- **Repository Pattern:** `CandidatoRepository` abstrae el acceso a CIP API, CAL API y PostgreSQL
- **Chain of Responsibility:** pipeline de validación → scoring → ranking → justificación IA

## Integraciones

| Sistema | Uso | Autenticación |
|---|---|---|
| CIP Lima API | Consulta de ingenieros habilitados | OAuth2 institucional |
| CAL API | Consulta de abogados certificados | OAuth2 institucional |
| SUNARP driver (spec01) | Datos de proveedores locales | PostgreSQL local |
| LLM Groq | Agente Matchmaker (justificaciones) | API Key |
| Tavily Search | Búsqueda complementaria de perfil público | API Key |

## Tests

- `test_score_candidato_cip_completo`: candidato con todos los bonuses → score ≥ 0.85
- `test_penalizacion_habilitacion_cip_vencida`: candidato con habilitación vencida → score disminuido en 0.20
- `test_prioridad_idioma_zh_inversores_chinos`: inversores de China → candidatos ZH rankeados más alto
- `test_match_manufactura_orden_prioridad`: sector manufactura → Ingeniero como categoría prioridad 1
- `test_agente_matchmaker_genera_justificacion`: justificación ≥ 80 caracteres por candidato
- `test_validacion_tiempo_real_falla`: candidato Top 1 con habilitación vencida → marcado REQUIERE_VERIFICACION
- `test_evento_reunion_ledger`: solicitud de reunión genera evento en Ledger (spec05)
