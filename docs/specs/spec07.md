# spec07 — ETL PADRONRUC: Ingesta Bulk del Padrón de Contribuyentes SUNAT

**nombre del módulo:** analytics_padron_ruc  
**módulo backend:** `modules/analytics_padron_ruc/`  
**objetivo:** Transformar el Padrón de Contribuyentes SUNAT (PadronRUC) en lotes y cargarlo en la tabla `companies` de PostgreSQL, para que el Agente Matchmaker pueda buscar primero en la BD los 5 mejores proveedores locales y recurrir a internet solo si los datos son insuficientes.

---

## Descripción

Este módulo es un pipeline ETL puro. Su única responsabilidad es descargar el archivo bulk mensual del PadronRUC de SUNAT, transformar los registros y hacer upsert en la tabla `companies` en lotes de 1.000 registros. No genera KPIs, no produce dashboards y no contiene modelos predictivos. Los datos cargados son la capa de conocimiento local que el Agente Matchmaker consulta antes de activar búsqueda en internet vía Tavily.

---

## Flujo ETL (Paso a Paso)

```
[PASO 1] Descarga del archivo PadronRUC SUNAT
  ├─ URL pública SUNAT: descarga mensual en formato TXT (pipe-delimited)
  ├─ Tamaño estimado: ~10M registros / ~2 GB por descarga
  ├─ APScheduler: cron el día 5 de cada mes a las 02:00 UTC
  ├─ Verificación de hash SHA-256 para detectar si hubo actualización
  └─ Registro en sync_logs: tipo_sync='padron_ruc', estado inicial='en_proceso'

[PASO 2] Carga en Staging
  ├─ Truncate + bulk insert en tabla padron_ruc_staging
  ├─ Validación de formato: 11 columnas esperadas, encoding UTF-8/Latin-1
  ├─ Rechazo de filas con RUC no numérico o longitud ≠ 11
  └─ Registro: total_registros cargados en staging

[PASO 3] Transformación y Normalización
  ├─ Filtro: incluir solo estado=ACTIVO o SUSPENDIDO
  │   └─ Excluir BAJA definitiva (no aportan candidatos al matchmaking)
  ├─ Mapeo CIIU → sector_interno:
  │   ├─ 1510–3399: manufactura
  │   ├─ 2910–3599 (vehículos/CKD): ckd
  │   ├─ 6201–6209, 7210–7299 (software/tech): tech
  │   ├─ 4900–5399 (transporte/almacen): logistica
  │   └─ resto: otros
  └─ Normalización de ubigeo: código de 6 dígitos (INEI)

[PASO 4] Upsert en companies (lotes de 1.000)
  ├─ ON CONFLICT (ruc) DO UPDATE:
  │   ├─ estado_contribuyente, condicion_contribuyente
  │   ├─ ciiu_principal, ubigeo, fecha_inicio_actividades
  │   ├─ sector_interno (si era NULL)
  │   └─ last_padron_sync = CURRENT_DATE
  ├─ Si el RUC no existe en companies → INSERT con fuente_principal='padron_ruc'
  └─ Los datos SUNARP existentes (directorio, cargas, trust_score) NO se sobreescriben

[PASO 5] Cierre y Registro
  ├─ Actualizar sync_logs: completado_at, total insertados, total actualizados, errores
  └─ Si errores > 5% del total → estado='fallido', notificación al admin
```

---

## Estrategia de Búsqueda del Agente Matchmaker

El objetivo de este ETL es alimentar el siguiente patrón de búsqueda en el Agente Matchmaker (spec04):

```
1. Buscar en companies (PostgreSQL) los 5 mejores candidatos:
   WHERE sector_interno = :sector
     AND condicion_contribuyente = 'HABIDO'
     AND estado_contribuyente = 'ACTIVO'
     AND distancia_puerto_chancay_km <= :distancia_max
   ORDER BY trust_score DESC NULLS LAST
   LIMIT 5

2. Si trust_score IS NULL o last_padron_sync < NOW() - INTERVAL '45 days':
   → Activar búsqueda en internet via Tavily para enriquecer datos faltantes
   → Actualizar web_enrichment_data JSONB en companies

3. Si results < 5 desde BD:
   → Complementar con búsqueda Tavily para encontrar candidatos adicionales
```

---

## Entidades del Dominio

### `PadronRucRecord` (staging — tabla transitoria)

