-- Datos de prueba: trabajadores ficticios repartidos en distintos departamentos,
-- con reseñas para poder ver el listado y los perfiles funcionando.
-- Se puede correr más de una vez sin duplicar datos (usa ids fijos + on conflict).

create extension if not exists pgcrypto;

-- 1) Usuarios de auth (requerido por la FK profiles.id -> auth.users.id)
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
values
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'juan.electricista.seed@tuchanga.uy', crypt('Seed12345!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'lucia.plomera.seed@tuchanga.uy',    crypt('Seed12345!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'martin.jardinero.seed@tuchanga.uy', crypt('Seed12345!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'rosa.limpieza.seed@tuchanga.uy',    crypt('Seed12345!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000005', 'authenticated', 'authenticated', 'diego.pintor.seed@tuchanga.uy',     crypt('Seed12345!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000006', 'authenticated', 'authenticated', 'pablo.gasista.seed@tuchanga.uy',    crypt('Seed12345!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000007', 'authenticated', 'authenticated', 'carlos.cerrajero.seed@tuchanga.uy', crypt('Seed12345!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000008', 'authenticated', 'authenticated', 'ana.mudanzas.seed@tuchanga.uy',     crypt('Seed12345!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, '', '', '', '')
on conflict (id) do nothing;

-- 2) Perfiles de trabajador (4 en Montevideo con coordenadas distintas para
--    probar el orden por cercanía, y uno en cada uno de otros 4 departamentos)
insert into public.profiles (
  id, tipo_usuario, nombre, telefono, barrio, rubro, descripcion, precio_orientativo,
  foto_url, es_premium, departamento, lat, lng
)
values
  ('00000000-0000-0000-0000-000000000001', 'trabajador', 'Juan Fernández', '099111001', 'Centro', 'electricista',
   'Electricista matriculado, más de 10 años de experiencia. Instalaciones, tableros y arreglos urgentes.', 800,
   'https://i.pravatar.cc/300?img=12', true, 'Montevideo', -34.9011, -56.1645),

  ('00000000-0000-0000-0000-000000000002', 'trabajador', 'Lucía Gómez', '099111002', 'Pocitos', 'plomero',
   'Plomera y sanitaria. Destapes, pérdidas de agua y arreglos de baño y cocina.', 750,
   'https://i.pravatar.cc/300?img=32', false, 'Montevideo', -34.9122, -56.1467),

  ('00000000-0000-0000-0000-000000000004', 'trabajador', 'Rosa Ibáñez', '099111004', 'Cordón', 'limpieza',
   'Limpieza de hogares y oficinas. Trabajo por hora o por trabajo cerrado.', 400,
   'https://i.pravatar.cc/300?img=45', false, 'Montevideo', -34.9070, -56.1780),

  ('00000000-0000-0000-0000-000000000006', 'trabajador', 'Pablo Núñez', '099111006', 'Malvín', 'gasista',
   'Gasista matriculado. Instalación y habilitación de artefactos a gas.', 900,
   'https://i.pravatar.cc/300?img=51', true, 'Montevideo', -34.8958, -56.1287),

  ('00000000-0000-0000-0000-000000000003', 'trabajador', 'Martín Silva', '099111003', 'Ciudad de la Costa', 'jardineria',
   'Corte de pasto, poda y mantenimiento de jardines. Presupuesto sin cargo.', 600,
   'https://i.pravatar.cc/300?img=13', false, 'Canelones', -34.7833, -55.9500),

  ('00000000-0000-0000-0000-000000000005', 'trabajador', 'Diego Acosta', '099111005', 'Centro', 'pintura',
   'Pintura de interiores y exteriores, obra nueva y reciclaje.', 700,
   'https://i.pravatar.cc/300?img=14', false, 'Maldonado', -34.9011, -54.9578),

  ('00000000-0000-0000-0000-000000000007', 'trabajador', 'Carlos Rodríguez', '099111007', 'Centro', 'cerrajero',
   'Cerrajería en general, apertura de puertas y cambio de cerraduras las 24hs.', 650,
   'https://i.pravatar.cc/300?img=15', false, 'Salto', -31.3833, -57.9667),

  ('00000000-0000-0000-0000-000000000008', 'trabajador', 'Ana Martínez', '099111008', 'Centro', 'mudanzas',
   'Mudanzas y fletes dentro y fuera de Montevideo. Contamos con camión propio.', 1200,
   'https://i.pravatar.cc/300?img=47', true, 'Colonia', -34.4722, -57.8433)
