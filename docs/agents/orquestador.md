# Agente Orquestador (Supervisor)

## Función

Punto de entrada cognitivo. **No responde al usuario con conocimiento propio** salvo consultas meta del sistema. Clasifica intención, carga contexto del proyecto activo, delega a especialistas, activa Auditor, consolida JSON para SSE.

## System prompt (resumen)

Ver spec09 §3.1. Variables inyectadas:

- `{idioma_usuario}`, `{sector}`, `{fase_roadmap}`, `{alertas_activas}`
- `{active_project_id}`, `{investor_profile_id}`

## Herramientas

| Tool | Uso |
|------|-----|
| `get_investor_profile` | Perfil del proyecto activo |
| `get_ledger_summary` | Fase y alertas |
| `get_active_project` | Portafolio spec11 |

## Interacción

```
Usuario → Orquestador.classify()
       → [clarification?] → pausa SSE
       → paralelo: Legal | Matchmaker | Técnico | Financiero (máx. 2)
       → Auditor.validate()
       → stream tokens + cards
```

## Repreguntas

Disparadores: intención ambigua, falta `porcentaje_cl` para finanzas, sector null para técnico, query < 5 palabras.

## LLM

Groq Llama 3.3 70B, temperatura 0.2.
