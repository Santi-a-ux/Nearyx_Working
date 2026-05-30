-- Single seed file for the 5 real tutors.
-- Idempotent: can be executed more than once without duplicating records.

CREATE TABLE IF NOT EXISTS "users".profiles (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  bio TEXT,
  avatar_url VARCHAR(500),
  location_name VARCHAR(200),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "tutors".profiles (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  specialties TEXT[],
  categories TEXT[],
  is_available BOOLEAN DEFAULT TRUE,
  hourly_rate NUMERIC(10, 2),
  years_experience INTEGER,
  verification_status VARCHAR(20) DEFAULT 'pending',
  coordinates geometry(POINT, 4326),
  preferred_payment_method VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO "users".profiles (id, user_id, display_name, bio, avatar_url, location_name, created_at, updated_at)
VALUES
  (
    'c1b7f33a-2b9c-4c9e-8f70-111111111111',
    'c1b7f33a-2b9c-4c9e-8f70-111111111111',
    'David Ramírez López',
    'Tutor de programación con enfoque práctico en Python, Django y FastAPI.',
    'https://randomuser.me/api/portraits/men/32.jpg',
    'Medellín, Antioquia',
    NOW(),
    NOW()
  ),
  (
    'c1b7f33a-2b9c-4c9e-8f70-222222222222',
    'c1b7f33a-2b9c-4c9e-8f70-222222222222',
    'Isabella García Martínez',
    'Tutora de cocina colombiana, repostería y técnica culinaria.',
    'https://randomuser.me/api/portraits/women/44.jpg',
    'Medellín, Antioquia',
    NOW(),
    NOW()
  ),
  (
    'c1b7f33a-2b9c-4c9e-8f70-333333333333',
    'c1b7f33a-2b9c-4c9e-8f70-333333333333',
    'Carlos Enrique Vega',
    'Tutor de guitarra, teoría musical y composición.',
    'https://randomuser.me/api/portraits/men/65.jpg',
    'Medellín, Antioquia',
    NOW(),
    NOW()
  ),
  (
    'c1b7f33a-2b9c-4c9e-8f70-444444444444',
    'c1b7f33a-2b9c-4c9e-8f70-444444444444',
    'Martina Rodríguez Acevedo',
    'Tutora de bienestar con enfoque en yoga, meditación y pilates.',
    'https://randomuser.me/api/portraits/women/68.jpg',
    'Medellín, Antioquia',
    NOW(),
    NOW()
  ),
  (
    '550e8400-e29b-41d4-a716-446655440005',
    '550e8400-e29b-41d4-a716-446655440005',
    'Sebastián Morales Londoño',
    'Tutor de fotografía digital, edición de imágenes y composición.',
    'https://randomuser.me/api/portraits/men/75.jpg',
    'Medellín, Antioquia',
    NOW(),
    NOW()
  )
ON CONFLICT (user_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  bio = EXCLUDED.bio,
  avatar_url = EXCLUDED.avatar_url,
  location_name = EXCLUDED.location_name,
  updated_at = NOW();

INSERT INTO "tutors".profiles (
  id, user_id, specialties, categories, is_available,
  hourly_rate, years_experience, verification_status,
  coordinates, created_at, updated_at
)
VALUES
  (
    'c1b7f33a-2b9c-4c9e-8f70-111111111111',
    'c1b7f33a-2b9c-4c9e-8f70-111111111111',
    ARRAY['Python', 'Django', 'FastAPI', 'Bases de Datos'],
    ARRAY['Programación', 'Profesional'],
    TRUE,
    60000,
    8,
    'verified',
    ST_SetSRID(ST_MakePoint(-75.5161, 5.0688), 4326),
    NOW(),
    NOW()
  ),
  (
    'c1b7f33a-2b9c-4c9e-8f70-222222222222',
    'c1b7f33a-2b9c-4c9e-8f70-222222222222',
    ARRAY['Cocina Colombiana', 'Repostería', 'Técnica Culinaria', 'Nutrición'],
    ARRAY['Gastronomía', 'Profesional'],
    TRUE,
    55000,
    12,
    'verified',
    ST_SetSRID(ST_MakePoint(-75.5200, 5.0700), 4326),
    NOW(),
    NOW()
  ),
  (
    'c1b7f33a-2b9c-4c9e-8f70-333333333333',
    'c1b7f33a-2b9c-4c9e-8f70-333333333333',
    ARRAY['Guitarra', 'Teoría Musical', 'Composición', 'Música Popular'],
    ARRAY['Arte', 'Ocio'],
    TRUE,
    45000,
    15,
    'verified',
    ST_SetSRID(ST_MakePoint(-75.5180, 5.0720), 4326),
    NOW(),
    NOW()
  ),
  (
    'c1b7f33a-2b9c-4c9e-8f70-444444444444',
    'c1b7f33a-2b9c-4c9e-8f70-444444444444',
    ARRAY['Yoga', 'Meditación', 'Bienestar Mental', 'Pilates'],
    ARRAY['Salud', 'Bienestar'],
    TRUE,
    40000,
    6,
    'verified',
    ST_SetSRID(ST_MakePoint(-75.5140, 5.0680), 4326),
    NOW(),
    NOW()
  ),
  (
    '550e8400-e29b-41d4-a716-446655440005',
    '550e8400-e29b-41d4-a716-446655440005',
    ARRAY['Fotografía Digital', 'Edición de Imágenes', 'Composición', 'Iluminación'],
    ARRAY['Arte', 'Profesional'],
    TRUE,
    50000,
    7,
    'verified',
    ST_SetSRID(ST_MakePoint(-75.5220, 5.0650), 4326),
    NOW(),
    NOW()
  )
ON CONFLICT (user_id) DO UPDATE SET
  specialties = EXCLUDED.specialties,
  categories = EXCLUDED.categories,
  is_available = EXCLUDED.is_available,
  hourly_rate = EXCLUDED.hourly_rate,
  years_experience = EXCLUDED.years_experience,
  verification_status = EXCLUDED.verification_status,
  coordinates = EXCLUDED.coordinates,
  updated_at = NOW();

DO $$
BEGIN
  RAISE NOTICE '✅ 5 real tutors seeded successfully';
END $$;
