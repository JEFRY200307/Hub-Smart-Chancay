-- Seed CIP Lima / CAL / PadronRUC (50 empresas desde PadronRUC_202603.csv)

-- Ejecutar en Supabase SQL Editor (después de init-db.sql)

-- fuente_empresa válido: padron_ruc (no usar padron_ruc_seed)

BEGIN;



DELETE FROM engineers_cip WHERE numero_cip LIKE 'CIP-LIM-%';

DELETE FROM lawyers_cal WHERE numero_cal LIKE 'CAL-LIM-%';

DELETE FROM companies WHERE fuente_principal = 'padron_ruc';



INSERT INTO engineers_cip (
  id, numero_cip, nombre_completo, habilitacion_vigente, especialidad_principal,
  especialidades, experiencia_zeep, idiomas, marketplace_visible, validado_plataforma,
  rating_promedio, descripcion_publica, cv_data, region, ciudad, disponibilidad
) VALUES (
  '585aa5ec-6803-4d4e-920c-ba5b2936c845', 'CIP-LIM-0001', 'Carlos Fidel Ponce Sánchez', true, 'Ingeniería Industrial',
  '["Doctorado UNI", "Gobierno corporativo CIP"]'::jsonb, true, ARRAY['es','en'], true, true,
  4.85, 'Director Procurador Nacional del Colegio de Ingenieros del Perú', '{"cargo_linkedin": "Director Procurador Nacional del Colegio de Ingenieros del Perú", "institucion": "CIP Lima / UNI"}'::jsonb, 'LIMA', 'Lima', 'disponible'
) ON CONFLICT (numero_cip) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  descripcion_publica = EXCLUDED.descripcion_publica,
  marketplace_visible = true;

INSERT INTO engineers_cip (
  id, numero_cip, nombre_completo, habilitacion_vigente, especialidad_principal,
  especialidades, experiencia_zeep, idiomas, marketplace_visible, validado_plataforma,
  rating_promedio, descripcion_publica, cv_data, region, ciudad, disponibilidad
) VALUES (
  '2238d83a-da17-44c9-a9c3-5c8ed86e7cf3', 'CIP-LIM-0002', 'Norman Jesús Beltrán Castañón', true, 'Ingeniería Mecánica Eléctrica',
  '["Consejo Nacional CIP"]'::jsonb, true, ARRAY['es'], true, true,
  4.85, 'Director Tesorero del Consejo Nacional del CIP', '{"cargo_linkedin": "Director Tesorero del Consejo Nacional del CIP", "institucion": "CIP Lima / UNI"}'::jsonb, 'LIMA', 'Lima', 'disponible'
) ON CONFLICT (numero_cip) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  descripcion_publica = EXCLUDED.descripcion_publica,
  marketplace_visible = true;

INSERT INTO engineers_cip (
  id, numero_cip, nombre_completo, habilitacion_vigente, especialidad_principal,
  especialidades, experiencia_zeep, idiomas, marketplace_visible, validado_plataforma,
  rating_promedio, descripcion_publica, cv_data, region, ciudad, disponibilidad
) VALUES (
  'ce2f8c3f-8f2e-46f0-8a54-d6cfa1a0e673', 'CIP-LIM-0003', 'Carlos Manuel Burgos Montenegro', true, 'Ingeniería Civil',
  '["Infraestructura", "ZEEP"]'::jsonb, true, ARRAY['es','en'], true, true,
  4.85, 'Vicedecano Nacional del CIP', '{"cargo_linkedin": "Vicedecano Nacional del CIP", "institucion": "CIP Lima / UNI"}'::jsonb, 'LIMA', 'Lima', 'disponible'
) ON CONFLICT (numero_cip) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  descripcion_publica = EXCLUDED.descripcion_publica,
  marketplace_visible = true;

INSERT INTO engineers_cip (
  id, numero_cip, nombre_completo, habilitacion_vigente, especialidad_principal,
  especialidades, experiencia_zeep, idiomas, marketplace_visible, validado_plataforma,
  rating_promedio, descripcion_publica, cv_data, region, ciudad, disponibilidad
) VALUES (
  '4eb4ca47-0106-4a98-ba74-52d2193b7b0c', 'CIP-LIM-0004', 'Azucena Liliana Santa María Muro', true, 'Ingeniería Civil',
  '["Gestión institucional"]'::jsonb, true, ARRAY['es'], true, true,
  4.85, 'Directora Secretaria Nacional del Colegio de Ingenieros', '{"cargo_linkedin": "Directora Secretaria Nacional del Colegio de Ingenieros", "institucion": "CIP Lima / UNI"}'::jsonb, 'LIMA', 'Lima', 'disponible'
) ON CONFLICT (numero_cip) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  descripcion_publica = EXCLUDED.descripcion_publica,
  marketplace_visible = true;

INSERT INTO engineers_cip (
  id, numero_cip, nombre_completo, habilitacion_vigente, especialidad_principal,
  especialidades, experiencia_zeep, idiomas, marketplace_visible, validado_plataforma,
  rating_promedio, descripcion_publica, cv_data, region, ciudad, disponibilidad
) VALUES (
  '256dab78-9579-4400-a5ec-61dd380625f2', 'CIP-LIM-0005', 'Jorge Alva Hurtado', true, 'Ingeniería Civil',
  '["Geotecnia", "Puertos"]'::jsonb, true, ARRAY['es','en'], true, true,
  4.85, 'Consultor Principal en Ingeniería Geotécnica — ex Rector UNI', '{"cargo_linkedin": "Consultor Principal en Ingeniería Geotécnica — ex Rector UNI", "institucion": "CIP Lima / UNI"}'::jsonb, 'LIMA', 'Lima', 'disponible'
) ON CONFLICT (numero_cip) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  descripcion_publica = EXCLUDED.descripcion_publica,
  marketplace_visible = true;

INSERT INTO engineers_cip (
  id, numero_cip, nombre_completo, habilitacion_vigente, especialidad_principal,
  especialidades, experiencia_zeep, idiomas, marketplace_visible, validado_plataforma,
  rating_promedio, descripcion_publica, cv_data, region, ciudad, disponibilidad
) VALUES (
  '55a8d238-d758-4f0c-82c6-7af03a5f4fb5', 'CIP-LIM-0006', 'Gustavo Luyo Velit', true, 'Ingeniería de Minas / Civil',
  '["Minería", "CIP Lima"]'::jsonb, true, ARRAY['es'], true, true,
  4.85, 'Vicedecano del Consejo Departamental de Lima', '{"cargo_linkedin": "Vicedecano del Consejo Departamental de Lima", "institucion": "CIP Lima / UNI"}'::jsonb, 'LIMA', 'Lima', 'disponible'
) ON CONFLICT (numero_cip) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  descripcion_publica = EXCLUDED.descripcion_publica,
  marketplace_visible = true;

INSERT INTO engineers_cip (
  id, numero_cip, nombre_completo, habilitacion_vigente, especialidad_principal,
  especialidades, experiencia_zeep, idiomas, marketplace_visible, validado_plataforma,
  rating_promedio, descripcion_publica, cv_data, region, ciudad, disponibilidad
) VALUES (
  '8c0b5bb7-fc08-40bb-8bf6-a36670b2bb48', 'CIP-LIM-0007', 'Luis Mendizábal Flores', true, 'Ingeniería de Sistemas',
  '["Cloud", "Software"]'::jsonb, true, ARRAY['es','en'], true, true,
  4.85, 'Lead Cloud Architect — egresado UNI', '{"cargo_linkedin": "Lead Cloud Architect — egresado UNI", "institucion": "CIP Lima / UNI"}'::jsonb, 'LIMA', 'Lima', 'disponible'
) ON CONFLICT (numero_cip) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  descripcion_publica = EXCLUDED.descripcion_publica,
  marketplace_visible = true;

INSERT INTO engineers_cip (
  id, numero_cip, nombre_completo, habilitacion_vigente, especialidad_principal,
  especialidades, experiencia_zeep, idiomas, marketplace_visible, validado_plataforma,
  rating_promedio, descripcion_publica, cv_data, region, ciudad, disponibilidad
) VALUES (
  '6d7d1456-f277-40af-b38e-c45b240fb152', 'CIP-LIM-0008', 'Mariana Costa Checa', true, 'Emprendimiento Tecnológico',
  '["Software", "Innovación"]'::jsonb, true, ARRAY['es','en'], true, true,
  4.85, 'Fundadora de Laboratoria — referente Tech Lima', '{"cargo_linkedin": "Fundadora de Laboratoria — referente Tech Lima", "institucion": "CIP Lima / UNI"}'::jsonb, 'LIMA', 'Lima', 'disponible'
) ON CONFLICT (numero_cip) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  descripcion_publica = EXCLUDED.descripcion_publica,
  marketplace_visible = true;

