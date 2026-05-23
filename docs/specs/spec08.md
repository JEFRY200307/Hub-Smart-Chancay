# spec08 — EMAIL OTP: Verificación de Correo en Registro de Empresa Extranjera

**nombre del módulo:** identity (ampliación)  
**módulo backend:** `modules/identity/`  
**objetivo:** Verificar la identidad de una empresa extranjera mediante un código OTP de un solo uso enviado al email corporativo, antes de permitirle continuar con el flujo de onboarding (spec03).

---

## Descripción

El registro está orientado exclusivamente a **empresas extranjeras** que quieren invertir en la ZEEP de Chancay. El flujo recoge información básica de la empresa para confirmar su existencia, envía un código temporal de 6 dígitos (OTP) al correo corporativo declarado y solo permite avanzar al onboarding completo (spec03) una vez verificado el código. La información recopilada en este paso pre-carga el `InvestorProfile` (spec03).

---

## Flujo Paso a Paso

```
[PASO 1] Formulario de Registro (frontend)
  El usuario completa:
  ├─ nombre_empresa: str              # razón social de la empresa extranjera
  ├─ pais_origen: str                 # ISO 3166-1 alpha-2 (ej: "CN", "DE", "US")
  ├─ sector_interes: sector_type      # manufactura | ckd | tech
  ├─ email_corporativo: str           # email donde llegará el OTP
  └─ nombre_representante: str        # nombre del contacto que realiza el registro

[PASO 2] Validación y creación del usuario pendiente
  POST /api/v1/auth/register/company
  ├─ Validar formato email (RFC 5321)
  ├─ Verificar que email no exista en users con is_verified=true
  ├─ Si existe con is_verified=false → reenviar OTP (no crear duplicado)
  ├─ Crear user con is_verified=false, role='inversor'
  ├─ Crear email_verification_token: OTP de 6 dígitos, TTL=15 minutos
  └─ Guardar hash(OTP) en email_verification_tokens (no el OTP en claro)

[PASO 3] Envío del email con OTP
  └─ SendGrid / SMTP:
     Asunto: "Código de acceso COMEX.AI — [6 dígitos]"
     Cuerpo: saludo con nombre_representante + código OTP + aviso de expiración 15 min
     Idioma: detectado por pais_origen (CN→zh, PE/ES→es, resto→en)

[PASO 4] Verificación del código (frontend → backend)
  POST /api/v1/auth/verify-email
  ├─ Recibe: email + otp_code (6 dígitos ingresados por el usuario)
  ├─ Buscar email_verification_tokens donde email = ? AND expires_at > NOW()
  ├─ Comparar hash(otp_code) con token almacenado
  ├─ Si inválido → error 400, incrementar intentos fallidos (max 5)
  ├─ Si expirado → error 410, sugerir reenvío
  ├─ Si válido:
  │   ├─ users.is_verified = true
  │   ├─ email_verification_tokens → marcar usado (used_at = NOW())
  │   ├─ Emitir JWT de acceso y refresh token
  │   └─ Crear InvestorProfile en estado 'en_progreso' con datos del paso 1
  └─ Redirigir al onboarding completo (spec03)

[PASO 5] Reenvío de OTP (si expiró o no llegó)
  POST /api/v1/auth/resend-otp
  ├─ Cooldown: 60 segundos entre reenvíos (rate limiting por email)
  ├─ Invalidar token anterior (used_at = NOW())
  ├─ Generar nuevo OTP y reiniciar TTL de 15 minutos
  └─ Enviar email con nuevo código
```

---

## Entidades del Dominio

### `EmailVerificationToken`

```python
class EmailVerificationToken(SQLModel, table=True):
    __tablename__ = "email_verification_tokens"

    id              : UUID  = Field(default_factory=uuid4, primary_key=True)
    user_id         : UUID  = Field(foreign_key="users.id", nullable=False)
    token_hash      : str           # bcrypt hash del OTP de 6 dígitos
    expires_at      : datetime      # NOW() + 15 minutos
    intentos_fallidos: int = 0      # máximo 5 intentos
    used_at         : datetime | None = None
    created_at      : datetime = Field(default_factory=datetime.utcnow)
```

### `CompanyRegistrationRequest` (DTO de entrada)

```python
@dataclass
class CompanyRegistrationRequest:
    nombre_empresa      : str          # razón social
    pais_origen         : str          # ISO 3166-1 alpha-2
    sector_interes      : SectorType   # manufactura | ckd | tech
    email_corporativo   : str          # email único en el sistema
    nombre_representante: str
```

