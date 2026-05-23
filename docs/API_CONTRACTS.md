# API Contracts — COMEX.AI / Sovereign Gateway

**Versión:** 1.0 | **Fecha:** 2026-05-22  
**Base URL:** `https://api.comex.ai/api/v1` (producción) · `http://localhost:8000/api/v1` (local)  
**OpenAPI docs:** `/docs` (Swagger UI) · `/redoc` (ReDoc)  
**Basado en:** spec01–spec08, ADR-01, DB_SCHEMA v1.1

---

## Convenciones

### Autenticación
Todos los endpoints protegidos requieren `Authorization: Bearer <jwt>` en el header.  
Niveles de acceso:
- `public` — sin token requerido
- `inversor` — cualquier usuario autenticado con rol inversor
- `profesional` — ingenieros CIP / abogados CAL registrados
- `operador_zeep` — entidad operadora de la ZEEP
- `admin` — administrador de plataforma

### Formato de Error (RFC 7807)
Todos los errores siguen el estándar Problem Details:
```json
{
  "type": "https://comex.ai/errors/not-found",
  "title": "Recurso no encontrado",
  "status": 404,
  "detail": "No existe empresa con RUC 12345678901",
  "instance": "/api/v1/ingestion/companies/12345678901"
}
```

### Paginación
Endpoints que devuelven listas usan query params:
- `page` — número de página (default: 1)
- `size` — ítems por página (default: 20, max: 100)

Respuesta paginada:
```json
{
  "items": [...],
  "total": 150,
  "page": 1,
  "size": 20,
  "pages": 8
}
```

---

## Índice