INSERT INTO engineers_cip (
  id, numero_cip, nombre_completo, habilitacion_vigente, especialidad_principal,
  especialidades, experiencia_zeep, idiomas, marketplace_visible, validado_plataforma,
  rating_promedio, descripcion_publica, cv_data, region, ciudad, disponibilidad
) VALUES (
  '0f2a9a00-08a5-4172-a40f-6fdcd76733f9', 'CIP-LIM-0009', 'César Gallegos Chávez', true, 'Ingeniería Electrónica y Telecomunicaciones',
  '["Telecom", "Infraestructura"]'::jsonb, true, ARRAY['es'], true, true,
  4.85, 'Gerente de Proyectos de Infraestructura y Conectividad', '{"cargo_linkedin": "Gerente de Proyectos de Infraestructura y Conectividad", "institucion": "CIP Lima / UNI"}'::jsonb, 'LIMA', 'Lima', 'disponible'
) ON CONFLICT (numero_cip) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  descripcion_publica = EXCLUDED.descripcion_publica,
  marketplace_visible = true;

INSERT INTO engineers_cip (
  id, numero_cip, nombre_completo, habilitacion_vigente, especialidad_principal,
  especialidades, experiencia_zeep, idiomas, marketplace_visible, validado_plataforma,
  rating_promedio, descripcion_publica, cv_data, region, ciudad, disponibilidad
) VALUES (
  '7902db8c-0c66-4c88-88cc-604e7a90b6f9', 'CIP-LIM-0010', 'Diana Rojas Milla', true, 'Ingeniería Ambiental',
  '["EIA", "Sostenibilidad ZEEP"]'::jsonb, true, ARRAY['es','en'], true, true,
  4.85, 'Especialista en Evaluaciones de Impacto Ambiental — CIP Lima', '{"cargo_linkedin": "Especialista en Evaluaciones de Impacto Ambiental — CIP Lima", "institucion": "CIP Lima / UNI"}'::jsonb, 'LIMA', 'Lima', 'disponible'
) ON CONFLICT (numero_cip) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  descripcion_publica = EXCLUDED.descripcion_publica,
  marketplace_visible = true;

INSERT INTO lawyers_cal (
  id, numero_cal, nombre_completo, habilitacion_vigente, especializacion_principal,
  certificacion_zeep, idiomas, marketplace_visible, validado_plataforma,
  rating_promedio, descripcion_publica, cv_data, region, ciudad
) VALUES (
  '9d11f484-2bc2-4902-b788-735dd1ef6671', 'CAL-LIM-0001', 'Raúl Canelo Rabanal', true, 'Derecho Civil y Procesal',
  true, ARRAY['es','en'], true, true,
  4.80, 'Decano en funciones del Ilustre Colegio de Abogados de Lima', '{"institucion": "CAL Lima"}'::jsonb, 'LIMA', 'Lima'
) ON CONFLICT (numero_cal) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  descripcion_publica = EXCLUDED.descripcion_publica,
  marketplace_visible = true;

INSERT INTO lawyers_cal (
  id, numero_cal, nombre_completo, habilitacion_vigente, especializacion_principal,
  certificacion_zeep, idiomas, marketplace_visible, validado_plataforma,
  rating_promedio, descripcion_publica, cv_data, region, ciudad
) VALUES (
  'ed43024c-c020-4805-b562-c56f034d344c', 'CAL-LIM-0002', 'Francisco Miró Quesada Rada', true, 'Derecho Constitucional',
  true, ARRAY['es','en'], true, true,
  4.80, 'Exdirector académico y constitucionalista CAL', '{"institucion": "CAL Lima"}'::jsonb, 'LIMA', 'Lima'
) ON CONFLICT (numero_cal) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  descripcion_publica = EXCLUDED.descripcion_publica,
  marketplace_visible = true;

INSERT INTO lawyers_cal (
  id, numero_cal, nombre_completo, habilitacion_vigente, especializacion_principal,
  certificacion_zeep, idiomas, marketplace_visible, validado_plataforma,
  rating_promedio, descripcion_publica, cv_data, region, ciudad
) VALUES (
  '38cf6d1a-4d9d-49ff-913c-75dc58f98cdd', 'CAL-LIM-0003', 'Aníbal Torres Vásquez', true, 'Derecho Civil / Arbitraje',
  true, ARRAY['es','en'], true, true,
  4.80, 'Catedrático principal y miembro del CAL', '{"institucion": "CAL Lima"}'::jsonb, 'LIMA', 'Lima'
) ON CONFLICT (numero_cal) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  descripcion_publica = EXCLUDED.descripcion_publica,
  marketplace_visible = true;

INSERT INTO lawyers_cal (
  id, numero_cal, nombre_completo, habilitacion_vigente, especializacion_principal,
  certificacion_zeep, idiomas, marketplace_visible, validado_plataforma,
  rating_promedio, descripcion_publica, cv_data, region, ciudad
) VALUES (
  '0a6639da-bb17-44b9-864d-10c7d14e5f9e', 'CAL-LIM-0004', 'Beatriz Merino Lucero', true, 'Derecho Corporativo',
  true, ARRAY['es','en'], true, true,
  4.80, 'Ex-defensora del Pueblo y asesora legal corporativa', '{"institucion": "CAL Lima"}'::jsonb, 'LIMA', 'Lima'
) ON CONFLICT (numero_cal) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  descripcion_publica = EXCLUDED.descripcion_publica,
  marketplace_visible = true;

INSERT INTO lawyers_cal (
  id, numero_cal, nombre_completo, habilitacion_vigente, especializacion_principal,
  certificacion_zeep, idiomas, marketplace_visible, validado_plataforma,
  rating_promedio, descripcion_publica, cv_data, region, ciudad
) VALUES (
  '0b6aa7fe-59e5-48fb-ab81-d7f8726a725f', 'CAL-LIM-0005', 'Enrique Ghersi Silva', true, 'Derecho Económico',
  true, ARRAY['es','en'], true, true,
  4.80, 'Socio Principal en Ghersi Abogados (Lima)', '{"institucion": "CAL Lima"}'::jsonb, 'LIMA', 'Lima'
) ON CONFLICT (numero_cal) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  descripcion_publica = EXCLUDED.descripcion_publica,
  marketplace_visible = true;

INSERT INTO lawyers_cal (
  id, numero_cal, nombre_completo, habilitacion_vigente, especializacion_principal,
  certificacion_zeep, idiomas, marketplace_visible, validado_plataforma,
  rating_promedio, descripcion_publica, cv_data, region, ciudad
) VALUES (
  '3c7f1d87-0cc7-4637-80fa-52c79f5dd841', 'CAL-LIM-0006', 'Walter Gutiérrez Camacho', true, 'Derecho Civil y Contractual',
  true, ARRAY['es','en'], true, true,
  4.80, 'Ex-decano del Colegio de Abogados de Lima', '{"institucion": "CAL Lima"}'::jsonb, 'LIMA', 'Lima'
) ON CONFLICT (numero_cal) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  descripcion_publica = EXCLUDED.descripcion_publica,
  marketplace_visible = true;

INSERT INTO lawyers_cal (
  id, numero_cal, nombre_completo, habilitacion_vigente, especializacion_principal,
  certificacion_zeep, idiomas, marketplace_visible, validado_plataforma,
  rating_promedio, descripcion_publica, cv_data, region, ciudad
) VALUES (
  '1ca99881-4ba0-4ddd-b4dd-2ec70a293763', 'CAL-LIM-0007', 'Marisol Pérez Tello', true, 'Derecho de DD.HH.',
  true, ARRAY['es','en'], true, true,
  4.80, 'Ex-ministra de Justicia y miembro activo del CAL', '{"institucion": "CAL Lima"}'::jsonb, 'LIMA', 'Lima'
) ON CONFLICT (numero_cal) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  descripcion_publica = EXCLUDED.descripcion_publica,
  marketplace_visible = true;

