# Sovereign Gateway: User Flows & Product Experience

Este documento detalla la experiencia del usuario (UX) centrada en el valor inmediato y el acompañamiento a largo plazo, para los actores clave del **Smart Hub Chancay**.

---

## 1. Flujo de Enganche (El "WOW" Moment)

El objetivo de este flujo es la **reducción radical de fricción**. El usuario debe pasar de la incertidumbre regulatoria a una oportunidad tangible en menos de 2 minutos.

### Actor Principal: Inversionista Extranjero / Empresa Logística Tier 1

*   **¿Cómo llega el usuario?**
    *   Llega a la `vista-general-oportunidades` a través de campañas gubernamentales, búsqueda de "Incentivos Chancay ZEEP" o referidos por el MINCETUR.
    *   **Estado:** Sin loguear. Alta expectativa, pero con dudas sobre la burocracia local.

*   **¿Qué información ingresa?**
    *   No se le pide un registro extenso inicial.
    *   El usuario interactúa con la vista de **ZEEP Opportunities** e ingresa una consulta simple al *Service Finder* o a la demo pública del *AI Legal Assistant*: *"Quiero abrir un almacén de frío de 3000m2 en Chancay"*.

*   **¿Qué resultado obtiene?**
    *   El sistema, usando `pgvector` y el motor IA, no le da un PDF aburrido. Le devuelve un **análisis instantáneo en la pantalla**:
        1.  Incentivos fiscales que aplican (ej. "0% IGV").
        2.  Leyes citadas exactamente.
        3.  **3 empresas locales verificadas** (vista `EmpresaExtranjera-ListaOperadores`) que pueden construir su almacén mañana mismo.

*   **El Momento "WOW" (Esto me sirve):**
    *   El usuario dice "WOW" cuando se da cuenta de que la plataforma no es un portal informativo más del Estado, sino un **Matchmaker predictivo**. El momento exacto es cuando el sistema le muestra el botón *"Initiate Connection"* con el proveedor Pyme local que hace "Match" con un 98% de compatibilidad, validado por MINCETUR.

---

## 2. Flujo de Acompañamiento (RETENCIÓN)

El enganche trae al usuario, pero la retención de operadores locales y extranjeros asegura que las transacciones y contratos se lleven a cabo dentro del ecosistema Chancay.

### Actor Principal: Operador Local Certificado (Pyme Peruana) y el Extranjero

*   **¿Qué pasa después del primer resultado?**
    *   El usuario decide registrarse (`vista-Login`) como empresa oficial para contactar al proveedor.
    *   Al entrar al Dashboard, se encuentra con el **Match Feed** (`vista-empresasLocales-match`).

*   **¿Cómo el sistema guía al usuario?**
    *   **Para el Local:** Recibe alertas tipo "Tinder Logístico". *"Una naviera alemana acaba de buscar transporte de carga pesada. Tienes un 85% de Match"*.
    *   **Para el Extranjero:** El sistema lo lleva de la mano mediante el **Legal AI Assistant** (`vista-operador-legalAI`), paso a paso para formar su consorcio o tramitar su licencia.

*   **¿Qué siguientes pasos propone?**
    *   Propone "Micro-acciones":
        *   *"Completa tu certificación de seguridad para aumentar tu visibilidad un 15%".*
        *   *"Inicia un draft de NDA (Non-Disclosure Agreement) generado por IA con este partner".*

*   **¿Cómo mantiene valor en el tiempo?**
    *   **Auditoría continua y reputación:** Los operadores locales compiten sanamente en el *Service Finder* (`vista-Empresa extranjera y operador-servicio`) por tener el sello "MINCETUR Platinum" o "Tier 1".
    *   **Cambios Regulatorios:** Usando RAG (Retrieval-Augmented Generation), el sistema alerta proactivamente si cambian los aranceles o la cuota laboral extranjera. Ya no necesitan consultores externos para la información base; la plataforma es su principal herramienta de trabajo diario.