### `OTPVerificationRequest` (DTO de entrada)

```python
@dataclass
class OTPVerificationRequest:
    email    : str
    otp_code : str          # 6 dígitos ingresados por el usuario
```

---

## Tabla PostgreSQL

```sql
CREATE TABLE email_verification_tokens (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash          TEXT NOT NULL,          -- bcrypt del OTP, nunca el OTP en claro
    expires_at          TIMESTAMPTZ NOT NULL,   -- NOW() + 15 minutos
    intentos_fallidos   SMALLINT NOT NULL DEFAULT 0,
    used_at             TIMESTAMPTZ,            -- NULL = token activo
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_evtoken_user ON email_verification_tokens(user_id);
CREATE INDEX idx_evtoken_activo ON email_verification_tokens(user_id)
    WHERE used_at IS NULL;
```

---

## Casos de Uso

### `register_company(request: CompanyRegistrationRequest) -> RegisterResult`

1. Valida formato email
2. Busca si el email ya existe:
   - `is_verified=true` → error: "Ya existe una cuenta con este email"
   - `is_verified=false` → reenvía OTP al usuario existente
3. Crea `User` con `is_verified=false`, `role='inversor'`
4. Genera OTP: `secrets.randbelow(1_000_000)` formateado a 6 dígitos
5. Almacena `bcrypt.hash(otp)` en `email_verification_tokens`
6. Envía email via SendGrid/SMTP

```python
@dataclass
class RegisterResult:
    user_id     : UUID
    email       : str
    otp_enviado : bool
    mensaje     : str       # "Revisa tu correo corporativo"
```

### `verify_otp(request: OTPVerificationRequest) -> AuthTokens`

1. Busca `email_verification_tokens` activo para el email
2. Verifica `bcrypt.check(otp_code, token_hash)`
3. Si válido: `users.is_verified = true`, crea `InvestorProfile` con datos pre-cargados
4. Emite JWT + refresh token
5. Retorna `AuthTokens`

### `resend_otp(email: str) -> ResendResult`

1. Verifica cooldown de 60 segundos desde `created_at` del token anterior
2. Marca el token anterior como usado
3. Genera y envía nuevo OTP

---

## API Endpoints

```
POST   /api/v1/auth/register/company    # Paso 2: crear usuario + enviar OTP
POST   /api/v1/auth/verify-email        # Paso 4: verificar código OTP
POST   /api/v1/auth/resend-otp          # Paso 5: reenviar código
```

---

## Seguridad

| Medida | Implementación |
|---|---|
| OTP nunca en claro | Se almacena solo el `bcrypt.hash(otp)` en BD |
| TTL corto | 15 minutos; expirado → 410 Gone |
| Rate limiting | Max 5 intentos por token; cooldown 60s para reenvío |
| Anti-enumeración | Mismo mensaje de error si email no existe o código inválido |
| HTTPS only | El OTP viaja solo por email y formulario HTTPS; nunca en URL |

---

## Integración con Otros Módulos

| Módulo | Punto de integración |
|---|---|
| IDENTITY (spec base) | Comparte tabla `users`; amplía con `email_verification_tokens` |
| ONBOARDING (spec03) | Al verificar OTP exitosamente → `InvestorProfile` creado en `en_progreso` con datos del registro |
| LEDGER (spec05) | Evento `PERFIL_CREADO` emitido tras verificación exitosa |

---

## Tests

- `test_register_company_crea_user_no_verificado`: POST register → user.is_verified=false
- `test_register_company_envia_otp`: POST register → email_verification_tokens tiene 1 registro activo
- `test_register_email_duplicado_verificado`: email ya verificado → error 409 con mensaje claro
- `test_register_email_duplicado_no_verificado`: email existente sin verificar → reenvía OTP, no crea duplicado
- `test_verify_otp_correcto`: OTP correcto → user.is_verified=true, InvestorProfile creado, JWT emitido
- `test_verify_otp_incorrecto`: OTP incorrecto → error 400, intentos_fallidos incrementado
- `test_verify_otp_expirado`: OTP con expires_at en el pasado → error 410
- `test_verify_otp_max_intentos`: 5 intentos fallidos → token bloqueado aunque código sea correcto
- `test_resend_otp_cooldown`: reenvío antes de 60s → error 429 con segundos restantes
- `test_resend_otp_invalida_anterior`: reenvío exitoso → token anterior marcado como used_at
- `test_verify_otp_pre_carga_investor_profile`: tras verificación → InvestorProfile.empresa_nombre = nombre_empresa del registro