INSERT INTO lawyers_cal (
  id, numero_cal, nombre_completo, habilitacion_vigente, especializacion_principal,
  certificacion_zeep, idiomas, marketplace_visible, validado_plataforma,
  rating_promedio, descripcion_publica, cv_data, region, ciudad
) VALUES (
  '573cd44a-77d4-431d-a638-a4e0c5d89caf', 'CAL-LIM-0008', 'Alfredo Bullard González', true, 'Arbitraje Internacional',
  true, ARRAY['es','en'], true, true,
  4.80, 'Socio fundador Bullard Falla Ezcurra +', '{"institucion": "CAL Lima"}'::jsonb, 'LIMA', 'Lima'
) ON CONFLICT (numero_cal) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  descripcion_publica = EXCLUDED.descripcion_publica,
  marketplace_visible = true;

INSERT INTO lawyers_cal (
  id, numero_cal, nombre_completo, habilitacion_vigente, especializacion_principal,
  certificacion_zeep, idiomas, marketplace_visible, validado_plataforma,
  rating_promedio, descripcion_publica, cv_data, region, ciudad
) VALUES (
  '075611c1-033f-4bc3-b068-896c37239e9b', 'CAL-LIM-0009', 'Delia Muñoz Muñoz', true, 'Derecho Internacional',
  true, ARRAY['es','en'], true, true,
  4.80, 'Abogada procesalista y consultora senior', '{"institucion": "CAL Lima"}'::jsonb, 'LIMA', 'Lima'
) ON CONFLICT (numero_cal) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  descripcion_publica = EXCLUDED.descripcion_publica,
  marketplace_visible = true;

INSERT INTO lawyers_cal (
  id, numero_cal, nombre_completo, habilitacion_vigente, especializacion_principal,
  certificacion_zeep, idiomas, marketplace_visible, validado_plataforma,
  rating_promedio, descripcion_publica, cv_data, region, ciudad
) VALUES (
  '1682fad4-4cbb-4422-88a4-854f2070bf44', 'CAL-LIM-0010', 'César Nakazaki Servigón', true, 'Derecho Penal',
  true, ARRAY['es','en'], true, true,
  4.80, 'Litigante en casos de alta complejidad penal económico', '{"institucion": "CAL Lima"}'::jsonb, 'LIMA', 'Lima'
) ON CONFLICT (numero_cal) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  descripcion_publica = EXCLUDED.descripcion_publica,
  marketplace_visible = true;

INSERT INTO companies (
  ruc, razon_social, estado_sunarp, condicion_contribuyente, estado_contribuyente,
  sector_interno, trust_score, capacidad_operativa, distancia_puerto_chancay_km,
  marketplace_visible, descripcion_publica, fuente_principal, ubigeo, servicios_principales
) VALUES (
  '10000608438', 'Contribuyente 10000608438 — OTRAS ACTIVIDADES DE TIPO SERVICIO NO CLASIFICADO PREVIAMENTE', 'ACTIVA', 'HABIDO', 'ACTIVO',
  'otros', 0.93, 'media', 53,
  true, 'OTRAS ACTIVIDADES DE TIPO SERVICIO NO CLASIFICADO PREVIAMENTE', 'padron_ruc', '150142',
  ARRAY['Servicios ZEEP', 'Otros']
) ON CONFLICT (ruc) DO UPDATE SET
  razon_social = EXCLUDED.razon_social,
  marketplace_visible = true,
  last_padron_sync = CURRENT_DATE;

INSERT INTO companies (
  ruc, razon_social, estado_sunarp, condicion_contribuyente, estado_contribuyente,
  sector_interno, trust_score, capacidad_operativa, distancia_puerto_chancay_km,
  marketplace_visible, descripcion_publica, fuente_principal, ubigeo, servicios_principales
) VALUES (
  '10001204659', 'Contribuyente 10001204659 — OTRAS ACTIVIDADES DE TIPO SERVICIO NO CLASIFICADO PREVIAMENTE', 'ACTIVA', 'HABIDO', 'ACTIVO',
  'otros', 0.74, 'media', 34,
  true, 'OTRAS ACTIVIDADES DE TIPO SERVICIO NO CLASIFICADO PREVIAMENTE', 'padron_ruc', '250101',
  ARRAY['Servicios ZEEP', 'Otros']
) ON CONFLICT (ruc) DO UPDATE SET
  razon_social = EXCLUDED.razon_social,
  marketplace_visible = true,
  last_padron_sync = CURRENT_DATE;

INSERT INTO companies (
  ruc, razon_social, estado_sunarp, condicion_contribuyente, estado_contribuyente,
  sector_interno, trust_score, capacidad_operativa, distancia_puerto_chancay_km,
  marketplace_visible, descripcion_publica, fuente_principal, ubigeo, servicios_principales
) VALUES (
  '10001910561', 'Contribuyente 10001910561 — ACTIVIDADES INMOBILIARIAS', 'ACTIVA', 'HABIDO', 'ACTIVO',
  'otros', 0.76, 'media', 16,
  true, 'ACTIVIDADES INMOBILIARIAS', 'padron_ruc', '250401',
  ARRAY['Servicios ZEEP', 'Otros']
) ON CONFLICT (ruc) DO UPDATE SET
  razon_social = EXCLUDED.razon_social,
  marketplace_visible = true,
  last_padron_sync = CURRENT_DATE;

INSERT INTO companies (
  ruc, razon_social, estado_sunarp, condicion_contribuyente, estado_contribuyente,
  sector_interno, trust_score, capacidad_operativa, distancia_puerto_chancay_km,
  marketplace_visible, descripcion_publica, fuente_principal, ubigeo, servicios_principales
) VALUES (
  '10002015086', 'Contribuyente 10002015086 — OTRAS ACTIVIDADES DE TIPO SERVICIO NO CLASIFICADO PREVIAMENTE', 'ACTIVA', 'HABIDO', 'ACTIVO',
  'otros', 0.61, 'media', 21,
  true, 'OTRAS ACTIVIDADES DE TIPO SERVICIO NO CLASIFICADO PREVIAMENTE', 'padron_ruc', '150108',
  ARRAY['Servicios ZEEP', 'Otros']
) ON CONFLICT (ruc) DO UPDATE SET
  razon_social = EXCLUDED.razon_social,
  marketplace_visible = true,
  last_padron_sync = CURRENT_DATE;

INSERT INTO companies (
  ruc, razon_social, estado_sunarp, condicion_contribuyente, estado_contribuyente,
  sector_interno, trust_score, capacidad_operativa, distancia_puerto_chancay_km,
  marketplace_visible, descripcion_publica, fuente_principal, ubigeo, servicios_principales
) VALUES (
  '10002056998', 'Contribuyente 10002056998 — OTRAS ACTIVIDADES DE TIPO SERVICIO NO CLASIFICADO PREVIAMENTE', 'ACTIVA', 'HABIDO', 'ACTIVO',
  'otros', 0.73, 'media', 53,
  true, 'OTRAS ACTIVIDADES DE TIPO SERVICIO NO CLASIFICADO PREVIAMENTE', 'padron_ruc', '240101',
  ARRAY['Servicios ZEEP', 'Otros']
) ON CONFLICT (ruc) DO UPDATE SET
  razon_social = EXCLUDED.razon_social,
  marketplace_visible = true,
  last_padron_sync = CURRENT_DATE;

INSERT INTO companies (
  ruc, razon_social, estado_sunarp, condicion_contribuyente, estado_contribuyente,
  sector_interno, trust_score, capacidad_operativa, distancia_puerto_chancay_km,
  marketplace_visible, descripcion_publica, fuente_principal, ubigeo, servicios_principales
) VALUES (
  '10002150609', 'Contribuyente 10002150609 — ACTIVIDADES INMOBILIARIAS', 'ACTIVA', 'HABIDO', 'ACTIVO',
  'otros', 0.64, 'media', 64,
  true, 'ACTIVIDADES INMOBILIARIAS', 'padron_ruc', '240101',
  ARRAY['Servicios ZEEP', 'Otros']
) ON CONFLICT (ruc) DO UPDATE SET
  razon_social = EXCLUDED.razon_social,
  marketplace_visible = true,
  last_padron_sync = CURRENT_DATE;

