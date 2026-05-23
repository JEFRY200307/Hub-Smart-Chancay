# spec02 — GANCHO: Motor de Simulación de Elegibilidad ZEEP

**nombre del módulo:** simulacion_elegibilidad  
**flujo:** 01. GANCHO  
**objetivo:** Calcular el Score de Elegibilidad ZEEP en menos de 3 minutos y proyectar el beneficio tributario potencial del inversor, generando el primer enganche de valor antes de cualquier registro.

---

## Descripción

El motor de simulación es el punto de entrada de la plataforma. Recibe el perfil básico del proyecto de inversión, aplica la función de viabilidad por sector, y devuelve un Score de Elegibilidad ZEEP (0–100) junto con una proyección de beneficios fiscales (IR, IGV, aranceles) condicionada al porcentaje de integración de componentes locales. El resultado es consumido por el Agente Técnico para recomendaciones de ajuste y por el módulo de Profiling para personalizar el onboarding.

---

## Fórmula de Elegibilidad (Base)

### Función de Viabilidad General

$$V_{base} = (W_1 \times A) + (W_2 \times \log(1 + t_{inv}^{-1})) + (W_3 \times Z)$$

| Variable | Descripción | Rango | Fuente |
|---|---|---|---|
| `A` | Alineación sectorial con actividades habilitadas por Ley ZEEP N° 32449 | [0, 1] | Tabla de sectores permitidos |
| `t_inv` | Tiempo estimado de instalación en días hábiles (invertido para penalizar plazos largos) | entero > 0 | Input del usuario |
| `Z` | Factor de Zona: proximidad logística al puerto, disponibilidad de lotes, conectividad | [0, 1] | Geodata ZEEP Chancay |
| `W1` | Peso alineación sectorial | 0.45 | ADR-02 |
| `W2` | Peso velocidad de instalación | 0.25 | ADR-02 |
| `W3` | Peso factor de zona | 0.30 | ADR-02 |

### Ajuste por Integración de Componentes Locales (CL)

$$\Delta_{CL} = W_4 \times CL \times B_{fiscal}$$

- `CL` = porcentaje declarado de componentes / insumos locales [0, 1]
- `B_fiscal` = 1.0 si `CL ≥ 0.30`, 0.5 si `0.15 ≤ CL < 0.30`, 0.0 si `CL < 0.15`
- `W4 = 0.20`
- Umbral `CL ≥ 0.30` activa proyección de **0% Impuesto a la Renta** según Ley 32449

### Score Final por Sector

$$V_{final} = \min\left(100,\ (V_{base} + \Delta_{CL} + \Delta_{sector}) \times 100\right)$$

---

## Deltas Sectoriales

### Sector A — Manufactura y Transformación Industrial

Incluye: procesamiento de materias primas, agroindustria avanzada, manufactura ligera/pesada, bienes tecnológicos.

$$\Delta_{mfg} = (W_5 \times VA_{norm}) + (W_6 \times EG_{norm}) - (W_7 \times IA_{risk})$$

| Variable | Descripción | Cálculo / Fuente |
|---|---|---|
| `VA_norm` | Valor agregado generado / inversión total, normalizado [0,1] | Input del usuario, normalizado con min-max sectorial |
| `EG_norm` | Empleos directos generados, normalizado [0,1] | Input usuario / benchmark sectorial PRODUCE |
| `IA_risk` | Riesgo de impacto ambiental [0,1]; alto si requiere Anexo 4 (MINAM) | Clasificación por tipo de industria (tabla interna) |
| `W5=0.15`, `W6=0.10`, `W7=0.10` | Pesos manufactura | ADR-02 |

**Bonus adicional:** Si `CL ≥ 0.30` y sector es metalmecánica o agroindustria → `+5 puntos` por alineación con clúster Lima Norte.

---

### Sector B — Actividades de Ensamblaje (CKD)

Incluye: líneas CKD para vehículos, maquinaria, electrónica, equipos industriales; orientadas a exportación o distribución regional.

$$\Delta_{ckd} = (W_5 \times (1 - RCKD)) + (W_6 \times DE) + (W_7 \times CERT_{norm})$$

