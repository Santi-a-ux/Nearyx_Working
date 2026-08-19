-- Seed de 5 tutores expertos con ubicación geográfica.
-- Ejecuta después del schema principal.

INSERT INTO users.profiles (id, user_id, display_name, bio, avatar_url, location_name, created_at, updated_at)
VALUES
  ('11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', 'Camila Ríos', 'Estudiante de diseño y branding.', 'https://randomuser.me/api/portraits/women/21.jpg', 'Medellín, Antioquia', NOW(), NOW()),
  ('22222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222', 'Andrés Gómez', 'Usuario interesado en tecnología y productividad.', 'https://randomuser.me/api/portraits/men/22.jpg', 'Medellín, Antioquia', NOW(), NOW()),
  ('33333333-3333-4333-8333-333333333333', '33333333-3333-4333-8333-333333333333', 'Laura Martínez', 'Le gusta aprender idiomas y matemáticas.', 'https://randomuser.me/api/portraits/women/23.jpg', 'Medellín, Antioquia', NOW(), NOW()),
  ('44444444-4444-4444-8444-444444444444', '44444444-4444-4444-8444-444444444444', 'Felipe Uribe', 'Padre de familia que busca apoyo para sus hijos.', 'https://randomuser.me/api/portraits/men/24.jpg', 'Medellín, Antioquia', NOW(), NOW()),
  ('55555555-5555-4555-8555-555555555555', '55555555-5555-4555-8555-555555555555', 'Sofía Herrera', 'Interesada en arte, fotografía y bienestar.', 'https://randomuser.me/api/portraits/women/25.jpg', 'Medellín, Antioquia', NOW(), NOW()),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Daniel Rojas', 'Ingeniero de software y tutor de programación.', 'https://randomuser.me/api/portraits/men/31.jpg', 'Medellín, Antioquia', NOW(), NOW()),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Mariana Torres', 'Tutora de inglés y comunicación escrita.', 'https://randomuser.me/api/portraits/women/32.jpg', 'Medellín, Antioquia', NOW(), NOW()),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'Julián Castaño', 'Músico y profesor de guitarra.', 'https://randomuser.me/api/portraits/men/33.jpg', 'Medellín, Antioquia', NOW(), NOW()),
  ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Valentina Pineda', 'Experta en cocina y repostería.', 'https://randomuser.me/api/portraits/women/34.jpg', 'Medellín, Antioquia', NOW(), NOW()),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'Santiago Mejía', 'Fotógrafo y editor de imagen.', 'https://randomuser.me/api/portraits/men/35.jpg', 'Medellín, Antioquia', NOW(), NOW())
ON CONFLICT (user_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  bio = EXCLUDED.bio,
  avatar_url = EXCLUDED.avatar_url,
  location_name = EXCLUDED.location_name,
  updated_at = NOW();

INSERT INTO tutors.profiles (
  id, user_id, specialties, categories, is_available,
  hourly_rate, years_experience, verification_status,
  coordinates, preferred_payment_method, created_at, updated_at
)
VALUES
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', ARRAY['Python', 'JavaScript', 'Bases de Datos'], ARRAY['Programación', 'Tecnología'], TRUE, 70000, 9, 'verified', ST_SetSRID(ST_MakePoint(-75.5630, 6.2517), 4326), 'nequi', NOW(), NOW()),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', ARRAY['Inglés', 'Redacción', 'Conversación'], ARRAY['Idiomas', 'Educación'], TRUE, 50000, 6, 'verified', ST_SetSRID(ST_MakePoint(-75.5678, 6.2482), 4326), 'daviplata', NOW(), NOW()),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', ARRAY['Guitarra', 'Teoría Musical', 'Composición'], ARRAY['Música', 'Arte'], TRUE, 45000, 10, 'verified', ST_SetSRID(ST_MakePoint(-75.5705, 6.2552), 4326), 'bancolombia', NOW(), NOW()),
  ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', ARRAY['Cocina Colombiana', 'Repostería', 'Panadería'], ARRAY['Gastronomía', 'Bienestar'], TRUE, 55000, 8, 'verified', ST_SetSRID(ST_MakePoint(-75.5775, 6.2428), 4326), 'nequi', NOW(), NOW()),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', ARRAY['Fotografía Digital', 'Edición de Imagen', 'Composición'], ARRAY['Arte', 'Tecnología'], TRUE, 60000, 7, 'verified', ST_SetSRID(ST_MakePoint(-75.5810, 6.2580), 4326), 'transferencia', NOW(), NOW())
ON CONFLICT (user_id) DO UPDATE SET
  specialties = EXCLUDED.specialties,
  categories = EXCLUDED.categories,
  is_available = EXCLUDED.is_available,
  hourly_rate = EXCLUDED.hourly_rate,
  years_experience = EXCLUDED.years_experience,
  verification_status = EXCLUDED.verification_status,
  coordinates = EXCLUDED.coordinates,
  preferred_payment_method = EXCLUDED.preferred_payment_method,
  updated_at = NOW();

SELECT count(*) AS tutor_count FROM tutors.profiles;
SELECT user_id, display_name, ST_X(coordinates) AS lon, ST_Y(coordinates) AS lat FROM tutors.profiles WHERE user_id::text IN (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'
) ORDER BY user_id;