INSERT INTO companies (
  ruc, razon_social, estado_sunarp, condicion_contribuyente, estado_contribuyente,
  sector_interno, trust_score, capacidad_operativa, distancia_puerto_chancay_km,
  marketplace_visible, descripcion_publica, fuente_principal, ubigeo, servicios_principales
) VALUES (
  '10002191526', 'Contribuyente 10002191526 — ACTIVIDADES INMOBILIARIAS', 'ACTIVA', 'HABIDO', 'ACTIVO',
  'otros', 0.81, 'media', 61,
  true, 'ACTIVIDADES INMOBILIARIAS', 'padron_ruc', '130101',
  ARRAY['Servicios ZEEP', 'Otros']
) ON CONFLICT (ruc) DO UPDATE SET
  razon_social = EXCLUDED.razon_social,
  marketplace_visible = true,
  last_padron_sync = CURRENT_DATE;

INSERT INTO companies (
  ruc, razon_social, estado_sunarp, condicion_contribuyente, estado_contribuyente,
  sector_interno, trust_score, capacidad_operativa, distancia_puerto_chancay_km,
  marketplace_visible, descripcion_publica, fuente_principal, ubigeo, servicios_principales
) VALUES (
  '10002276394', 'Contribuyente 10002276394 — OTRAS ACTIVIDADES EMPRESARIALES NO CLASIFICADO PREVIAMENTE', 'ACTIVA', 'HABIDO', 'ACTIVO',
  'otros', 0.69, 'media', 89,
  true, 'OTRAS ACTIVIDADES EMPRESARIALES NO CLASIFICADO PREVIAMENTE', 'padron_ruc', '240103',
  ARRAY['Servicios ZEEP', 'Otros']
) ON CONFLICT (ruc) DO UPDATE SET
  razon_social = EXCLUDED.razon_social,
  marketplace_visible = true,
  last_padron_sync = CURRENT_DATE;

INSERT INTO companies (
  ruc, razon_social, estado_sunarp, condicion_contribuyente, estado_contribuyente,
  sector_interno, trust_score, capacidad_operativa, distancia_puerto_chancay_km,
  marketplace_visible, descripcion_publica, fuente_principal, ubigeo, servicios_principales
) VALUES (
  '10002314865', 'Contribuyente 10002314865 — ACTIVIDADES INMOBILIARIAS', 'ACTIVA', 'HABIDO', 'ACTIVO',
  'otros', 0.8, 'media', 80,
  true, 'ACTIVIDADES INMOBILIARIAS', 'padron_ruc', '240104',
  ARRAY['Servicios ZEEP', 'Otros']
) ON CONFLICT (ruc) DO UPDATE SET
  razon_social = EXCLUDED.razon_social,
  marketplace_visible = true,
  last_padron_sync = CURRENT_DATE;

INSERT INTO companies (
  ruc, razon_social, estado_sunarp, condicion_contribuyente, estado_contribuyente,
  sector_interno, trust_score, capacidad_operativa, distancia_puerto_chancay_km,
  marketplace_visible, descripcion_publica, fuente_principal, ubigeo, servicios_principales
) VALUES (
  '10002471316', 'Contribuyente 10002471316 — OTRAS ACTIVIDADES DE TIPO SERVICIO NO CLASIFICADO PREVIAMENTE', 'ACTIVA', 'HABIDO', 'ACTIVO',
  'otros', 0.71, 'media', 91,
  true, 'OTRAS ACTIVIDADES DE TIPO SERVICIO NO CLASIFICADO PREVIAMENTE', 'padron_ruc', '240102',
  ARRAY['Servicios ZEEP', 'Otros']
) ON CONFLICT (ruc) DO UPDATE SET
  razon_social = EXCLUDED.razon_social,
  marketplace_visible = true,
  last_padron_sync = CURRENT_DATE;

INSERT INTO companies (
  ruc, razon_social, estado_sunarp, condicion_contribuyente, estado_contribuyente,
  sector_interno, trust_score, capacidad_operativa, distancia_puerto_chancay_km,
  marketplace_visible, descripcion_publica, fuente_principal, ubigeo, servicios_principales
) VALUES (
  '10002512624', 'Contribuyente 10002512624 — ACTIVIDADES AUXILIARES DE INTERMEDIACION FINANCIERA', 'ACTIVA', 'HABIDO', 'ACTIVO',
  'otros', 0.79, 'media', 79,
  true, 'ACTIVIDADES AUXILIARES DE INTERMEDIACION FINANCIERA', 'padron_ruc', '240101',
  ARRAY['Servicios ZEEP', 'Otros']
) ON CONFLICT (ruc) DO UPDATE SET
  razon_social = EXCLUDED.razon_social,
  marketplace_visible = true,
  last_padron_sync = CURRENT_DATE;

INSERT INTO companies (
  ruc, razon_social, estado_sunarp, condicion_contribuyente, estado_contribuyente,
  sector_interno, trust_score, capacidad_operativa, distancia_puerto_chancay_km,
  marketplace_visible, descripcion_publica, fuente_principal, ubigeo, servicios_principales
) VALUES (
  '10002521763', 'Contribuyente 10002521763 — OTRAS ACTIVIDADES DE TIPO SERVICIO NO CLASIFICADO PREVIAMENTE', 'ACTIVA', 'HABIDO', 'ACTIVO',
  'otros', 0.78, 'media', 58,
  true, 'OTRAS ACTIVIDADES DE TIPO SERVICIO NO CLASIFICADO PREVIAMENTE', 'padron_ruc', '240101',
  ARRAY['Servicios ZEEP', 'Otros']
) ON CONFLICT (ruc) DO UPDATE SET
  razon_social = EXCLUDED.razon_social,
  marketplace_visible = true,
  last_padron_sync = CURRENT_DATE;

INSERT INTO companies (
  ruc, razon_social, estado_sunarp, condicion_contribuyente, estado_contribuyente,
  sector_interno, trust_score, capacidad_operativa, distancia_puerto_chancay_km,
  marketplace_visible, descripcion_publica, fuente_principal, ubigeo, servicios_principales
) VALUES (
  '10003211687', 'Contribuyente 10003211687 — ACTIVIDADES DE ADMINISTRACION PUBLICA EN GENERAL', 'ACTIVA', 'HABIDO', 'ACTIVO',
  'otros', 0.62, 'media', 62,
  true, 'ACTIVIDADES DE ADMINISTRACION PUBLICA EN GENERAL', 'padron_ruc', '240201',
  ARRAY['Servicios ZEEP', 'Otros']
) ON CONFLICT (ruc) DO UPDATE SET
  razon_social = EXCLUDED.razon_social,
  marketplace_visible = true,
  last_padron_sync = CURRENT_DATE;

INSERT INTO companies (
  ruc, razon_social, estado_sunarp, condicion_contribuyente, estado_contribuyente,
  sector_interno, trust_score, capacidad_operativa, distancia_puerto_chancay_km,
  marketplace_visible, descripcion_publica, fuente_principal, ubigeo, servicios_principales
) VALUES (
  '10003708760', 'Contribuyente 10003708760 — OTRAS ACTIVIDADES EMPRESARIALES NO CLASIFICADO PREVIAMENTE', 'ACTIVA', 'HABIDO', 'ACTIVO',
  'otros', 0.75, 'media', 55,
  true, 'OTRAS ACTIVIDADES EMPRESARIALES NO CLASIFICADO PREVIAMENTE', 'padron_ruc', '240101',
  ARRAY['Servicios ZEEP', 'Otros']
) ON CONFLICT (ruc) DO UPDATE SET
  razon_social = EXCLUDED.razon_social,
  marketplace_visible = true,
  last_padron_sync = CURRENT_DATE;

INSERT INTO companies (
  ruc, razon_social, estado_sunarp, condicion_contribuyente, estado_contribuyente,
  sector_interno, trust_score, capacidad_operativa, distancia_puerto_chancay_km,
  marketplace_visible, descripcion_publica, fuente_principal, ubigeo, servicios_principales
) VALUES (
  '10003733446', 'Contribuyente 10003733446 — OTRAS ACTIVIDADES DE TIPO SERVICIO NO CLASIFICADO PREVIAMENTE', 'ACTIVA', 'HABIDO', 'ACTIVO',
  'otros', 0.61, 'media', 61,
  true, 'OTRAS ACTIVIDADES DE TIPO SERVICIO NO CLASIFICADO PREVIAMENTE', 'padron_ruc', '150115',
  ARRAY['Servicios ZEEP', 'Otros']
) ON CONFLICT (ruc) DO UPDATE SET
  razon_social = EXCLUDED.razon_social,
  marketplace_visible = true,
  last_padron_sync = CURRENT_DATE;