1. [IDENTITY — Autenticación y Registro](#identity)
2. [SIMULATION — Motor de Elegibilidad ZEEP](#simulation)
3. [ONBOARDING — Profiling del Inversor](#onboarding)
4. [MATCHMAKING — Directorio y Match Institucional](#matchmaking)
5. [LEDGER — Trazabilidad e Inmutabilidad](#ledger)
6. [LEGAL AI — Agente RAG](#legal-ai)
7. [ETL PADRONRUC — Ingesta SUNAT](#etl-padronruc)
8. [ZEEP INGESTION — SUNARP Driver](#zeep-ingestion)

---

## 1. IDENTITY — Autenticación y Registro <a name="identity"></a>

### `POST /auth/register/company`
**Auth:** public | **Spec:** spec08

Registra una empresa extranjera y envía un OTP al email corporativo.

**Request:**
```json
{
  "nombre_empresa": "COSCO Shipping Industries Co.",
  "pais_origen": "CN",
  "sector_interes": "manufactura",
  "email_corporativo": "contact@cosco-shipping.com",
  "nombre_representante": "Li Wei"
}
```

| Campo | Tipo | Requerido | Notas |
|---|---|---|---|
| `nombre_empresa` | string | ✓ | Razón social de la empresa extranjera |
| `pais_origen` | string | ✓ | ISO 3166-1 alpha-2 (2 chars) |
| `sector_interes` | enum | ✓ | `manufactura` \| `ckd` \| `tech` |
| `email_corporativo` | string | ✓ | Email único; recibirá el OTP |
| `nombre_representante` | string | ✓ | Nombre del contacto que realiza el registro |

**Response `201`:**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "contact@cosco-shipping.com",
  "otp_enviado": true,
  "mensaje": "Revisa tu correo corporativo. El código expira en 15 minutos."
}
```

**Errores:**
| Status | Código | Descripción |
|---|---|---|
| 409 | `email_already_verified` | Email ya registrado y verificado |
| 422 | `invalid_email_format` | Formato de email inválido |
| 422 | `invalid_sector` | Sector no permitido |

---

### `POST /auth/verify-email`
**Auth:** public | **Spec:** spec08

Verifica el código OTP recibido por email. En caso exitoso retorna JWT de acceso y crea el InvestorProfile inicial.

**Request:**
```json
{
  "email": "contact@cosco-shipping.com",
  "otp_code": "483921"
}
```

**Response `200`:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "investor_profile_id": "660e8400-e29b-41d4-a716-446655440001"
}
```

**Errores:**
| Status | Código | Descripción |
|---|---|---|
| 400 | `invalid_otp` | Código incorrecto |
| 410 | `otp_expired` | Código expirado (TTL 15 min) |
| 429 | `max_attempts_reached` | Máximo 5 intentos fallidos alcanzado |

---

### `POST /auth/resend-otp`
**Auth:** public | **Spec:** spec08

Reenvía un nuevo código OTP. Cooldown de 60 segundos entre reenvíos.

**Request:**
```json
{ "email": "contact@cosco-shipping.com" }
```

**Response `200`:**
```json
{
  "otp_enviado": true,
  "cooldown_seconds": 60,
  "expires_in_minutes": 15
}
```

**Errores:**
| Status | Código | Descripción |
|---|---|---|
| 429 | `resend_cooldown` | Espera N segundos antes de reenviar |
| 404 | `user_not_found` | Email no registrado |

---

### `POST /auth/login`
**Auth:** public

Autenticación con email y contraseña (usuarios que ya completaron registro OTP).

**Request:**
```json
{
  "email": "contact@cosco-shipping.com",
  "password": "s3cur3P@ssw0rd"
}
```

**Response `200`:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "contact@cosco-shipping.com",
    "role": "inversor",
    "full_name": "Li Wei",
    "preferred_lang": "zh",
    "is_verified": true
  }
}
```

**Errores:**
| Status | Código | Descripción |
|---|---|---|
| 401 | `invalid_credentials` | Email o contraseña incorrectos |
| 403 | `email_not_verified` | Cuenta no verificada; reenviar OTP |
| 403 | `account_inactive` | Cuenta desactivada por admin |

---

### `POST /auth/refresh`
**Auth:** public (refresh token en body)

Rota el access token usando el refresh token.

**Request:**
```json
{ "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
```

**Response `200`:** igual a `/auth/login` response.

**Errores:**
| Status | Código | Descripción |
|---|---|---|
| 401 | `invalid_refresh_token` | Token inválido o revocado |
| 401 | `refresh_token_expired` | Token expirado |

---

### `POST /auth/logout`
**Auth:** inversor (cualquier rol autenticado)

Revoca el refresh token actual.

**Request:** `{}` (vacío; el JWT identifica al usuario)

**Response `204`:** sin cuerpo.

---

### `GET /auth/me`
**Auth:** inversor (cualquier rol autenticado)

Retorna el perfil del usuario autenticado.

**Response `200`:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "contact@cosco-shipping.com",
  "role": "inversor",
  "full_name": "Li Wei",
  "preferred_lang": "zh",
  "is_active": true,
  "is_verified": true,
  "last_login_at": "2026-05-22T10:30:00Z",
  "created_at": "2026-05-22T09:15:00Z"
}
```

---

## 2. SIMULATION — Motor de Elegibilidad ZEEP <a name="simulation"></a>

### `POST /simulation/calculate`
**Auth:** public | **Spec:** spec02

Calcula el Score de Elegibilidad ZEEP. No requiere cuenta; se identifica por `session_id` de cliente.

**Request:**
```json
{
  "session_id": "anon-550e8400-e29b-41d4-a716",
  "sector": "manufactura",
  "pais_origen": "CN",
  "monto_inversion_usd": 5000000,
  "empleo_directo": 120,
  "empleo_indirecto": 50,
  "porcentaje_cl": 35,
  "tiempo_instalacion_meses": 8,
  "exportacion_pct": 60,
  "variables_sector": {
    "tipo_proceso": "continuo",
    "requiere_anexo_4": false,
    "va_estimado_pct": 45,
    "tipo_impacto_ambiental": "bajo"
  }
}
```

| Campo | Tipo | Requerido | Notas |
|---|---|---|---|
| `session_id` | string | ✓ | UUID generado por el cliente; persiste la sesión anónima |
| `sector` | enum | ✓ | `manufactura` \| `ckd` \| `tech` |
| `pais_origen` | string | ✓ | ISO 3166-1 alpha-2 |
| `monto_inversion_usd` | number | ✓ | Mayor a 0 |
| `empleo_directo` | integer | ✓ | Mayor o igual a 0 |
| `porcentaje_cl` | number | ✓ | [0, 100] — componentes locales |
| `tiempo_instalacion_meses` | integer | ✓ | Mayor a 0 |
| `variables_sector` | object | ✓ | Estructura varía por sector (ver abajo) |

**`variables_sector` por sector:**

*Manufactura:*
```json
{
  "tipo_proceso": "batch | continuo | discreto",
  "requiere_anexo_4": false,
  "va_estimado_pct": 45,
  "tipo_impacto_ambiental": "alto | medio | bajo"
}
```

*CKD:*
```json
{
  "producto_ensamblado": "Vehículos ligeros",
  "ratio_ckd_importado": 0.6,
  "mercado_destino": "exportacion | regional | interno",
  "certificaciones": ["ISO 9001", "INACAL"]
}
```

*Tech:*
```json
{
  "tipo_servicio": "software | ia | cloud | idi | logistica",
  "pct_servicios_exportables": 70,
  "requiere_datacenter": false,
  "ratio_empleos_tech": 0.8
}
```

**Response `200`:**
```json
{
  "session_id": "anon-550e8400-e29b-41d4-a716",
  "sector": "manufactura",
  "score_base": 0.72,
  "v_final": 84.5,
  "clasificacion": "elegible",
  "beneficio_cl_activo": true,
  "proyeccion_fiscal": {
    "ir_estandar_pct": 29.5,
    "ir_zeep_pct": 0.0,
    "ahorro_5_anos_usd": 1475000,
    "igv_exonerado": true,
    "arancel_0": true
  },
  "alertas": [],
  "recomendaciones_agente": [
    "Su CL del 35% supera el umbral del 30%, activando el régimen 0% IR.",
    "Considere certificación ISO 14001 para reforzar la evaluación ambiental.",
    "Proceso continuo con impacto bajo reduce el tiempo de trámite SENACE en ~5 días."
  ],
  "timestamp": "2026-05-22T10:30:00Z"
}
```

**Errores:**
| Status | Código | Descripción |
|---|---|---|
| 422 | `invalid_sector_variables` | Campos requeridos faltantes según el sector |
| 422 | `porcentaje_cl_out_of_range` | porcentaje_cl fuera de [0, 100] |

---

### `GET /simulation/{session_id}`
**Auth:** public

Recupera el resultado de una simulación previa por session_id.

**Response `200`:** mismo schema que `POST /simulation/calculate`.

**Errores:**
| Status | Descripción |
|---|---|
| 404 | Simulación no encontrada para ese session_id |

---

## 3. ONBOARDING — Profiling del Inversor <a name="onboarding"></a>

### `POST /onboarding/profiles`
**Auth:** inversor | **Spec:** spec03

Crea un InvestorProfile vinculando la cuenta con la simulación previa.

**Request:**
```json
{
  "session_id": "anon-550e8400-e29b-41d4-a716",
  "empresa": {
    "razon_social": "COSCO Shipping Industries Co.",
    "pais_origen": "CN",
    "numero_registro_extranjero": "91310000MA1FL8NG12",
    "sector_ciiu": "2811",
    "capital_declarado_usd": 5000000
  },
  "representante_legal": {
    "nombre": "Li Wei",
    "documento_identidad": "G12345678",
    "tipo_documento": "pasaporte",
    "cargo": "Director General"
  },
  "proyecto": {
    "nombre_proyecto": "Planta Manufactura Pesada Chancay",
    "descripcion_breve": "Planta de manufactura de equipos industriales pesados para exportación a LATAM.",
    "monto_inversion_usd": 5000000,
    "empleo_directo_proyectado": 120,
    "porcentaje_componentes_locales": 35,
    "fecha_inicio_estimada": "2026-09-01",
    "duracion_construccion_meses": 8,
    "exportacion_pct": 60
  },
  "perfil_tecnico": {
    "tipo_proceso": "continuo",
    "materias_primas_principales": ["acero", "aluminio"],
    "capacidad_produccion_anual": "5000 toneladas",
    "requiere_anexo_4": false,
    "certificaciones_ambientales": []
  }
}
```

**Response `201`:**
```json
{
  "profile_id": "660e8400-e29b-41d4-a716-446655440001",
  "estado": "en_progreso",
  "roadmap": [
    {"fase": "elegibilidad", "estado": "completado", "dias_estimados": 0},
    {"fase": "validacion_legal", "estado": "en_progreso", "dias_estimados": 5},
    {"fase": "contratacion", "estado": "pendiente", "dias_estimados": 7},
    {"fase": "operacion", "estado": "pendiente", "dias_estimados": 3}
  ],
  "preguntas_clarificacion": [
    "¿Su proceso genera efluentes líquidos? Esto determina si necesita el Anexo 4 de MINAM.",
    "¿Tiene convenios con proveedores locales ya identificados en Lima Norte?"
  ],
  "created_at": "2026-05-22T10:30:00Z"
}
```

---

### `GET /onboarding/profiles/{profile_id}`
**Auth:** inversor (propio perfil) · operador_zeep · admin | **Spec:** spec03

Retorna el perfil completo del inversor.

**Response `200`:**
```json
{
  "profile_id": "660e8400-e29b-41d4-a716-446655440001",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "sector": "manufactura",
  "estado": "en_progreso",
  "empresa": { "...": "..." },
  "proyecto": { "...": "..." },
  "perfil_tecnico": { "...": "..." },
  "documentos": [],
  "roadmap": [ "...fases..." ],
  "v_final": 84.5,
  "created_at": "2026-05-22T10:30:00Z",
  "updated_at": "2026-05-22T11:00:00Z"
}
```

**Errores:**
| Status | Descripción |
|---|---|
| 403 | El perfil pertenece a otro usuario |
| 404 | Perfil no encontrado |

---

### `PATCH /onboarding/profiles/{profile_id}`
**Auth:** inversor (propio perfil) | **Spec:** spec03

Actualiza campos del perfil. Solo se envían los campos a modificar.

**Request:**
```json
{
  "proyecto": {
    "descripcion_breve": "Descripción actualizada."
  },
  "perfil_tecnico": {
    "requiere_anexo_4": true
  }
}
```

**Response `200`:** perfil actualizado (mismo schema que GET).

---

### `POST /onboarding/profiles/{profile_id}/documents`
**Auth:** inversor | **Spec:** spec03

Adjunta un documento al perfil. Multipart form-data.

**Request:** `multipart/form-data`

| Campo | Tipo | Notas |
|---|---|---|
| `file` | file | PDF; máx 10 MB |
| `tipo_documento` | string | `carta_intencion` \| `evaluacion_ambiental` \| `certificacion_tecnica` \| `registro_empresa_origen` \| `plan_idi` \| `otro` |
| `descripcion` | string | Opcional; descripción libre |

**Response `201`:**
```json
{
  "documento_id": "770e8400-e29b-41d4-a716-446655440002",
  "tipo_documento": "carta_intencion",
  "filename": "carta_cosco_2026.pdf",
  "url": "https://storage.comex.ai/docs/770e8400.pdf",
  "uploaded_at": "2026-05-22T11:30:00Z"
}
```

**Errores:**
| Status | Descripción |
|---|---|
| 413 | Archivo excede 10 MB |
| 415 | Formato no soportado (solo PDF) |

---

### `GET /onboarding/profiles/{profile_id}/roadmap`
**Auth:** inversor (propio perfil) · operador_zeep | **Spec:** spec03

Retorna el roadmap detallado con hitos y estado de documentos pendientes.

**Response `200`:**
```json
{
  "profile_id": "660e8400-e29b-41d4-a716-446655440001",
  "fases": [
    {
      "fase": "elegibilidad",
      "estado": "completado",
      "dias_estimados": 0,
      "completado_at": "2026-05-22T10:30:00Z",
      "hitos": ["Simulación GANCHO completada", "Perfil creado"]
    },
    {
      "fase": "validacion_legal",
      "estado": "en_progreso",
      "dias_estimados": 5,
      "hitos_pendientes": ["Validación CIP", "Revisión Agente Legal"]
    }
  ],
  "dias_totales_estimados": 15,
  "documentos_pendientes": ["evaluacion_ambiental"]
}
```

---

## 4. MATCHMAKING — Directorio y Match Institucional <a name="matchmaking"></a>

### `POST /marketplace/matches`
**Auth:** inversor | **Spec:** spec04

Dispara el proceso de matchmaking para un InvestorProfile. Retorna el MatchResult con Top 5 por categoría.

**Request:**
```json
{
  "investor_profile_id": "660e8400-e29b-41d4-a716-446655440001",
  "categorias": ["ingeniero_cip", "abogado_cal", "proveedor_local"]
}
```

| Campo | Tipo | Notas |
|---|---|---|
| `investor_profile_id` | UUID | Perfil del inversor (debe estar en estado `en_progreso` o `completado`) |
| `categorias` | array | Subconjunto de categorías a buscar; default: todas las tres |

**Response `200`:**
```json
{
  "match_id": "880e8400-e29b-41d4-a716-446655440003",
  "investor_profile_id": "660e8400-e29b-41d4-a716-446655440001",
  "resultados": [
    {
      "categoria": "ingeniero_cip",
      "score_promedio": 0.83,
      "justificacion_agente": "Se priorizaron ingenieros con experiencia en manufactura pesada y disponibilidad en Lima Norte.",
      "candidatos": [
        {
          "candidato_id": "990e8400-e29b-41d4-a716-446655440004",
          "nombre": "Ing. Carlos Ramírez Torres",
          "numero_cip": "CIP-058423",
          "score_compatibilidad": 0.91,
          "especialidad_principal": "Ingeniería Mecánica Industrial",
          "disponibilidad": "disponible",
          "idiomas": ["es", "en"],
          "validacion_institucional": "vigente",
          "justificacion": "Experiencia directa en líneas de manufactura pesada y zonas francas. Disponibilidad inmediata."
        }
      ]
    },
    {
      "categoria": "abogado_cal",
      "score_promedio": 0.78,
      "justificacion_agente": "...",
      "candidatos": [ "..." ]
    },
    {
      "categoria": "proveedor_local",
      "score_promedio": 0.75,
      "justificacion_agente": "...",
      "candidatos": [ "..." ]
    }
  ],
  "created_at": "2026-05-22T11:00:00Z"
}
```

**Errores:**
| Status | Descripción |
|---|---|
| 404 | InvestorProfile no encontrado |
| 422 | Perfil en estado `archivado` no puede generar matches |

---

### `GET /marketplace/matches/{match_id}`
**Auth:** inversor · operador_zeep | **Spec:** spec04

Recupera un MatchResult existente.

**Response `200`:** mismo schema que `POST /marketplace/matches` response.

---

### `POST /marketplace/matches/{match_id}/reuniones`
**Auth:** inversor | **Spec:** spec04

Solicita una reunión con uno o más candidatos del match.

**Request:**
```json
{
  "candidato_id": "990e8400-e29b-41d4-a716-446655440004",
  "categoria": "ingeniero_cip",
  "modalidad": "virtual",
  "fecha_preferida": "2026-05-28T14:00:00-05:00",
  "agenda": "Revisar requerimientos técnicos de la planta y alcance del proyecto."
}
```

**Response `201`:**
```json
{
  "reunion_id": "aa0e8400-e29b-41d4-a716-446655440005",
  "estado": "pendiente",
  "candidato_id": "990e8400-e29b-41d4-a716-446655440004",
  "modalidad": "virtual",
  "fecha_propuesta": "2026-05-28T14:00:00-05:00",
  "ledger_event_id": "bb0e8400-e29b-41d4-a716-446655440006",
  "mensaje": "Reunión solicitada. El candidato recibirá notificación por email."
}
```

---

### `GET /marketplace/directory/engineers`
**Auth:** inversor · operador_zeep | **Spec:** spec04

Busca ingenieros CIP habilitados. Filtros opcionales vía query params.

**Query Params:**
| Param | Tipo | Descripción |
|---|---|---|
| `especialidad` | string | Especialidad CIP (e.g., "mecanica", "civil", "sistemas") |
| `idioma` | string | Código de idioma (`es`, `en`, `zh`) |
| `disponibilidad` | string | `disponible` \| `parcial` \| `ocupado` |
| `region` | string | Región geográfica (`lima`, `chancay`, `nacional`) |
| `page` | integer | Default: 1 |
| `size` | integer | Default: 20 |

**Response `200`:** (paginado)
```json
{
  "items": [
    {
      "id": "990e8400-e29b-41d4-a716-446655440004",
      "nombre": "Ing. Carlos Ramírez Torres",
      "numero_cip": "CIP-058423",
      "especialidades": ["Ingeniería Mecánica Industrial", "Zonas Económicas"],
      "disponibilidad": "disponible",
      "idiomas": ["es", "en"],
      "habilitacion_vigente": true,
      "rating_promedio": 4.8,
      "foto_url": "https://storage.comex.ai/fotos/cip-058423.jpg"
    }
  ],
  "total": 45,
  "page": 1,
  "size": 20,
  "pages": 3
}
```

---

### `GET /marketplace/directory/lawyers`
**Auth:** inversor · operador_zeep | **Spec:** spec04

Busca abogados CAL especializados. Misma estructura de paginación que `/directory/engineers`.

**Query Params:**
| Param | Tipo | Descripción |
|---|---|---|
| `especializacion` | string | e.g., `zeep`, `comercio_exterior`, `propiedad_intelectual` |
| `certificacion_zeep` | boolean | Solo abogados con certificación Ley 32449 activa |
| `idioma` | string | Código de idioma |
| `page` / `size` | integer | Paginación |

**Response `200`:** (paginado)
```json
{
  "items": [
    {
      "id": "cc0e8400-e29b-41d4-a716-446655440007",
      "nombre": "Dra. Ana Huapaya Flores",
      "numero_cal": "CAL-12847",
      "especializaciones": ["Ley ZEEP N° 32449", "Comercio Exterior", "Contratos"],
      "certificacion_zeep": true,
      "idiomas": ["es", "en", "zh"],
      "habilitacion_vigente": true,
      "rating_promedio": 4.9
    }
  ],
  "total": 18,
  "page": 1,
  "size": 20,
  "pages": 1
}
```

---

### `GET /marketplace/directory/providers`
**Auth:** inversor · operador_zeep | **Spec:** spec01 + spec04

Busca proveedores locales validados en SUNARP.

**Query Params:**
| Param | Tipo | Descripción |
|---|---|---|
| `sector` | string | Sector interno: `manufactura` \| `ckd` \| `tech` \| `logistica` \| `otros` |
| `distancia_max_km` | number | Distancia máxima al Puerto de Chancay en km |
| `trust_score_min` | number | [0, 1] — score mínimo de confiabilidad SUNARP |
| `solo_habido` | boolean | Filtrar solo condición HABIDO (default: true) |
| `page` / `size` | integer | Paginación |

**Response `200`:** (paginado)
```json
{
  "items": [
    {
      "ruc": "20512345678",
      "razon_social": "Transportes Lima Norte SAC",
      "sector_interno": "logistica",
      "estado_sunarp": "ACTIVA",
      "condicion_contribuyente": "HABIDO",
      "trust_score": 0.88,
      "capacidad_operativa": "alta",
      "distancia_puerto_chancay_km": 28.5,
      "tiene_cargas": false,
      "marketplace_visible": true
    }
  ],
  "total": 312,
  "page": 1,
  "size": 20,
  "pages": 16
}
```

---

## 5. LEDGER — Trazabilidad e Inmutabilidad <a name="ledger"></a>

### `POST /ledger/events`
**Auth:** admin (uso interno por módulos vía service layer) | **Spec:** spec05

Registra un nuevo evento en el Ledger. Solo llamado internamente por los módulos de la plataforma, nunca por el cliente.

**Request:**
```json
{
  "investor_profile_id": "660e8400-e29b-41d4-a716-446655440001",
  "event_type": "MATCH_GENERADO",
  "actor_id": "550e8400-e29b-41d4-a716-446655440000",
  "actor_type": "inversor",
  "payload": {
    "match_id": "880e8400-e29b-41d4-a716-446655440003",
    "categoria": "ingeniero_cip",
    "candidatos_count": 5
  }
}
```

**Response `201`:**
```json
{
  "event_id": "dd0e8400-e29b-41d4-a716-446655440008",
  "sequence_number": 4,
  "event_hash": "sha256:a3f4b2c1d9e8...",
  "previous_hash": "sha256:9f8e7d6c5b4a...",
  "created_at": "2026-05-22T11:05:00Z"
}
```

**Errores:**
| Status | Descripción |
|---|---|
| 422 | `event_type` no reconocido |
| 404 | `investor_profile_id` no existe |

---

### `GET /ledger/{profile_id}`
**Auth:** inversor (propio perfil) · operador_zeep · admin | **Spec:** spec05

Timeline completo de eventos del proceso de inversión.

**Query Params:**
| Param | Tipo | Descripción |
|---|---|---|
| `event_type` | string | Filtrar por tipo de evento |
| `from_date` | date | Eventos desde esta fecha (ISO 8601) |
| `to_date` | date | Eventos hasta esta fecha |

**Response `200`:**
```json
{
  "investor_profile_id": "660e8400-e29b-41d4-a716-446655440001",
  "total_events": 7,
  "fase_actual": "validacion_legal",
  "events": [
    {
      "event_id": "ee0e8400-e29b-41d4-a716-446655440009",
      "sequence_number": 1,
      "event_type": "PERFIL_CREADO",
      "actor_type": "inversor",
      "payload": { "sector": "manufactura", "v_final": 84.5 },
      "event_hash": "sha256:1a2b3c4d5e6f...",
      "created_at": "2026-05-22T10:30:00Z"
    },
    "..."
  ]
}
```

---

### `GET /ledger/{profile_id}/verify`
**Auth:** public | **Spec:** spec05

Verifica la integridad de la cadena de hashes. Endpoint público para auditoría institucional.

**Response `200`:**
```json
{
  "investor_profile_id": "660e8400-e29b-41d4-a716-446655440001",
  "valid": true,
  "events_verified": 7,
  "tampered_at": null,
  "verified_at": "2026-05-22T12:00:00Z"
}
```

Si hay manipulación:
```json
{
  "valid": false,
  "events_verified": 3,
  "tampered_at": 4,
  "detail": "Hash inconsistente en sequence_number=4"
}
```

---

### `POST /ledger/minutas`
**Auth:** operador_zeep · admin | **Spec:** spec05

Registra la minuta de una reunión completada.

**Request:**
```json
{
  "investor_profile_id": "660e8400-e29b-41d4-a716-446655440001",
  "reunion_id": "aa0e8400-e29b-41d4-a716-446655440005",
  "acuerdos": [
    "Ingeniero Ramírez liderará el estudio de factibilidad técnica.",
    "Enviar planos preliminares antes del 01/06/2026."
  ],
  "proximos_pasos": [
    "Segunda reunión con abogado CAL el 05/06/2026.",
    "Presentar plan de I+D+i al Operador ZEEP."
  ],
  "documentos_comprometidos": ["plan_idi", "evaluacion_ambiental"],
  "participantes": ["Li Wei", "Ing. Ramírez Torres"]
}
```

**Response `201`:**
```json
{
  "ledger_event_id": "ff0e8400-e29b-41d4-a716-446655440010",
  "sequence_number": 5,
  "event_type": "MINUTA_REGISTRADA",
  "event_hash": "sha256:2b3c4d5e6f7a...",
  "created_at": "2026-05-22T14:00:00Z"
}
```

---

### `GET /ledger/{profile_id}/dossier`
**Auth:** inversor (propio perfil) · operador_zeep | **Spec:** spec05

Obtiene el Dossier de Inversión. Si no existe y el contrato está firmado, lo genera (puede tardar hasta 30 segundos).

**Query Params:**
| Param | Tipo | Descripción |
|---|---|---|
| `format` | string | `json` (default) \| `pdf` (URL de descarga) |

**Response `200` (format=json):**
```json
{
  "dossier_id": "110e8400-e29b-41d4-a716-446655440011",
  "investor_profile_id": "660e8400-e29b-41d4-a716-446655440001",
  "estado": "aprobado_operador",
  "resumen_ejecutivo": "COSCO Shipping Industries Co. ha completado el proceso de instalación en la ZEEP de Chancay con una inversión de USD 5M en el sector manufactura...",
  "pdf_url": "https://storage.comex.ai/dossiers/660e8400.pdf",
  "integridad_hash": "sha256:3c4d5e6f7a8b...",
  "generado_at": "2026-05-22T16:00:00Z"
}
```

**Errores:**
| Status | Descripción |
|---|---|
| 404 | Dossier no generado (contrato no firmado aún) |
| 202 | Dossier en generación (retry en 30 segundos) |

---

### `GET /ledger/stats`
**Auth:** operador_zeep · admin | **Spec:** spec05

Estadísticas globales del Ledger (uso interno administrativo).

**Response `200`:**
```json
{
  "total_profiles": 87,
  "perfiles_por_fase": {
    "elegibilidad": 12,
    "validacion_legal": 34,
    "contratacion": 28,
    "operacion": 13
  },
  "contratos_firmados": 13,
  "tiempo_promedio_a_contrato_dias": 3.8
}
```

---

## 6. LEGAL AI — Agente RAG <a name="legal-ai"></a>

### `POST /ai/query`
**Auth:** inversor | **Spec:** spec06

Consulta al Agente Legal RAG. Soporta ES, EN y ZH.

**Request:**
```json
{
  "query": "¿Qué beneficios fiscales aplican a empresas de manufactura en la ZEEP de Chancay?",
  "investor_profile_id": "660e8400-e29b-41d4-a716-446655440001",
  "lang": "es",
  "session_id": "550e8400-session-ai-001"
}
```

| Campo | Tipo | Notas |
|---|---|---|
| `query` | string | Pregunta en lenguaje natural (ES/EN/ZH) |
| `investor_profile_id` | UUID | Opcional; permite personalizar la respuesta al contexto del inversor |
| `lang` | string | `es` \| `en` \| `zh` — idioma de respuesta |
| `session_id` | string | ID de la sesión de chat (para mantener contexto de historial) |

**Response `200`:**
```json
{
  "session_id": "550e8400-session-ai-001",
  "message_id": "220e8400-e29b-41d4-a716-446655440012",
  "respuesta": "Según el Artículo 18 de la Ley ZEEP N° 32449, las empresas del sector manufactura con al menos 30% de componentes locales (CL) gozan de exoneración del 100% del Impuesto a la Renta durante los primeros 5 años...",
  "confidence_score": 0.92,
  "requiere_visado_humano": false,
  "agentes_activados": ["legal", "financiero"],
  "sources": [
    {
      "norma": "Ley N° 32449 — Ley ZEEP Chancay",
      "articulo": "Artículo 18",
      "titulo_seccion": "Beneficios Tributarios al Sector Industrial",
      "fecha_vigencia": "2024-12-01",
      "derogado": false,
      "relevance_score": 0.95
    }
  ],
  "advertencias": [],
  "created_at": "2026-05-22T12:00:00Z"
}
```

Si `confidence_score < 0.70`:
```json
{
  "respuesta": "Esta consulta requiere revisión de un especialista CIP/CAL...",
  "confidence_score": 0.58,
  "requiere_visado_humano": true,
  "ticket_visado_id": "330e8400-e29b-41d4-a716-446655440013"
}
```

---

### `GET /ai/history`
**Auth:** inversor | **Spec:** spec06

Historial de consultas del usuario autenticado.

**Query Params:**
| Param | Tipo | Descripción |
|---|---|---|
| `session_id` | string | Filtrar por sesión de chat específica |
| `page` / `size` | integer | Paginación |

**Response `200`:** (paginado)
```json
{
  "items": [
    {
      "message_id": "220e8400-e29b-41d4-a716-446655440012",
      "role": "user",
      "content": "¿Qué beneficios fiscales...?",
      "created_at": "2026-05-22T12:00:00Z"
    },
    {
      "message_id": "221e8400-e29b-41d4-a716-446655440013",
      "role": "assistant",
      "content": "Según el Artículo 18...",
      "confidence_score": 0.92,
      "created_at": "2026-05-22T12:00:05Z"
    }
  ],
  "total": 24,
  "page": 1,
  "size": 20,
  "pages": 2
}
```

---

### `POST /ai/escalate`
**Auth:** inversor | **Spec:** spec06

Escala una consulta a revisión humana del comité CIP/CAL.

**Request:**
```json
{
  "message_id": "220e8400-e29b-41d4-a716-446655440012",
  "motivo": "La respuesta no cubre el caso específico de doble tributación con China."
}
```

**Response `201`:**
```json
{
  "ticket_id": "330e8400-e29b-41d4-a716-446655440013",
  "estado": "pendiente",
  "tiempo_estimado_respuesta_horas": 24,
  "created_at": "2026-05-22T12:15:00Z"
}
```

---

### `POST /ai/ingest/url`
**Auth:** admin | **Spec:** spec06

Ingesta una URL normativa en ChromaDB.

**Request:**
```json
{
  "url": "https://www.elperuano.pe/normaselperuano/2024/12/01/ley-32449.pdf",
  "coleccion": "ley_zeep",
  "norma": "Ley N° 32449",
  "fecha_vigencia": "2024-12-01",
  "derogado": false
}
```

**Response `202`:**
```json
{
  "job_id": "440e8400-e29b-41d4-a716-446655440014",
  "estado": "en_proceso",
  "mensaje": "Ingesta iniciada. Los chunks estarán disponibles en ~2 minutos."
}
```

---

### `POST /ai/ingest/pdf`
**Auth:** admin | **Spec:** spec06

Ingesta un PDF normativo directamente en ChromaDB. Multipart form-data.

**Request:** `multipart/form-data`

| Campo | Tipo | Notas |
|---|---|---|
| `file` | file | PDF; máx 50 MB |
| `coleccion` | string | ChromaDB collection name |
| `norma` | string | Nombre oficial de la norma |
| `fecha_vigencia` | date | ISO 8601 |
| `derogado` | boolean | Default: false |

**Response `202`:** igual a `POST /ai/ingest/url`.

---

### `GET /ai/knowledge/stats`
**Auth:** admin | **Spec:** spec06

Estado de las colecciones de ChromaDB.

**Response `200`:**
```json
{
  "colecciones": [
    {
      "nombre": "ley_zeep",
      "chunks": 1842,
      "ultimo_ingesto": "2026-05-20T03:00:00Z",
      "normas": ["Ley N° 32449", "DS 002-2025-MINCETUR"]
    },
    {
      "nombre": "normas_laborales",
      "chunks": 3210,
      "ultimo_ingesto": "2026-05-18T03:00:00Z",
      "normas": ["Decreto Legislativo 728", "Ley 31110"]
    }
  ],
  "total_chunks": 71248,
  "tamano_estimado_mb": 434
}
```

---

## 7. ETL PADRONRUC — Ingesta SUNAT <a name="etl-padronruc"></a>

### `POST /analytics/padron/ingest`
**Auth:** admin | **Spec:** spec07

Dispara manualmente el pipeline ETL del PadronRUC. El cron mensual lo ejecuta automáticamente el día 5 a las 02:00 UTC.

**Request:**
```json
{
  "filepath": "/data/padronruc/padron_ruc_2026_05.txt",
  "force": false
}
```

| Campo | Tipo | Notas |
|---|---|---|
| `filepath` | string | Ruta del archivo TXT en el servidor |
| `force` | boolean | `true` re-ejecuta aunque el hash sea igual al anterior |

**Response `202`:**
```json
{
  "job_id": "550e8400-etl-padron-001",
  "estado": "en_proceso",
  "mensaje": "ETL iniciado. El proceso tarda ~45 minutos para 10M registros."
}
```

---

### `GET /analytics/padron/status`
**Auth:** admin | **Spec:** spec07

Estado de la última ejecución del ETL PadronRUC.

**Response `200`:**
```json
{
  "ultima_ejecucion": {
    "estado": "completado",
    "archivo": "padron_ruc_2026_05.txt",
    "descarga_fecha": "2026-05-05",
    "total_staging": 10247832,
    "total_insertados": 38712,
    "total_actualizados": 142089,
    "total_rechazados": 1203,
    "duracion_segundos": 2718,
    "iniciado_at": "2026-05-05T02:00:00Z",
    "completado_at": "2026-05-05T02:45:18Z"
  },
  "proxima_ejecucion_estimada": "2026-06-05T02:00:00Z"
}
```

---

## 8. ZEEP INGESTION — SUNARP Driver <a name="zeep-ingestion"></a>

### `GET /ingestion/companies/{ruc}`
**Auth:** inversor · operador_zeep · admin | **Spec:** spec01

Consulta una empresa por RUC. Usa caché de 24h; re-scraping automático si datos están desactualizados.

**Path Params:**
| Param | Tipo | Notas |
|---|---|---|
| `ruc` | string | RUC de 11 dígitos numéricos |

**Response `200`:**
```json
{
  "ruc": "20512345678",
  "razon_social": "Transportes Lima Norte SAC",
  "tipo_persona": "JURIDICA",
  "estado_sunarp": "ACTIVA",
  "condicion_contribuyente": "HABIDO",
  "fecha_inscripcion": "2010-03-15",
  "capital_social_soles": 250000.00,
  "domicilio_fiscal": "Av. Néstor Gambetta 1234, Callao",
  "ubigeo": "070101",
  "distancia_puerto_chancay_km": 28.5,
  "trust_score": 0.88,
  "capacidad_operativa": "alta",
  "sector_interno": "logistica",
  "tiene_cargas": false,
  "cargas_resumen": "Sin cargas registrales",
  "tiene_procedimiento_concursal": false,
  "directorio_activo": [
    { "nombre": "Juan Pérez García", "cargo": "Gerente General", "dni": "08765432" }
  ],
  "poderes_vigentes": true,
  "ciiu_principal": "4923",
  "validacion_timestamp": "2026-05-22T08:00:00Z",
  "fuente_principal": "sunarp_scraping",
  "last_sunarp_check": "2026-05-22T08:00:00Z"
}
```

**Errores:**
| Status | Descripción |
|---|---|
| 400 | RUC con formato inválido (≠ 11 dígitos) |
| 404 | RUC no encontrado en SUNARP ni en BD local |
| 503 | Portal SUNARP temporalmente inaccesible |

---

### `GET /ingestion/companies/search`
**Auth:** inversor · operador_zeep | **Spec:** spec01

Búsqueda full-text de empresas por razón social.

**Query Params:**
| Param | Tipo | Requerido | Descripción |
|---|---|---|---|
| `q` | string | ✓ | Término de búsqueda (mín. 3 caracteres) |
| `sector` | string | — | Filtrar por sector interno |
| `solo_activas` | boolean | — | Default: true |
| `page` / `size` | integer | — | Paginación |

**Response `200`:** (paginado, mismo schema de ítem que `GET /ingestion/companies/{ruc}`)

---

### `POST /ingestion/companies/validate-batch`
**Auth:** inversor · operador_zeep | **Spec:** spec01

Valida el estado registral de hasta 20 RUCs.

**Request:**
```json
{
  "rucs": ["20512345678", "20654321098", "10987654321"]
}
```

**Response `200`:**
```json
{
  "resultados": [
    {
      "ruc": "20512345678",
      "is_active": true,
      "is_habido": true,
      "has_legal_issues": false,
      "summary": "Empresa activa y habida, sin cargas registrales.",
      "checked_at": "2026-05-22T12:00:00Z"
    },
    {
      "ruc": "20654321098",
      "is_active": false,
      "is_habido": false,
      "has_legal_issues": true,
      "summary": "Empresa en estado BAJA con procedimiento concursal activo.",
      "checked_at": "2026-05-22T12:00:01Z"
    }
  ],
  "total": 3,
  "procesados": 3,
  "errores": 0
}
```

**Errores:**
| Status | Descripción |
|---|---|
| 422 | Lista excede 20 RUCs |
| 422 | RUC con formato inválido en la lista |

---

### `GET /ingestion/persons/{dni}`
**Auth:** operador_zeep · admin | **Spec:** spec01

Consulta persona natural por DNI. Usado para validar representantes legales de empresas inversoras.

**Response `200`:**
```json
{
  "dni": "08765432",
  "nombre_completo": "Juan Alberto Pérez García",
  "estado_civil": "casado",
  "tiene_partida_registral": true,
  "poderes_vigentes": true,
  "ultima_vigencia_poderes": "2028-12-31",
  "validacion_timestamp": "2026-05-22T12:00:00Z"
}
```

---

### `POST /ingestion/sync/bulk`
**Auth:** admin | **Spec:** spec01

Carga masiva de datos históricos SUNARP (CSV/JSON/PDF).

**Request:** `multipart/form-data`

| Campo | Tipo | Notas |
|---|---|---|
| `file` | file | CSV, JSON o PDF; máx 500 MB |
| `source` | string | `sunarp_historico` \| `gestion_2025` \| `otro` |

**Response `202`:**
```json
{
  "job_id": "660e8400-sync-bulk-001",
  "estado": "en_proceso",
  "formato_detectado": "csv",
  "mensaje": "Carga iniciada. Los datos estarán disponibles en ~10 minutos."
}
```

---

### `POST /ingestion/sync/padron-ruc`
**Auth:** admin | **Spec:** spec01

Trigger manual del ETL del PadronRUC desde el módulo SUNARP driver. Delegado a spec07.

**Request:**
```json
{ "filepath": "/data/padronruc/padron_ruc_2026_05.txt" }
```

**Response `202`:**
```json
{
  "job_id": "770e8400-sync-padron-001",
  "estado": "en_proceso",
  "mensaje": "ETL PadronRUC iniciado."
}
```

---

### `GET /ingestion/sync/status`
**Auth:** admin | **Spec:** spec01

Estado de la última sincronización del driver SUNARP.

**Response `200`:**
```json
{
  "ultima_sync": {
    "tipo_sync": "bulk_historico",
    "estado": "completado",
    "registros_procesados": 245830,
    "errores": 12,
    "iniciado_at": "2026-05-20T03:00:00Z",
    "completado_at": "2026-05-20T03:12:45Z"
  },
  "companies_en_bd": 245818,
  "companies_con_trust_score": 198043,
  "last_padron_sync": "2026-05-05"
}
```

---

## Resumen de Endpoints

| Módulo | Método | Endpoint | Auth |
|---|---|---|---|
| **IDENTITY** | POST | `/auth/register/company` | public |
| | POST | `/auth/verify-email` | public |
| | POST | `/auth/resend-otp` | public |
| | POST | `/auth/login` | public |
| | POST | `/auth/refresh` | public |
| | POST | `/auth/logout` | inversor |
| | GET | `/auth/me` | inversor |
| **SIMULATION** | POST | `/simulation/calculate` | public |
| | GET | `/simulation/{session_id}` | public |
| **ONBOARDING** | POST | `/onboarding/profiles` | inversor |
| | GET | `/onboarding/profiles/{profile_id}` | inversor |
| | PATCH | `/onboarding/profiles/{profile_id}` | inversor |
| | POST | `/onboarding/profiles/{profile_id}/documents` | inversor |
| | GET | `/onboarding/profiles/{profile_id}/roadmap` | inversor |
| **MATCHMAKING** | POST | `/marketplace/matches` | inversor |
| | GET | `/marketplace/matches/{match_id}` | inversor |
| | POST | `/marketplace/matches/{match_id}/reuniones` | inversor |
| | GET | `/marketplace/directory/engineers` | inversor |
| | GET | `/marketplace/directory/lawyers` | inversor |
| | GET | `/marketplace/directory/providers` | inversor |
| **LEDGER** | POST | `/ledger/events` | admin |
| | GET | `/ledger/{profile_id}` | inversor |
| | GET | `/ledger/{profile_id}/verify` | public |
| | POST | `/ledger/minutas` | operador_zeep |
| | GET | `/ledger/{profile_id}/dossier` | inversor |
| | GET | `/ledger/stats` | operador_zeep |
| **LEGAL AI** | POST | `/ai/query` | inversor |
| | GET | `/ai/history` | inversor |
| | POST | `/ai/escalate` | inversor |
| | POST | `/ai/ingest/url` | admin |
| | POST | `/ai/ingest/pdf` | admin |
| | GET | `/ai/knowledge/stats` | admin |
| **ETL PADRONRUC** | POST | `/analytics/padron/ingest` | admin |
| | GET | `/analytics/padron/status` | admin |
| **ZEEP INGESTION** | GET | `/ingestion/companies/{ruc}` | inversor |
| | GET | `/ingestion/companies/search` | inversor |
| | POST | `/ingestion/companies/validate-batch` | inversor |
| | GET | `/ingestion/persons/{dni}` | operador_zeep |
| | POST | `/ingestion/sync/bulk` | admin |
| | POST | `/ingestion/sync/padron-ruc` | admin |
| | GET | `/ingestion/sync/status` | admin |

**Total: 37 endpoints** — 8 públicos, 18 nivel inversor, 4 nivel operador_zeep, 7 nivel admin.