```
padron_ruc_staging
├── ruc: VARCHAR(11)                  PK
├── razon_social: VARCHAR(500)
├── estado_contribuyente: VARCHAR(30) ACTIVO | SUSPENDIDO | BAJA
├── condicion_contribuyente: VARCHAR(20) HABIDO | NO HABIDO
├── tipo_contribuyente: VARCHAR(50)
├── ciiu_principal: VARCHAR(10)
├── ciiu_secundario: VARCHAR(10)
├── ubigeo: VARCHAR(6)
├── departamento: VARCHAR(100)
├── provincia: VARCHAR(100)
├── distrito: VARCHAR(100)
├── direccion: TEXT
├── fecha_inscripcion: DATE
├── fecha_inicio_actividades: DATE
├── fecha_baja: DATE
└── descarga_fecha: DATE             Fecha del archivo bulk
```

El staging actúa como zona de aterrizaje de la descarga mensual. El ETL la lee completa y hace upsert en `companies`. El staging se trunca en cada ejecución mensual.

---

## Casos de Uso

### `run_etl_padron_ruc(filepath: str) -> ETLReport`

Caso de uso principal. Recibe la ruta del archivo TXT descargado, ejecuta los 5 pasos del pipeline y retorna un reporte.

```python
@dataclass
class ETLReport:
    archivo: str
    descarga_fecha: date
    total_staging: int
    total_insertados: int
    total_actualizados: int
    total_rechazados: int
    errores_detalle: list[str]
    duracion_segundos: float
    estado: str                 # completado | fallido | parcial
```

### `get_etl_status() -> SyncLog`

Retorna el estado de la última ejecución del ETL desde `sync_logs`.

---

## API Endpoints

```
POST   /api/v1/analytics/padron/ingest   # Trigger manual del ETL (solo admin)
GET    /api/v1/analytics/padron/status   # Estado de la última ingesta
```

---

## Tecnologías

| Herramienta | Uso |
|---|---|
| `APScheduler` | Cron mensual (día 5, 02:00 UTC) |
| `psycopg3` + `COPY` | Bulk insert eficiente en staging (~10M filas) |
| `pandas` / `polars` | Transformación y normalización del TXT |
| `hashlib` | SHA-256 para verificar si el archivo cambió vs descarga anterior |
| PostgreSQL `ON CONFLICT` | Upsert sin sobreescribir datos SUNARP existentes |

---

## Patrones de Diseño

- **ETL Pipeline:** Extractor → Transformer → Loader; fallo en cualquier paso no corrompe datos previos (transacción por lote)
- **Idempotencia:** Upsert por RUC garantiza que ejecutar el ETL dos veces con el mismo archivo no genera duplicados
- **Repository Pattern:** `PadronRucRepository` abstrae el upsert batch en `companies`

---

## Integración con Otros Módulos

| Módulo | Rol de spec07 |
|---|---|
| SUNARP driver (spec01) | spec07 complementa el `trust_score` con datos tributarios; spec01 aporta datos registrales |
| MATCHMAKING (spec04) | Consume `companies` poblada por spec07 como primer paso de búsqueda |
| ZEEP Ingestion | Comparten la tabla `companies`; spec07 solo escribe campos PadronRUC |

---

## Tests

- `test_etl_paso1_hash_detecta_mismo_archivo`: mismo hash SHA-256 → ETL no re-ejecuta
- `test_etl_paso2_staging_truncate_e_insert`: staging vacío antes → staging con N registros después
- `test_etl_normaliza_ciiu_manufactura`: CIIU 2511 → sector_interno='manufactura'
- `test_etl_excluye_baja_definitiva`: registro con estado=BAJA → no insertado en companies
- `test_etl_upsert_no_sobreescribe_trust_score`: empresa con trust_score=0.90 existente → trust_score intacto tras ETL
- `test_etl_upsert_actualiza_condicion`: empresa con condicion=HABIDO → pasa a NO HABIDO en nuevo padrón
- `test_etl_lote_1000_atomico`: fallo en fila 500 del lote → lote completo revertido, datos anteriores intactos
- `test_etl_report_conteo_correcto`: 3 insert + 2 update + 1 rechazado → ETLReport refleja exactamente esos valores
- `test_get_etl_status_retorna_ultimo_sync`: sync_logs tiene 3 ejecuciones → retorna la más reciente