INSERT INTO companies (
  ruc, razon_social, estado_sunarp, condicion_contribuyente, estado_contribuyente,
  sector_interno, trust_score, capacidad_operativa, distancia_puerto_chancay_km,
  marketplace_visible, descripcion_publica, fuente_principal, ubigeo, servicios_principales
) VALUES (
  '10004007862', 'Contribuyente 10004007862 — OTRAS ACTIVIDADES DE TIPO SERVICIO NO CLASIFICADO PREVIAMENTE', 'ACTIVA', 'HABIDO', 'ACTIVO',
  'otros', 0.77, 'media', 77,
  true, 'OTRAS ACTIVIDADES DE TIPO SERVICIO NO CLASIFICADO PREVIAMENTE', 'padron_ruc', '230102',
  ARRAY['Servicios ZEEP', 'Otros']
) ON CONFLICT (ruc) DO UPDATE SET
  razon_social = EXCLUDED.razon_social,
  marketplace_visible = true,
  last_padron_sync = CURRENT_DATE;

INSERT INTO companies (
  ruc, razon_social, estado_sunarp, condicion_contribuyente, estado_contribuyente,
  sector_interno, trust_score, capacidad_operativa, distancia_puerto_chancay_km,
  marketplace_visible, descripcion_publica, fuente_principal, ubigeo, servicios_principales
) VALUES (
  '10004029173', 'Contribuyente 10004029173 — OTRAS ACTIVIDADES DE TIPO SERVICIO NO CLASIFICADO PREVIAMENTE', 'ACTIVA', 'HABIDO', 'ACTIVO',
  'otros', 0.88, 'media', 28,
  true, 'OTRAS ACTIVIDADES DE TIPO SERVICIO NO CLASIFICADO PREVIAMENTE', 'padron_ruc', '230101',
  ARRAY['Servicios ZEEP', 'Otros']
) ON CONFLICT (ruc) DO UPDATE SET
  razon_social = EXCLUDED.razon_social,
  marketplace_visible = true,
  last_padron_sync = CURRENT_DATE;

INSERT INTO companies (
  ruc, razon_social, estado_sunarp, condicion_contribuyente, estado_contribuyente,
  sector_interno, trust_score, capacidad_operativa, distancia_puerto_chancay_km,
  marketplace_visible, descripcion_publica, fuente_principal, ubigeo, servicios_principales
) VALUES (
  '10004130320', 'Contribuyente 10004130320 — OTRAS ACTIVIDADES DE TIPO SERVICIO NO CLASIFICADO PREVIAMENTE', 'ACTIVA', 'HABIDO', 'ACTIVO',
  'otros', 0.75, 'media', 15,
  true, 'OTRAS ACTIVIDADES DE TIPO SERVICIO NO CLASIFICADO PREVIAMENTE', 'padron_ruc', '230101',
  ARRAY['Servicios ZEEP', 'Otros']
) ON CONFLICT (ruc) DO UPDATE SET
  razon_social = EXCLUDED.razon_social,
  marketplace_visible = true,
  last_padron_sync = CURRENT_DATE;

INSERT INTO companies (
  ruc, razon_social, estado_sunarp, condicion_contribuyente, estado_contribuyente,
  sector_interno, trust_score, capacidad_operativa, distancia_puerto_chancay_km,
  marketplace_visible, descripcion_publica, fuente_principal, ubigeo, servicios_principales
) VALUES (
  '10004168807', 'Contribuyente 10004168807 — ACTIVIDADES DE MEDICOS Y ODONTOLOGO', 'ACTIVA', 'HABIDO', 'ACTIVO',
  'otros', 0.62, 'media', 22,
  true, 'ACTIVIDADES DE MEDICOS Y ODONTOLOGO', 'padron_ruc', '230101',
  ARRAY['Servicios ZEEP', 'Otros']
) ON CONFLICT (ruc) DO UPDATE SET
  razon_social = EXCLUDED.razon_social,
  marketplace_visible = true,
  last_padron_sync = CURRENT_DATE;

INSERT INTO companies (
  ruc, razon_social, estado_sunarp, condicion_contribuyente, estado_contribuyente,
  sector_interno, trust_score, capacidad_operativa, distancia_puerto_chancay_km,
  marketplace_visible, descripcion_publica, fuente_principal, ubigeo, servicios_principales
) VALUES (
  '10004184063', 'Contribuyente 10004184063 — ALQUILER DE EQUIPO DE TRANSPORTE VIA TERRESTRE', 'ACTIVA', 'HABIDO', 'ACTIVO',
  'logistica', 0.78, 'media', 78,
  true, 'ALQUILER DE EQUIPO DE TRANSPORTE VIA TERRESTRE', 'padron_ruc', '230101',
  ARRAY['Servicios ZEEP', 'Logistica']
) ON CONFLICT (ruc) DO UPDATE SET
  razon_social = EXCLUDED.razon_social,
  marketplace_visible = true,
  last_padron_sync = CURRENT_DATE;

INSERT INTO companies (
  ruc, razon_social, estado_sunarp, condicion_contribuyente, estado_contribuyente,
  sector_interno, trust_score, capacidad_operativa, distancia_puerto_chancay_km,
  marketplace_visible, descripcion_publica, fuente_principal, ubigeo, servicios_principales
) VALUES (
  '10004204455', 'Contribuyente 10004204455 — ACTIVIDADES DE ASESORAMIENTO EMPRESARIAL', 'ACTIVA', 'HABIDO', 'ACTIVO',
  'otros', 0.7, 'media', 70,
  true, 'ACTIVIDADES DE ASESORAMIENTO EMPRESARIAL', 'padron_ruc', '230101',
  ARRAY['Servicios ZEEP', 'Otros']
) ON CONFLICT (ruc) DO UPDATE SET
  razon_social = EXCLUDED.razon_social,
  marketplace_visible = true,
  last_padron_sync = CURRENT_DATE;

INSERT INTO companies (
  ruc, razon_social, estado_sunarp, condicion_contribuyente, estado_contribuyente,
  sector_interno, trust_score, capacidad_operativa, distancia_puerto_chancay_km,
  marketplace_visible, descripcion_publica, fuente_principal, ubigeo, servicios_principales
) VALUES (
  '10004217433', 'Contribuyente 10004217433 — ACTIVIDADES DE MEDICOS Y ODONTOLOGO', 'ACTIVA', 'HABIDO', 'ACTIVO',
  'otros', 0.88, 'media', 48,
  true, 'ACTIVIDADES DE MEDICOS Y ODONTOLOGO', 'padron_ruc', '040101',
  ARRAY['Servicios ZEEP', 'Otros']
) ON CONFLICT (ruc) DO UPDATE SET
  razon_social = EXCLUDED.razon_social,
  marketplace_visible = true,
  last_padron_sync = CURRENT_DATE;

INSERT INTO companies (
  ruc, razon_social, estado_sunarp, condicion_contribuyente, estado_contribuyente,
  sector_interno, trust_score, capacidad_operativa, distancia_puerto_chancay_km,
  marketplace_visible, descripcion_publica, fuente_principal, ubigeo, servicios_principales
) VALUES (
  '10004323144', 'Contribuyente 10004323144 — ACTIVIDADES INMOBILIARIAS POR RETRIBUCION', 'ACTIVA', 'HABIDO', 'ACTIVO',
  'otros', 0.59, 'media', 79,
  true, 'ACTIVIDADES INMOBILIARIAS POR RETRIBUCION', 'padron_ruc', '230101',
  ARRAY['Servicios ZEEP', 'Otros']
) ON CONFLICT (ruc) DO UPDATE SET
  razon_social = EXCLUDED.razon_social,
  marketplace_visible = true,
  last_padron_sync = CURRENT_DATE;

INSERT INTO companies (
  ruc, razon_social, estado_sunarp, condicion_contribuyente, estado_contribuyente,
  sector_interno, trust_score, capacidad_operativa, distancia_puerto_chancay_km,
  marketplace_visible, descripcion_publica, fuente_principal, ubigeo, servicios_principales
) VALUES (
  '10004330507', 'Contribuyente 10004330507 — OTRAS ACTIVIDADES DE TIPO SERVICIO NO CLASIFICADO PREVIAMENTE', 'ACTIVA', 'HABIDO', 'ACTIVO',
  'otros', 0.62, 'media', 42,
  true, 'OTRAS ACTIVIDADES DE TIPO SERVICIO NO CLASIFICADO PREVIAMENTE', 'padron_ruc', '230101',
  ARRAY['Servicios ZEEP', 'Otros']
) ON CONFLICT (ruc) DO UPDATE SET
  razon_social = EXCLUDED.razon_social,
  marketplace_visible = true,
  last_padron_sync = CURRENT_DATE;