on conflict (id) do nothing;

-- 3) Reseñas / historial de trabajos de cada trabajador
insert into public.resenas (id, trabajador_id, cliente_nombre, trabajo_descripcion, calificacion, comentario, created_at)
values
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', 'Marcela Suárez', 'Cambio de tablero eléctrico', 5, 'Excelente trabajo, muy prolijo y puntual.', now() - interval '20 days'),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000001', 'Federico Castro', 'Instalación de luces de jardín', 4, 'Buen trabajo, tardó un poco más de lo esperado.', now() - interval '10 days'),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000001', 'Valentina Pérez', 'Arreglo de cortocircuito', 5, 'Vino el mismo día, muy recomendable.', now() - interval '3 days'),

  ('00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000002', 'Nicolás Bravo', 'Destape de cañería', 5, 'Solucionó el problema rápido y explicó todo.', now() - interval '15 days'),
  ('00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000002', 'Carolina Díaz', 'Cambio de grifería de baño', 4, 'Buen trabajo, precio justo.', now() - interval '6 days'),

  ('00000000-0000-0000-0000-000000000106', '00000000-0000-0000-0000-000000000003', 'Andrés Fleitas', 'Corte de pasto mensual', 5, 'Muy cumplidor, viene todos los meses sin falta.', now() - interval '25 days'),
  ('00000000-0000-0000-0000-000000000107', '00000000-0000-0000-0000-000000000003', 'Sofía Rodríguez', 'Poda de árboles', 4, 'Buen trabajo, dejó todo limpio.', now() - interval '8 days'),

  ('00000000-0000-0000-0000-000000000108', '00000000-0000-0000-0000-000000000004', 'Gonzalo Techera', 'Limpieza profunda de apartamento', 5, 'Impecable, quedó todo reluciente.', now() - interval '12 days'),
  ('00000000-0000-0000-0000-000000000109', '00000000-0000-0000-0000-000000000004', 'Patricia Olivera', 'Limpieza post obra', 3, 'Bien, pero faltó terminar algunos detalles.', now() - interval '4 days'),

  ('00000000-0000-0000-0000-000000000110', '00000000-0000-0000-0000-000000000005', 'Ramiro Vidal', 'Pintura de living y dormitorio', 5, 'Excelente terminación, muy prolijo.', now() - interval '18 days'),
  ('00000000-0000-0000-0000-000000000111', '00000000-0000-0000-0000-000000000005', 'Belén Machado', 'Pintura de fachada', 4, 'Buen resultado, cumplió los tiempos.', now() - interval '5 days'),

  ('00000000-0000-0000-0000-000000000112', '00000000-0000-0000-0000-000000000006', 'Ignacio Correa', 'Instalación de calefón', 5, 'Muy profesional, dejó todo funcionando perfecto.', now() - interval '22 days'),
  ('00000000-0000-0000-0000-000000000113', '00000000-0000-0000-0000-000000000006', 'Daniela Ferreira', 'Habilitación de cocina a gas', 5, 'Excelente, muy prolijo con el papeleo también.', now() - interval '9 days'),

  ('00000000-0000-0000-0000-000000000114', '00000000-0000-0000-0000-000000000007', 'Emiliano Rossi', 'Apertura de puerta trabada', 4, 'Vino rápido y solucionó el problema.', now() - interval '14 days'),
  ('00000000-0000-0000-0000-000000000115', '00000000-0000-0000-0000-000000000007', 'Cecilia Bentancor', 'Cambio de cerradura', 5, 'Muy buen trabajo y buen precio.', now() - interval '2 days'),

  ('00000000-0000-0000-0000-000000000116', '00000000-0000-0000-0000-000000000008', 'Rodrigo Larrosa', 'Mudanza de apartamento 2 dormitorios', 5, 'Cuidaron todos los muebles, muy recomendable.', now() - interval '30 days'),
  ('00000000-0000-0000-0000-000000000117', '00000000-0000-0000-0000-000000000008', 'Lorena Aguirre', 'Flete de mueblería', 4, 'Buen servicio, llegaron un poco tarde.', now() - interval '7 days')
on conflict (id) do nothing;
