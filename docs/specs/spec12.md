# spec12 — Dashboard institucional del inversor

**Rutas frontend:** `/[locale]/dashboard`, `/[locale]/dashboard/portfolio`  
**API:** agrega endpoints de resumen (sin nuevo módulo; compone onboarding, ledger, projects, simulation)  
**Audiencia:** Usuario con rol `inversor` (empresa extranjera o local en evaluación ZEEP).

---

## 1. ¿Para quién es el Dashboard?

| Rol | Vista principal |
|-----|-----------------|
| **inversor** | Panel de control de su expediente ZEEP: proyecto activo, score, fase ledger, accesos rápidos |
| profesional | *(futuro)* Sus solicitudes de reunión y visibilidad marketplace |
| operador_zeep | *(futuro)* Pipeline de inversores asignados |
| admin | *(futuro)* Métricas globales spec08 |

**MVP:** solo **inversor**. El enlace «Dashboard» del sidebar deja de devolver 404.

---

## 2. Layout del dashboard

```
┌─────────────────────────────────────────────────────────────┐
│ Bienvenido, {empresa}          [Selector proyecto activo ▼] │
├──────────────┬──────────────┬──────────────┬────────────────┤
│ Score ZEEP   │ Fase actual  │ Proyectos    │ Próximo paso   │
│ 0.87         │ Validación   │ 3 activos    │ Subir Anexo 4  │
│              │ legal 45%    │              │                │
├──────────────┴──────────────┴──────────────┴────────────────┤
│ Roadmap (4 fases) — barras de progreso                        │
├──────────────────────────────┬──────────────────────────────┤
│ Accesos rápidos              │ Actividad reciente (ledger)  │
│ • Simulación  • Onboarding   │ PERFIL_CREADO hace 2d        │
│ • Matchmaking • Legal AI     │ ...                          │
│ • Marketplace • Concierge    │                              │
└──────────────────────────────┴──────────────────────────────┘
```

---

## 3. API de resumen

`GET /api/v1/dashboard/summary` — JWT requerido.

```json
{
  "user": { "email": "...", "full_name": "..." },
  "active_project": {
    "id": "uuid",
    "nombre": "Proyecto Chancay Fase 1",
    "sector": "tech",
    "estado": "perfil_creado",
    "investor_profile_id": "uuid"
  },
  "portfolio_count": 3,
  "simulation": {
    "v_final": 0.87,
    "clasificacion": "elegible",
    "session_id": "uuid"
  },
  "ledger": {
    "fase_actual": "validacion_legal",
    "total_events": 12,
    "has_dossier": false
  },
  "roadmap": [
    { "fase": "elegibilidad", "estado": "completado" },
    { "fase": "validacion_legal", "estado": "en_progreso", "pct": 45 }
  ],
  "quick_actions": [
    { "label": "Ejecutar match", "href": "/dashboard/matchmaking" },
    { "label": "Consultar Legal AI", "href": "/legal-ai" }
  ]
}
```

Implementación: `DashboardService` en `modules/onboarding/application/` o nuevo `modules/dashboard/` (ligero).

---

## 4. Estados vacíos

| Condición | Mensaje / CTA |
|-----------|----------------|
| Sin proyectos | «Cree su primer proyecto ZEEP» → `/onboarding` |
| Sin simulación | «Calcule elegibilidad» → `/simulacion` |
| Sin perfil | «Complete onboarding» → `/onboarding` |

---

## 5. Relación con spec11

El selector de proyecto del dashboard llama `POST /api/v1/projects/{id}/activate` y actualiza `FLOW_KEYS` en el cliente (`investorProfileId`, `activeProjectId`).

---

## 6. Tests

- `test_dashboard_summary_sin_proyecto`
- `test_dashboard_summary_con_ledger_y_simulacion`
- `test_dashboard_403_no_inversor` (opcional v2)