INSERT INTO companies (
  ruc, razon_social, estado_sunarp, condicion_contribuyente, estado_contribuyente,
  sector_interno, trust_score, capacidad_operativa, distancia_puerto_chancay_km,
  marketplace_visible, descripcion_publica, fuente_principal, ubigeo, servicios_principales
) VALUES (
  '10004513903', 'Contribuyente 10004513903 — ACTIVIDADES INMOBILIARIAS', 'ACTIVA', 'HABIDO', 'ACTIVO',
  'otros', 0.58, 'media', 38,
  true, 'ACTIVIDADES INMOBILIARIAS', 'padron_ruc', '230101',
  ARRAY['Servicios ZEEP', 'Otros']
) ON CONFLICT (ruc) DO UPDATE SET
  razon_social = EXCLUDED.razon_social,
  marketplace_visible = true,
  last_padron_sync = CURRENT_DATE;

INSERT INTO companies (
  ruc, razon_social, estado_sunarp, condicion_contribuyente, estado_contribuyente,
  sector_interno, trust_score, capacidad_operativa, distancia_puerto_chancay_km,
  marketplace_visible, descripcion_publica, fuente_principal, ubigeo, servicios_principales
) VALUES (
  '10004534471', 'Contribuyente 10004534471 — ACTIVIDADES DE ARQUITECTURA E INGENIERIA', 'ACTIVA', 'HABIDO', 'ACTIVO',
  'otros', 0.86, 'media', 86,
  true, 'ACTIVIDADES DE ARQUITECTURA E INGENIERIA', 'padron_ruc', '150130',
  ARRAY['Servicios ZEEP', 'Otros']
) ON CONFLICT (ruc) DO UPDATE SET
  razon_social = EXCLUDED.razon_social,
  marketplace_visible = true,
  last_padron_sync = CURRENT_DATE;

INSERT INTO companies (
  ruc, razon_social, estado_sunarp, condicion_contribuyente, estado_contribuyente,
  sector_interno, trust_score, capacidad_operativa, distancia_puerto_chancay_km,
  marketplace_visible, descripcion_publica, fuente_principal, ubigeo, servicios_principales
) VALUES (
  '10004546143', 'Contribuyente 10004546143 — ACTIVIDADES INMOBILIARIAS', 'ACTIVA', 'HABIDO', 'ACTIVO',
  'otros', 0.58, 'media', 78,
  true, 'ACTIVIDADES INMOBILIARIAS', 'padron_ruc', '040107',
  ARRAY['Servicios ZEEP', 'Otros']
) ON CONFLICT (ruc) DO UPDATE SET
  razon_social = EXCLUDED.razon_social,
  marketplace_visible = true,
  last_padron_sync = CURRENT_DATE;

INSERT INTO companies (
  ruc, razon_social, estado_sunarp, condicion_contribuyente, estado_contribuyente,
  sector_interno, trust_score, capacidad_operativa, distancia_puerto_chancay_km,
  marketplace_visible, descripcion_publica, fuente_principal, ubigeo, servicios_principales
) VALUES (
  '10004562246', 'Contribuyente 10004562246 — ACTIVIDADES INMOBILIARIAS', 'ACTIVA', 'HABIDO', 'ACTIVO',
  'otros', 0.61, 'media', 21,
  true, 'ACTIVIDADES INMOBILIARIAS', 'padron_ruc', '150131',
  ARRAY['Servicios ZEEP', 'Otros']
) ON CONFLICT (ruc) DO UPDATE SET
  razon_social = EXCLUDED.razon_social,
  marketplace_visible = true,
  last_padron_sync = CURRENT_DATE;

INSERT INTO companies (
  ruc, razon_social, estado_sunarp, condicion_contribuyente, estado_contribuyente,
  sector_interno, trust_score, capacidad_operativa, distancia_puerto_chancay_km,
  marketplace_visible, descripcion_publica, fuente_principal, ubigeo, servicios_principales
) VALUES (
  '10004583430', 'Contribuyente 10004583430 — OTRAS ACTIVIDADES DE TIPO SERVICIO NO CLASIFICADO PREVIAMENTE', 'ACTIVA', 'HABIDO', 'ACTIVO',
  'otros', 0.85, 'media', 45,
  true, 'OTRAS ACTIVIDADES DE TIPO SERVICIO NO CLASIFICADO PREVIAMENTE', 'padron_ruc', '230101',
  ARRAY['Servicios ZEEP', 'Otros']
) ON CONFLICT (ruc) DO UPDATE SET
  razon_social = EXCLUDED.razon_social,
  marketplace_visible = true,
  last_padron_sync = CURRENT_DATE;

INSERT INTO companies (
  ruc, razon_social, estado_sunarp, condicion_contribuyente, estado_contribuyente,
  sector_interno, trust_score, capacidad_operativa, distancia_puerto_chancay_km,
  marketplace_visible, descripcion_publica, fuente_principal, ubigeo, servicios_principales
) VALUES (
  '10004623342', 'Contribuyente 10004623342 — OTRAS ACTIVIDADES DE TIPO SERVICIO NO CLASIFICADO PREVIAMENTE', 'ACTIVA', 'HABIDO', 'ACTIVO',
  'otros', 0.57, 'media', 37,
  true, 'OTRAS ACTIVIDADES DE TIPO SERVICIO NO CLASIFICADO PREVIAMENTE', 'padron_ruc', '230107',
  ARRAY['Servicios ZEEP', 'Otros']
) ON CONFLICT (ruc) DO UPDATE SET
  razon_social = EXCLUDED.razon_social,
  marketplace_visible = true,
  last_padron_sync = CURRENT_DATE;

INSERT INTO companies (
  ruc, razon_social, estado_sunarp, condicion_contribuyente, estado_contribuyente,
  sector_interno, trust_score, capacidad_operativa, distancia_puerto_chancay_km,
  marketplace_visible, descripcion_publica, fuente_principal, ubigeo, servicios_principales
) VALUES (
  '10004697249', 'Contribuyente 10004697249 — ACTIVIDADES INMOBILIARIAS', 'ACTIVA', 'HABIDO', 'ACTIVO',
  'otros', 0.64, 'media', 24,
  true, 'ACTIVIDADES INMOBILIARIAS', 'padron_ruc', '150140',
  ARRAY['Servicios ZEEP', 'Otros']
) ON CONFLICT (ruc) DO UPDATE SET
  razon_social = EXCLUDED.razon_social,
  marketplace_visible = true,
  last_padron_sync = CURRENT_DATE;

INSERT INTO companies (
  ruc, razon_social, estado_sunarp, condicion_contribuyente, estado_contribuyente,
  sector_interno, trust_score, capacidad_operativa, distancia_puerto_chancay_km,
  marketplace_visible, descripcion_publica, fuente_principal, ubigeo, servicios_principales
) VALUES (
  '10004705004', 'Contribuyente 10004705004 — ACTIVIDADES INMOBILIARIAS', 'ACTIVA', 'HABIDO', 'ACTIVO',
  'otros', 0.59, 'media', 19,
  true, 'ACTIVIDADES INMOBILIARIAS', 'padron_ruc', '230101',
  ARRAY['Servicios ZEEP', 'Otros']
) ON CONFLICT (ruc) DO UPDATE SET
  razon_social = EXCLUDED.razon_social,
  marketplace_visible = true,
  last_padron_sync = CURRENT_DATE;

INSERT INTO companies (
  ruc, razon_social, estado_sunarp, condicion_contribuyente, estado_contribuyente,
  sector_interno, trust_score, capacidad_operativa, distancia_puerto_chancay_km,
  marketplace_visible, descripcion_publica, fuente_principal, ubigeo, servicios_principales
) VALUES (
  '10004766097', 'Contribuyente 10004766097 — ENSE�ANZA PRIMARIA', 'ACTIVA', 'HABIDO', 'ACTIVO',
  'otros', 0.72, 'media', 32,
  true, 'ENSE�ANZA PRIMARIA', 'padron_ruc', '230101',
  ARRAY['Servicios ZEEP', 'Otros']
) ON CONFLICT (ruc) DO UPDATE SET
  razon_social = EXCLUDED.razon_social,
  marketplace_visible = true,
  last_padron_sync = CURRENT_DATE;

