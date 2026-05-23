-- Cuenta demo: empresa extranjera (China) para probar asesor legal COMEX.AI
-- Ejecutar en Supabase SQL Editor DESPUÉS de init-db.sql (y opcionalmente seed_cip_cal_padron.sql)
--
-- Login:
--   Email:    extranjera.cn@comex-ai.test
--   Password: ComexExtranjera2025!
--
-- Perfil inversor (para legal-ai / matchmaking): ID fijo abajo

BEGIN;

-- IDs fijos para referencia en frontend (localStorage hub_investor_profile_id)
-- user:     a1111111-1111-4111-8111-111111111101
-- session:  b2222222-2222-4222-8222-222222222201
-- profile:  c3333333-3333-4333-8333-333333333301

DELETE FROM investor_profiles WHERE id = 'c3333333-3333-4333-8333-333333333301';
DELETE FROM simulation_records WHERE session_id = 'b2222222-2222-4222-8222-222222222201';
DELETE FROM users WHERE email = 'extranjera.cn@comex-ai.test';

INSERT INTO users (
  id, email, hashed_password, role, full_name, is_active, is_verified, preferred_lang
) VALUES (
  'a1111111-1111-4111-8111-111111111101',
  'extranjera.cn@comex-ai.test',
  '$2b$12$DNru0raows/F3HkRsap16eC/CmMfdq0ZumbnZZrNp/vwJdoT5PD1W',
  'inversor',
  'Li Wei Zhang — Shanghai Pacific Logistics Holdings',
  true,
  true,
  'zh'
) ON CONFLICT (email) DO UPDATE SET
  hashed_password = EXCLUDED.hashed_password,
  full_name = EXCLUDED.full_name,
  is_verified = true,
  is_active = true,
  preferred_lang = 'zh';

INSERT INTO simulation_records (
  id, session_id, user_id, sector, clasificacion,
  monto_inversion_usd, empleo_directo, empleo_indirecto, porcentaje_cl,
  tiempo_instalacion_meses, pais_origen, exportacion_pct, variables_sector,
  v_base, delta_cl, delta_sector, v_final, beneficio_cl_activo,
  proyeccion_fiscal, alertas, recomendaciones_agente
) VALUES (
  'd4444444-4444-4444-8444-444444444401',
  'b2222222-2222-4222-8222-222222222201',
  'a1111111-1111-4111-8111-111111111101',
  'manufactura',
  'viable_con_ajustes',
  12500000.00,
  280,
  150,
  42.00,
  18,
  'CN',
  55.00,
  '{"tipo_proceso": "continuo", "requiere_anexo_4": true}'::jsonb,
  0.7200,
  0.0800,
  0.0500,
  0.85,
  true,
  '{"ir_estandar_pct": 29.5, "ir_zeep_pct": 15.0, "ahorro_5_anos_usd": 2100000, "igv_exonerado": true, "arancel_0": true}'::jsonb,
  '[]'::jsonb,
  '["Reforzar contenido local al 45% para clasificación elegible plena", "Validar cadena de suministro CKD con agente legal"]'::jsonb
) ON CONFLICT (session_id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  clasificacion = EXCLUDED.clasificacion,
  v_final = EXCLUDED.v_final;

INSERT INTO investor_profiles (
  id, session_id, user_id, estado,
  empresa_razon_social, empresa_pais_origen, empresa_registro_extranjero,
  rep_nombre, rep_cargo,
  proyecto_nombre, proyecto_descripcion, proyecto_monto_usd,
  proyecto_empleo_directo, proyecto_empleo_indirecto, proyecto_porcentaje_cl,
  proyecto_duracion_meses, proyecto_exportacion_pct,
  sector, perfil_tecnico, roadmap, completion_pct
) VALUES (
  'c3333333-3333-4333-8333-333333333301',
  'b2222222-2222-4222-8222-222222222201',
  'a1111111-1111-4111-8111-111111111101',
  'completado',
  'Shanghai Pacific Logistics Holdings Ltd.',
  'CN',
  '91310000MA1FL2XXXX',
  'Li Wei Zhang',
  'Director de Inversión Internacional',
  'Planta de ensamblaje y hub logístico ZEEP Chancay',
  'Inversión extranjera directa en manufactura ligera y logística refrigerada vinculada al corredor Chancay-Shanghai.',
  12500000.00,
  280,
  150,
  42.00,
  24,
  55.00,
  'manufactura',
  '{"empresa_extranjera": true, "idioma_preferido": "zh", "sector_interes": "manufactura"}'::jsonb,
  '[
    {"fase": "elegibilidad", "estado": "completado", "dias_estimados": 0},
    {"fase": "validacion_legal", "estado": "en_progreso", "dias_estimados": 30},
    {"fase": "contratacion", "estado": "pendiente", "dias_estimados": 45},
    {"fase": "operacion", "estado": "pendiente", "dias_estimados": 90}
  ]'::jsonb,
  75
) ON CONFLICT (id) DO UPDATE SET
  empresa_razon_social = EXCLUDED.empresa_razon_social,
  completion_pct = EXCLUDED.completion_pct,
  estado = EXCLUDED.estado;

COMMIT;

-- Copiar en consola del navegador tras login (opcional, para legal-ai automático):
-- localStorage.setItem('hub_investor_profile_id', 'c3333333-3333-4333-8333-333333333301');
-- localStorage.setItem('hub_simulation_session', 'b2222222-2222-4222-8222-222222222201');