| Variable | Descripción | Rango / Fuente |
|---|---|---|
| `RCKD` | Ratio de componentes CKD importados vs total del producto ensamblado [0,1] | Input usuario (menor RCKD = más componentes locales = mejor score) |
| `DE` | Destino de producción: 1.0=exportación total, 0.7=distribución regional, 0.3=mercado interno | Input usuario (selector) |
| `CERT_norm` | Nivel de certificaciones técnicas vigentes (ISO, INACAL, CE) normalizado [0,1] | Input usuario; validado contra catálogo INACAL |
| `W5=0.15`, `W6=0.12`, `W7=0.08` | Pesos ensamblaje | ADR-02 |

**Regla especial:** Si `RCKD > 0.85` (casi 100% importado), penalización de `-10 puntos` por baja integración; el sistema alerta y recomienda estrategia de sustitución de importaciones.

---

### Sector C — Servicios y Tecnología

Incluye: software, IA, cloud, I+D+i, servicios logísticos avanzados, comercio exterior tecnológico.

$$\Delta_{tech} = (W_5 \times RD_{score}) + (W_6 \times SE_{factor}) + (W_7 \times EAV_{norm})$$

| Variable | Descripción | Cálculo / Fuente |
|---|---|---|
| `RD_score` | Nivel de I+D+i: 1.0 si la actividad principal es investigación/innovación, 0.5 si es servicio tech, 0.2 si es soporte | Clasificación por CIIU + input usuario |
| `SE_factor` | Porcentaje de servicios exportables (facturación en divisas) [0,1] | Input usuario |
| `EAV_norm` | Empleos de alto valor tecnológico (ingenieros, científicos) / total empleos, normalizado | Input usuario / benchmark CONCYTEC |
| `W5=0.18`, `W6=0.14`, `W7=0.08` | Pesos tech | ADR-02 |

**Bonus:** Proyectos con `RD_score = 1.0` acceden automáticamente al régimen CITE (Centro de Innovación Tecnológica) con beneficios adicionales presentados en el resultado.

---

## Integración con IA

### Rol del Agente Técnico

Una vez calculado `V_final`, el **Agente Técnico** actúa como consejero de optimización:

1. Analiza qué variables tienen más impacto negativo en el score
2. Genera 2–3 recomendaciones concretas para mejorar el puntaje (ej. "Incrementar CL de 20% a 30% activa beneficio de 0% IR")
3. Alerta sobre cuellos de botella obligatorios según el sector (ej. Certificado de Impacto Ambiental Anexo 4 para manufactura pesada)
4. Estima el potencial de mejora del score con cada recomendación

### Rol del Agente Financiero

1. Calcula la proyección tributaria concreta: IR actual vs IR con ZEEP, ahorro estimado en 5 años
2. Presenta el **Dossier de Beneficios Fiscales** preliminar: exoneración IGV, arancel 0%, IR condicional
3. Aplica la fórmula de ahorro: `Ahorro_IR = InversionAnual × TasaIR_standard × (1 - B_fiscal_aplicado)`

---

## Flujo Paso a Paso