INSERT INTO companies (
  ruc, razon_social, estado_sunarp, condicion_contribuyente, estado_contribuyente,
  sector_interno, trust_score, capacidad_operativa, distancia_puerto_chancay_km,
  marketplace_visible, descripcion_publica, fuente_principal, ubigeo, servicios_principales
) VALUES (
  '10004882402', 'Contribuyente 10004882402 — ACTIVIDADES DE ORGANIZACIONES PROFESIONALES', 'ACTIVA', 'HABIDO', 'ACTIVO',
  'otros', 0.57, 'media', 17,
  true, 'ACTIVIDADES DE ORGANIZACIONES PROFESIONALES', 'padron_ruc', '230101',
  ARRAY['Servicios ZEEP', 'Otros']
) ON CONFLICT (ruc) DO UPDATE SET
  razon_social = EXCLUDED.razon_social,
  marketplace_visible = true,
  last_padron_sync = CURRENT_DATE;

INSERT INTO companies (
  ruc, razon_social, estado_sunarp, condicion_contribuyente, estado_contribuyente,
  sector_interno, trust_score, capacidad_operativa, distancia_puerto_chancay_km,
  marketplace_visible, descripcion_publica, fuente_principal, ubigeo, servicios_principales
) VALUES (
  '10004921769', 'Contribuyente 10004921769 — ACTIVIDADES DE MEDICOS Y ODONTOLOGO', 'ACTIVA', 'HABIDO', 'ACTIVO',
  'otros', 0.84, 'media', 64,
  true, 'ACTIVIDADES DE MEDICOS Y ODONTOLOGO', 'padron_ruc', '230101',
  ARRAY['Servicios ZEEP', 'Otros']
) ON CONFLICT (ruc) DO UPDATE SET
  razon_social = EXCLUDED.razon_social,
  marketplace_visible = true,
  last_padron_sync = CURRENT_DATE;

INSERT INTO companies (
  ruc, razon_social, estado_sunarp, condicion_contribuyente, estado_contribuyente,
  sector_interno, trust_score, capacidad_operativa, distancia_puerto_chancay_km,
  marketplace_visible, descripcion_publica, fuente_principal, ubigeo, servicios_principales
) VALUES (
  '10004956511', 'Contribuyente 10004956511 — OTRAS ACTIVIDADES DE TIPO SERVICIO NO CLASIFICADO PREVIAMENTE', 'ACTIVA', 'HABIDO', 'ACTIVO',
  'otros', 0.66, 'media', 46,
  true, 'OTRAS ACTIVIDADES DE TIPO SERVICIO NO CLASIFICADO PREVIAMENTE', 'padron_ruc', '230110',
  ARRAY['Servicios ZEEP', 'Otros']
) ON CONFLICT (ruc) DO UPDATE SET
  razon_social = EXCLUDED.razon_social,
  marketplace_visible = true,
  last_padron_sync = CURRENT_DATE;

INSERT INTO companies (
  ruc, razon_social, estado_sunarp, condicion_contribuyente, estado_contribuyente,
  sector_interno, trust_score, capacidad_operativa, distancia_puerto_chancay_km,
  marketplace_visible, descripcion_publica, fuente_principal, ubigeo, servicios_principales
) VALUES (
  '10005110420', 'Contribuyente 10005110420 — OTROS TIPOS TRANSPORTE REGULADOS VIA TERRESTRE', 'ACTIVA', 'HABIDO', 'ACTIVO',
  'logistica', 0.75, 'media', 35,
  true, 'OTROS TIPOS TRANSPORTE REGULADOS VIA TERRESTRE', 'padron_ruc', '150120',
  ARRAY['Servicios ZEEP', 'Logistica']
) ON CONFLICT (ruc) DO UPDATE SET
  razon_social = EXCLUDED.razon_social,
  marketplace_visible = true,
  last_padron_sync = CURRENT_DATE;

INSERT INTO companies (
  ruc, razon_social, estado_sunarp, condicion_contribuyente, estado_contribuyente,
  sector_interno, trust_score, capacidad_operativa, distancia_puerto_chancay_km,
  marketplace_visible, descripcion_publica, fuente_principal, ubigeo, servicios_principales
) VALUES (
  '10008011074', 'Contribuyente 10008011074 — OTRAS ACTIVIDADES DE TIPO SERVICIO NO CLASIFICADO PREVIAMENTE', 'ACTIVA', 'HABIDO', 'ACTIVO',
  'otros', 0.89, 'media', 89,
  true, 'OTRAS ACTIVIDADES DE TIPO SERVICIO NO CLASIFICADO PREVIAMENTE', 'padron_ruc', '220101',
  ARRAY['Servicios ZEEP', 'Otros']
) ON CONFLICT (ruc) DO UPDATE SET
  razon_social = EXCLUDED.razon_social,
  marketplace_visible = true,
  last_padron_sync = CURRENT_DATE;

INSERT INTO companies (
  ruc, razon_social, estado_sunarp, condicion_contribuyente, estado_contribuyente,
  sector_interno, trust_score, capacidad_operativa, distancia_puerto_chancay_km,
  marketplace_visible, descripcion_publica, fuente_principal, ubigeo, servicios_principales
) VALUES (
  '10008013646', 'Contribuyente 10008013646 — ACTIVIDADES INMOBILIARIAS', 'ACTIVA', 'HABIDO', 'ACTIVO',
  'otros', 0.61, 'media', 21,
  true, 'ACTIVIDADES INMOBILIARIAS', 'padron_ruc', '220101',
  ARRAY['Servicios ZEEP', 'Otros']
) ON CONFLICT (ruc) DO UPDATE SET
  razon_social = EXCLUDED.razon_social,
  marketplace_visible = true,
  last_padron_sync = CURRENT_DATE;

INSERT INTO companies (
  ruc, razon_social, estado_sunarp, condicion_contribuyente, estado_contribuyente,
  sector_interno, trust_score, capacidad_operativa, distancia_puerto_chancay_km,
  marketplace_visible, descripcion_publica, fuente_principal, ubigeo, servicios_principales
) VALUES (
  '10008025652', 'Contribuyente 10008025652 — ACTIVIDADES INMOBILIARIAS', 'ACTIVA', 'HABIDO', 'ACTIVO',
  'otros', 0.67, 'media', 27,
  true, 'ACTIVIDADES INMOBILIARIAS', 'padron_ruc', '220101',
  ARRAY['Servicios ZEEP', 'Otros']
) ON CONFLICT (ruc) DO UPDATE SET
  razon_social = EXCLUDED.razon_social,
  marketplace_visible = true,
  last_padron_sync = CURRENT_DATE;

INSERT INTO companies (
  ruc, razon_social, estado_sunarp, condicion_contribuyente, estado_contribuyente,
  sector_interno, trust_score, capacidad_operativa, distancia_puerto_chancay_km,
  marketplace_visible, descripcion_publica, fuente_principal, ubigeo, servicios_principales
) VALUES (
  '10008126131', 'Contribuyente 10008126131 — ACTIVIDADES INMOBILIARIAS', 'ACTIVA', 'HABIDO', 'ACTIVO',
  'otros', 0.86, 'media', 66,
  true, 'ACTIVIDADES INMOBILIARIAS', 'padron_ruc', '220105',
  ARRAY['Servicios ZEEP', 'Otros']
) ON CONFLICT (ruc) DO UPDATE SET
  razon_social = EXCLUDED.razon_social,
  marketplace_visible = true,
  last_padron_sync = CURRENT_DATE;

INSERT INTO companies (
  ruc, razon_social, estado_sunarp, condicion_contribuyente, estado_contribuyente,
  sector_interno, trust_score, capacidad_operativa, distancia_puerto_chancay_km,
  marketplace_visible, descripcion_publica, fuente_principal, ubigeo, servicios_principales
) VALUES (
  '10008134443', 'Contribuyente 10008134443 — OTRAS ACTIVIDADES DE TIPO SERVICIO NO CLASIFICADO PREVIAMENTE', 'ACTIVA', 'HABIDO', 'ACTIVO',
  'otros', 0.58, 'media', 58,
  true, 'OTRAS ACTIVIDADES DE TIPO SERVICIO NO CLASIFICADO PREVIAMENTE', 'padron_ruc', '220105',
  ARRAY['Servicios ZEEP', 'Otros']
) ON CONFLICT (ruc) DO UPDATE SET
  razon_social = EXCLUDED.razon_social,
  marketplace_visible = true,
  last_padron_sync = CURRENT_DATE;

