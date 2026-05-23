# spec01 — SUNARP Driver: Validación Registral de Empresas y Personas

**nombre del driver:** sunarp_driver  
**módulo backend:** `modules/zeep_ingestion/`  
**objetivo:** Proveer acceso a los datos del Registro Público Empresarial y Personal del Perú (SUNARP) mediante un driver unificado que soporta consultas individuales en tiempo real (para matchmaking) y sincronización bulk periódica (para el directorio de proveedores y analytics).

---

## Descripción

El driver SUNARP es el adaptador de infraestructura que abstrae todas las fuentes de datos registrales peruanas. Combina datos históricos (2019-2024), scraping actualizado del portal SUNARP y el PadronRUC de SUNAT para construir la tabla `companies` enriquecida. Expone una interfaz limpia de consulta que consume el Agente Matchmaker (spec04) a través del patrón Custom Tool, garantizando que los datos de proveedores estén siempre validados antes de presentarlos al inversor.

---

## Fuentes de Datos

| Fuente | Tipo | Contenido | Frecuencia |
|---|---|---|---|
| SUNARP-API (scraper comunitario) | Bulk histórico | Empresas, directorio, cargas 2019-2024 | One-time + anual |
| Portal SUNARP (scraping directo) | Tiempo real | Estado actual, vigencia de poderes, cargas recientes | Por demanda (consulta individual) |
| Gestión 2025 / fuentes alternativas | Bulk parcial PDF | Datos post-2024, requieren extracción OCR | Manual + trimestral |
| PadronRUC SUNAT (bulk TXT) | Bulk mensual (~10M registros) | Estado tributario, CIIU, ubigeo, condición | Mensual (ver spec07) |

---

## Arquitectura del Driver

```
SunarpDriver (puerto de dominio — interface)
  ├─ ScraplingAdapter       ← scraping tiempo real (Scrapling + curl_cffi + Playwright)
  ├─ BulkDataAdapter        ← carga de archivos históricos (CSV/JSON/PDF)
  ├─ SunatPadronAdapter     ← ingesta del PadronRUC bulk (spec07 ETL)
  └─ CompanyRepository      ← persistencia en tabla companies (PostgreSQL)

Flujo de consulta individual (matchmaking):
  Agente Matchmaker
    → SunarpDriver.get_company_by_ruc(ruc)
    → ScraplingAdapter.scrape_sunarp_portal(ruc)
    → CompanyRepository.upsert(company_data)
    → return CompanyDetail
```

---

## Entidades del Dominio

### `Company` (Entidad Principal)

```python
class Company(SQLModel, table=True):
    __tablename__ = "companies"

    ruc: str                          # PK, 11 dígitos
    razon_social: str
    tipo_persona: str                 # JURIDICA | NATURAL
    estado_sunarp: str                # ACTIVA | BAJA | SUSPENDIDA
    fecha_inscripcion: date
    capital_social_soles: Decimal | None
    domicilio_fiscal: str | None
    ubigeo: str | None                # código INEI 6 dígitos
    coordenadas: Any | None           # Point (GiST index)
    distancia_puerto_chancay_km: float | None

    # Datos tributarios SUNAT PadronRUC
    estado_contribuyente: str | None  # ACTIVO | SUSPENDIDO | BAJA
    condicion_contribuyente: str | None  # HABIDO | NO HABIDO
    ciiu_principal: str | None
    fecha_inicio_actividades: date | None

    # Directorio y representación
    directorio: dict | None           # JSONB: {nombre, cargo, dni}[]
    poderes_vigentes: bool | None
    ultima_vigencia_poderes: date | None

    # Cargas registrales
    tiene_cargas: bool
    cargas_detalle: list | None       # JSONB: [{tipo, monto, acreedor}]
    tiene_procedimiento_concursal: bool

    # Scores calculados
    trust_score: float | None         # [0, 1]
    capacidad_operativa: str | None   # alta | media | baja
    sector_interno: str | None        # manufactura | ckd | tech | logistica | otros

    # Control de datos
    fuente_principal: str             # sunarp_scraping | bulk_historico | padron_ruc
    last_sunarp_check: datetime | None
    last_padron_sync: date | None
    created_at: datetime
    updated_at: datetime
```

### `CompanyDetail` (DTO de respuesta para agentes)

```python
@dataclass
class CompanyDetail:
    ruc: str
    razon_social: str
    estado_sunarp: str
    condicion_contribuyente: str
    trust_score: float
    capacidad_operativa: str
    tiene_cargas: bool
    cargas_resumen: str
    directorio_activo: list[dict]
    ciiu_principal: str
    sector_interno: str
    distancia_puerto_chancay_km: float | None
    validacion_timestamp: datetime
```