```
[PASO 1] Selección de Sector
  ├─ Usuario selecciona: Manufactura | Ensamblaje CKD | Servicios/Tech
  └─ Sistema carga el formulario dinámico correspondiente al sector

[PASO 2] Ingreso de Variables Base (todos los sectores)
  ├─ País de origen del capital
  ├─ Monto estimado de inversión (USD)
  ├─ Número de empleos directos proyectados
  ├─ Porcentaje de componentes/insumos locales (slider 0-100%)
  └─ Tiempo estimado de inicio de operaciones (meses)

[PASO 3] Variables Específicas del Sector (formulario dinámico)
  ├─ [Manufactura] Tipo de proceso, nivel de impacto ambiental, VA estimado
  ├─ [CKD] Ratio CKD, destino de producción, certificaciones disponibles
  └─ [Tech] Tipo de servicio, % exportable, ratio empleos tech vs total

[PASO 4] Cálculo Automático (backend FastAPI)
  ├─ Ejecuta V_base
  ├─ Aplica ΔCL y Δ_sector correspondiente
  ├─ Normaliza y clampea a [0, 100]
  └─ Genera flags de alerta (riesgo ambiental, bajo CL, RCKD alto)

[PASO 5] Intervención del Agente Técnico (LLM - Groq)
  ├─ Recibe: score, sector, variables de entrada, flags de alerta
  ├─ Genera: top 3 recomendaciones de mejora con impacto estimado
  └─ Redacta: alerta prioritaria (ej. "Anexo 4 obligatorio para su sector")

[PASO 6] Cálculo Fiscal (Agente Financiero)
  ├─ Proyección de ahorro IR a 5 años
  ├─ Tabla comparativa: régimen estándar vs régimen ZEEP
  └─ Beneficios adicionales por sector (CITE, I+D+i, CKD)

[PASO 7] Presentación del Resultado
  ├─ Score visual (gauge 0-100) con clasificación:
  │   ├─ 80-100: ELEGIBLE — Proceder a Onboarding
  │   ├─ 60-79:  VIABLE CON AJUSTES — Ver recomendaciones
  │   └─ <60:   NO ELEGIBLE — Ver motivos y alternativas
  ├─ Proyección tributaria (ahorro USD en 5 años)
  ├─ Recomendaciones del Agente Técnico
  └─ CTA: [Iniciar Onboarding Completo] → Módulo PROFILING

[PASO 8] Persistencia
  └─ Guardar SimulationRecord en PostgreSQL: inputs, score, sector, timestamp, session_id
```

---

## Output del Módulo

```json
{
  "session_id": "uuid",
  "sector": "manufactura | ckd | tech",
  "score_base": 0.72,
  "score_final": 78.5,
  "clasificacion": "VIABLE_CON_AJUSTES",
  "beneficio_cl_activo": true,
  "proyeccion_fiscal": {
    "ir_estandar_pct": 29.5,
    "ir_zeep_pct": 0.0,
    "ahorro_5_anos_usd": 1250000
  },
  "alertas": ["requiere_anexo_4", "cl_umbral_limite"],
  "recomendaciones_agente": [
    "Incrementar CL de 28% a 30% activa 0% IR (impacto: +4.2 puntos)",
    "Certificación ISO 9001 mejora score CKD en +2.1 puntos",
    "Carga anticipada del Anexo 4 reduce riesgo de retraso en 15 días hábiles"
  ],
  "timestamp": "2026-01-15T10:30:00Z"
}
```

---

## Patrones de Diseño

- **Strategy Pattern:** `SectorScoringStrategy` con implementaciones `ManufacturaScoringStrategy`, `CKDScoringStrategy`, `TechScoringStrategy`
- **Factory Pattern:** `SectorStrategyFactory.create(sector_type)` instancia la estrategia correcta
- **Decorator Pattern:** `ObservabilityDecorator` sobre el servicio de scoring para métricas de latencia y tracking de inputs

## Integraciones Externas

| Sistema | Uso | Método |
|---|---|---|
| Groq API | Agente Técnico y Financiero (LLM) | HTTP REST |
| INACAL | Validación de certificaciones técnicas | Tavily Search |
| PRODUCE/MINCETUR | Clasificación sectorial CIIU | Base de datos interna (ingesta previa) |
| MINAM | Clasificación de riesgo ambiental por tipo de industria | Tabla interna + alerta |

## Tests

- `test_manufactura_score_bajo_cl`: CL=0.10 → sin beneficio fiscal activado
- `test_manufactura_score_cl_umbral`: CL=0.30 → B_fiscal=1.0, 0% IR proyectado
- `test_ckd_rckd_alto_penalizacion`: RCKD=0.90 → penalización de -10 puntos aplicada
- `test_tech_rd_score_bonus_cite`: RD_score=1.0 → acceso a régimen CITE en output
- `test_score_clampeado_100`: score resultante nunca supera 100
- `test_agente_tecnico_recomendaciones`: LLM genera al menos 2 recomendaciones válidas
- `test_persistencia_simulation_record`: SimulationRecord guardado en PostgreSQL tras cálculo