INSERT INTO companies (
  ruc, razon_social, estado_sunarp, condicion_contribuyente, estado_contribuyente,
  sector_interno, trust_score, capacidad_operativa, distancia_puerto_chancay_km,
  marketplace_visible, descripcion_publica, fuente_principal, ubigeo, servicios_principales
) VALUES (
  '10008202082', 'Contribuyente 10008202082 — PUBLICIDAD', 'ACTIVA', 'HABIDO', 'ACTIVO',
  'otros', 0.57, 'media', 17,
  true, 'PUBLICIDAD', 'padron_ruc', '220101',
  ARRAY['Servicios ZEEP', 'Otros']
) ON CONFLICT (ruc) DO UPDATE SET
  razon_social = EXCLUDED.razon_social,
  marketplace_visible = true,
  last_padron_sync = CURRENT_DATE;

INSERT INTO companies (
  ruc, razon_social, estado_sunarp, condicion_contribuyente, estado_contribuyente,
  sector_interno, trust_score, capacidad_operativa, distancia_puerto_chancay_km,
  marketplace_visible, descripcion_publica, fuente_principal, ubigeo, servicios_principales
) VALUES (
  '10008245806', 'Contribuyente 10008245806 — OTRAS ACTIVIDADES DE TIPO SERVICIO NO CLASIFICADO PREVIAMENTE', 'ACTIVA', 'HABIDO', 'ACTIVO',
  'otros', 0.61, 'media', 21,
  true, 'OTRAS ACTIVIDADES DE TIPO SERVICIO NO CLASIFICADO PREVIAMENTE', 'padron_ruc', '220106',
  ARRAY['Servicios ZEEP', 'Otros']
) ON CONFLICT (ruc) DO UPDATE SET
  razon_social = EXCLUDED.razon_social,
  marketplace_visible = true,
  last_padron_sync = CURRENT_DATE;

INSERT INTO companies (
  ruc, razon_social, estado_sunarp, condicion_contribuyente, estado_contribuyente,
  sector_interno, trust_score, capacidad_operativa, distancia_puerto_chancay_km,
  marketplace_visible, descripcion_publica, fuente_principal, ubigeo, servicios_principales
) VALUES (
  '10008332806', 'Contribuyente 10008332806 — ACTIVIDADES INMOBILIARIAS', 'ACTIVA', 'HABIDO', 'ACTIVO',
  'otros', 0.61, 'media', 21,
  true, 'ACTIVIDADES INMOBILIARIAS', 'padron_ruc', '220101',
  ARRAY['Servicios ZEEP', 'Otros']
) ON CONFLICT (ruc) DO UPDATE SET
  razon_social = EXCLUDED.razon_social,
  marketplace_visible = true,
  last_padron_sync = CURRENT_DATE;

INSERT INTO companies (
  ruc, razon_social, estado_sunarp, condicion_contribuyente, estado_contribuyente,
  sector_interno, trust_score, capacidad_operativa, distancia_puerto_chancay_km,
  marketplace_visible, descripcion_publica, fuente_principal, ubigeo, servicios_principales
) VALUES (
  '10008423062', 'Contribuyente 10008423062 — OTRAS ACTIVIDADES DE TIPO SERVICIO NO CLASIFICADO PREVIAMENTE', 'ACTIVA', 'HABIDO', 'ACTIVO',
  'otros', 0.77, 'media', 77,
  true, 'OTRAS ACTIVIDADES DE TIPO SERVICIO NO CLASIFICADO PREVIAMENTE', 'padron_ruc', '220401',
  ARRAY['Servicios ZEEP', 'Otros']
) ON CONFLICT (ruc) DO UPDATE SET
  razon_social = EXCLUDED.razon_social,
  marketplace_visible = true,
  last_padron_sync = CURRENT_DATE;

INSERT INTO companies (
  ruc, razon_social, estado_sunarp, condicion_contribuyente, estado_contribuyente,
  sector_interno, trust_score, capacidad_operativa, distancia_puerto_chancay_km,
  marketplace_visible, descripcion_publica, fuente_principal, ubigeo, servicios_principales
) VALUES (
  '10008505174', 'Contribuyente 10008505174 — ACTIVIDADES INMOBILIARIAS', 'ACTIVA', 'HABIDO', 'ACTIVO',
  'otros', 0.89, 'media', 29,
  true, 'ACTIVIDADES INMOBILIARIAS', 'padron_ruc', '130105',
  ARRAY['Servicios ZEEP', 'Otros']
) ON CONFLICT (ruc) DO UPDATE SET
  razon_social = EXCLUDED.razon_social,
  marketplace_visible = true,
  last_padron_sync = CURRENT_DATE;

INSERT INTO companies (
  ruc, razon_social, estado_sunarp, condicion_contribuyente, estado_contribuyente,
  sector_interno, trust_score, capacidad_operativa, distancia_puerto_chancay_km,
  marketplace_visible, descripcion_publica, fuente_principal, ubigeo, servicios_principales
) VALUES (
  '10008604130', 'Contribuyente 10008604130 — ACTIVIDADES INMOBILIARIAS', 'ACTIVA', 'HABIDO', 'ACTIVO',
  'otros', 0.85, 'media', 65,
  true, 'ACTIVIDADES INMOBILIARIAS', 'padron_ruc', '220101',
  ARRAY['Servicios ZEEP', 'Otros']
) ON CONFLICT (ruc) DO UPDATE SET
  razon_social = EXCLUDED.razon_social,
  marketplace_visible = true,
  last_padron_sync = CURRENT_DATE;

INSERT INTO companies (
  ruc, razon_social, estado_sunarp, condicion_contribuyente, estado_contribuyente,
  sector_interno, trust_score, capacidad_operativa, distancia_puerto_chancay_km,
  marketplace_visible, descripcion_publica, fuente_principal, ubigeo, servicios_principales
) VALUES (
  '10009182077', 'Contribuyente 10009182077 — ACTIVIDADES INMOBILIARIAS', 'ACTIVA', 'HABIDO', 'ACTIVO',
  'otros', 0.92, 'media', 92,
  true, 'ACTIVIDADES INMOBILIARIAS', 'padron_ruc', '220301',
  ARRAY['Servicios ZEEP', 'Otros']
) ON CONFLICT (ruc) DO UPDATE SET
  razon_social = EXCLUDED.razon_social,
  marketplace_visible = true,
  last_padron_sync = CURRENT_DATE;

INSERT INTO companies (
  ruc, razon_social, estado_sunarp, condicion_contribuyente, estado_contribuyente,
  sector_interno, trust_score, capacidad_operativa, distancia_puerto_chancay_km,
  marketplace_visible, descripcion_publica, fuente_principal, ubigeo, servicios_principales
) VALUES (
  '10009752621', 'Contribuyente 10009752621 — OTRAS ACTIVIDADES DE TIPO SERVICIO NO CLASIFICADO PREVIAMENTE', 'ACTIVA', 'HABIDO', 'ACTIVO',
  'otros', 0.76, 'media', 76,
  true, 'OTRAS ACTIVIDADES DE TIPO SERVICIO NO CLASIFICADO PREVIAMENTE', 'padron_ruc', '150136',
  ARRAY['Servicios ZEEP', 'Otros']
) ON CONFLICT (ruc) DO UPDATE SET
  razon_social = EXCLUDED.razon_social,
  marketplace_visible = true,
  last_padron_sync = CURRENT_DATE;



INSERT INTO users (id, email, hashed_password, role, full_name, is_active, is_verified, preferred_lang)
VALUES (
  '59f57ea0-31ee-4e31-823e-58467625c7b7', 'inversor@hubchancay.pe', '$2b$12$33yK5DR2.4l4i21.3EAQg.W0FDPp8fjzBmG3/w0Jnz5CkepRFzxOu', 'inversor',
  'Inversor Demo ZEEP', true, true, 'es'
) ON CONFLICT (email) DO UPDATE SET is_verified = true, is_active = true;

-- Login demo: inversor@hubchancay.pe / HubChancay2025!



COMMIT;

-- Ingenieros: 10 | Abogados: 10 | Empresas: 50