---

## Funciones del Driver

### Consultas Individuales (Tiempo Real)

#### `get_company_by_ruc(ruc: str) -> CompanyDetail`

Consulta el estado actual de una empresa en el portal SUNARP por RUC. Usado por el Agente Matchmaker antes de presentar un proveedor al inversor.

```
Flujo:
1. Buscar en PostgreSQL: companies WHERE ruc = ? AND last_sunarp_check > NOW() - INTERVAL '24h'
2. Si existe y está actualizado → retornar desde BD (cache)
3. Si no → ScraplingAdapter.scrape_sunarp_portal(ruc)
   ├─ curl_cffi GET https://www.sunarp.gob.pe/busqueda-empresa?ruc={ruc}
   ├─ Playwright para sitios con JS rendering
   └─ Extraer: estado, directorio, poderes, cargas
4. Calcular trust_score
5. CompanyRepository.upsert(company)
6. Retornar CompanyDetail
```

#### `get_company_by_razon_social(query: str, limit: int = 10) -> list[CompanyDetail]`

Búsqueda por nombre de empresa. Primero en PostgreSQL (full-text search), luego scraping si no hay resultados suficientes.

```sql
-- Full-text search en PostgreSQL
SELECT * FROM companies
WHERE to_tsvector('spanish', razon_social) @@ plainto_tsquery('spanish', :query)
  AND estado_sunarp = 'ACTIVA'
ORDER BY trust_score DESC
LIMIT :limit;
```

#### `get_person_by_dni(dni: str) -> PersonDetail`

Consulta persona natural por DNI. Usado para validar representantes legales de empresas inversoras.

```
Flujo:
1. ScraplingAdapter.scrape_reniec(dni)
   └─ Consulta RENIEC (portal web o SUNARP para personas con partida)
2. Retornar: nombre completo, estado civil, vigencia de poderes si aplica
```

#### `validate_company_status(ruc: str) -> ValidationResult`

Validación rápida de estado (sin datos completos). Usado por el módulo de Onboarding para verificar proveedores relacionados.

```python
@dataclass
class ValidationResult:
    ruc: str
    is_active: bool
    is_habido: bool
    has_legal_issues: bool
    summary: str
    checked_at: datetime
```

---

### Sincronización Bulk

#### `sync_bulk_historical(filepath: str, source: str) -> SyncReport`

Carga y normaliza archivos históricos (CSV/JSON de SUNARP-API, PDFs de Gestión 2025).

```
Flujo:
1. Detectar formato del archivo (CSV | JSON | PDF)
2. Si PDF → OCR con pytesseract o PyMuPDF
3. Normalizar a formato interno (Company schema)
4. Upsert masivo en PostgreSQL (batch de 1000 registros)
5. Actualizar campo fuente_principal = 'bulk_historico'
6. Retornar SyncReport: {total, insertados, actualizados, errores}
```

#### `sync_padron_ruc(filepath: str) -> SyncReport`

Carga el PadronRUC de SUNAT (archivo TXT bulk mensual ~10M registros). Delegado a spec07 ETL pero el driver expone la interfaz.

---

### Cálculo del Trust Score

```python
def calculate_trust_score(company: Company) -> float:
    """
    trust_score = (0.4 × validez_sunarp) + (0.3 × antiguedad_norm) + (0.3 × sin_cargas)

    validez_sunarp: 1.0 si estado=ACTIVA y condicion=HABIDO, 0.5 si solo ACTIVA, 0.0 si BAJA
    antiguedad_norm: min(años_desde_inscripcion / 10, 1.0)  # normalizado a 10 años
    sin_cargas: 1.0 si sin cargas ni concursal, 0.5 si cargas menores, 0.0 si concursal activo
    """
    validez = _score_validez(company)
    antiguedad = _score_antiguedad(company)
    sin_cargas = _score_sin_cargas(company)
    return round((0.4 * validez) + (0.3 * antiguedad) + (0.3 * sin_cargas), 4)
```

---

## Herramientas Expuestas al Agente Matchmaker (Custom Tools)

Estas funciones son registradas como tools en el Agente Matchmaker vía Function Calling:

```python
tools = [
    {
        "name": "search_local_providers",
        "description": "Busca proveedores locales validados en SUNARP filtrados por sector, distancia al puerto y trust score mínimo.",
        "parameters": {
            "sector_ciiu": "str - Código CIIU o sector interno",
            "distancia_max_km": "float - Distancia máxima al puerto Chancay en km",
            "trust_score_min": "float - Score mínimo de confianza [0-1]",
            "limit": "int - Máximo de resultados (default 10)"
        }
    },
    {
        "name": "get_company_detail",
        "description": "Obtiene el detalle completo y validación en tiempo real de una empresa por RUC.",
        "parameters": {
            "ruc": "str - RUC de 11 dígitos"
        }
    },
    {
        "name": "validate_company_batch",
        "description": "Valida el estado registral de una lista de RUCs antes de presentarlos al inversor.",
        "parameters": {
            "rucs": "list[str] - Lista de RUCs a validar (máximo 20)"
        }
    }
]
```

---

## Tecnologías de Scraping

| Herramienta | Uso | Razón |
|---|---|---|
| `Scrapling` | Parser HTML principal | Adaptativo, maneja cambios en el DOM automáticamente |
| `curl_cffi` | HTTP con fingerprint de browser | Evita detección de bot en portales SUNARP/RENIEC |
| `Playwright` | Páginas con JavaScript rendering | Para portales que requieren interacción JS |
| `PyMuPDF` | Extracción de texto de PDFs | Documentos de Gestión 2025 y resoluciones SUNARP |
| `pytesseract` | OCR para PDFs escaneados | PDFs de resoluciones antiguas sin texto nativo |

---

## Integración con Otros Módulos

| Módulo | Función usada | Momento |
|---|---|---|
| MATCHMAKING (spec04) | `get_company_by_ruc`, `search_local_providers`, `validate_company_batch` | Real-time al generar MatchResult |
| ONBOARDING (spec03) | `validate_company_status` | Async post `investor.profile.completed` |
| ANALYTICS (spec07) | `sync_padron_ruc`, acceso a tabla `companies` | ETL mensual |
| LEGAL AI (spec06) | `get_company_detail` vía tool del Agente Legal | On-demand cuando consulta incluye empresa específica |

---

## API Endpoints del Módulo

```
GET    /api/v1/ingestion/companies/{ruc}           # Consulta empresa por RUC (con cache 24h)
GET    /api/v1/ingestion/companies/search?q={query} # Búsqueda full-text por razón social
POST   /api/v1/ingestion/companies/validate-batch   # Validación de lista de RUCs
GET    /api/v1/ingestion/persons/{dni}             # Consulta persona por DNI
POST   /api/v1/ingestion/sync/bulk                 # Carga bulk histórico (admin)
POST   /api/v1/ingestion/sync/padron-ruc           # Trigger manual ETL PadronRUC (admin)
GET    /api/v1/ingestion/sync/status               # Estado de la última sincronización
```

---

## Patrones de Diseño

- **Adapter Pattern:** `ScraplingAdapter`, `BulkDataAdapter`, `SunatPadronAdapter` implementan la interface `SunarpDriverPort`
- **Strategy Pattern:** `ScrapingStrategy` selecciona entre Scrapling, curl_cffi o Playwright según el portal objetivo
- **Repository Pattern:** `CompanyRepository` abstrae todas las queries SQL sobre `companies`
- **Cache-aside:** Consultas individuales por RUC usan PostgreSQL como caché de 24h antes de re-scraping

## Tests

- `test_get_company_by_ruc_cache_hit`: RUC en BD con last_sunarp_check < 24h → retorna desde BD sin scraping
- `test_get_company_by_ruc_cache_miss`: RUC sin datos recientes → scraping ejecutado y resultado guardado
- `test_get_company_baja_sunarp`: empresa con estado=BAJA → trust_score=0 y is_active=false
- `test_trust_score_empresa_limpia`: empresa ACTIVA, HABIDO, 8 años, sin cargas → trust_score ≥ 0.85
- `test_trust_score_empresa_con_concursal`: empresa con procedimiento concursal → trust_score ≤ 0.30
- `test_search_local_providers_filtra_distancia`: proveedores a más de 100km del puerto → excluidos del resultado
- `test_sync_bulk_csv_normaliza_campos`: archivo CSV histórico → todos los registros con ruc de 11 dígitos
- `test_validate_company_batch_maximo_20`: lista de 25 RUCs → error de validación (excede límite)
- `test_calculate_trust_score_formula`: trust_score = 0.4×1.0 + 0.3×0.8 + 0.3×1.0 = 0.94 para empresa limpia de 8 años
- `test_scraping_adapter_fallback_playwright`: curl_cffi falla → Playwright activado como fallback
