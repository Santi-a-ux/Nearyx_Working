from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.database import engine, Base
import app.models  # noqa: F401
from app.routes import router

app = FastAPI(title="TTP Tutor Service", version="1.0.0")

REAL_TUTORS = [
    {
        "user_id": "c1b7f33a-2b9c-4c9e-8f70-111111111111",
        "display_name": "David Ramírez López",
        "bio": "Tutor de programación con enfoque práctico en Python, Django y FastAPI.",
        "avatar_url": "https://randomuser.me/api/portraits/men/32.jpg",
        "location_name": "Medellín, Antioquia",
        "specialties": ["Python", "Django", "FastAPI", "Bases de Datos"],
        "categories": ["Programación", "Profesional"],
        "hourly_rate": 60000,
        "years_experience": 8,
        "lat": 5.0688,
        "lng": -75.5161,
    },
    {
        "user_id": "c1b7f33a-2b9c-4c9e-8f70-222222222222",
        "display_name": "Isabella García Martínez",
        "bio": "Tutora de cocina colombiana, repostería y técnica culinaria.",
        "avatar_url": "https://randomuser.me/api/portraits/women/44.jpg",
        "location_name": "Medellín, Antioquia",
        "specialties": ["Cocina Colombiana", "Repostería", "Técnica Culinaria", "Nutrición"],
        "categories": ["Gastronomía", "Profesional"],
        "hourly_rate": 55000,
        "years_experience": 12,
        "lat": 5.0700,
        "lng": -75.5200,
    },
    {
        "user_id": "c1b7f33a-2b9c-4c9e-8f70-333333333333",
        "display_name": "Carlos Enrique Vega",
        "bio": "Tutor de guitarra, teoría musical y composición.",
        "avatar_url": "https://randomuser.me/api/portraits/men/65.jpg",
        "location_name": "Medellín, Antioquia",
        "specialties": ["Guitarra", "Teoría Musical", "Composición", "Música Popular"],
        "categories": ["Arte", "Ocio"],
        "hourly_rate": 45000,
        "years_experience": 15,
        "lat": 5.0720,
        "lng": -75.5180,
    },
    {
        "user_id": "c1b7f33a-2b9c-4c9e-8f70-444444444444",
        "display_name": "Martina Rodríguez Acevedo",
        "bio": "Tutora de bienestar con enfoque en yoga, meditación y pilates.",
        "avatar_url": "https://randomuser.me/api/portraits/women/68.jpg",
        "location_name": "Medellín, Antioquia",
        "specialties": ["Yoga", "Meditación", "Bienestar Mental", "Pilates"],
        "categories": ["Salud", "Bienestar"],
        "hourly_rate": 40000,
        "years_experience": 6,
        "lat": 5.0680,
        "lng": -75.5140,
    },
    {
        "user_id": "550e8400-e29b-41d4-a716-446655440005",
        "display_name": "Sebastián Morales Londoño",
        "bio": "Tutor de fotografía digital, edición de imágenes y composición.",
        "avatar_url": "https://randomuser.me/api/portraits/men/75.jpg",
        "location_name": "Medellín, Antioquia",
        "specialties": ["Fotografía Digital", "Edición de Imágenes", "Composición", "Iluminación"],
        "categories": ["Arte", "Profesional"],
        "hourly_rate": 50000,
        "years_experience": 7,
        "lat": 5.0650,
        "lng": -75.5220,
    },
]


async def ensure_schema_ready() -> None:
    async with engine.begin() as conn:
                await conn.execute(text('''
                        CREATE TABLE IF NOT EXISTS "users".profiles (
                            id UUID PRIMARY KEY,
                            user_id UUID NOT NULL UNIQUE,
                            display_name VARCHAR(100) NOT NULL,
                            bio TEXT,
                            avatar_url VARCHAR(500),
                            location_name VARCHAR(200),
                            created_at TIMESTAMPTZ DEFAULT NOW(),
                            updated_at TIMESTAMPTZ DEFAULT NOW()
                        )
                '''))

                await conn.execute(text('''
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
                        )
                '''))


async def seed_real_tutors_if_needed() -> None:
    async with engine.begin() as conn:
        result = await conn.execute(text('SELECT COUNT(*) FROM "tutors".profiles'))
        tutor_count = result.scalar() or 0
        if tutor_count > 0:
            return

        for tutor in REAL_TUTORS:
            await conn.execute(
                text(
                    '''
                    INSERT INTO "users".profiles (id, user_id, display_name, bio, avatar_url, location_name, created_at, updated_at)
                    VALUES (
                      :user_id,
                      :user_id,
                      :display_name,
                      :bio,
                      :avatar_url,
                      :location_name,
                      NOW(),
                      NOW()
                    )
                    ON CONFLICT (user_id) DO UPDATE SET
                      display_name = EXCLUDED.display_name,
                      bio = EXCLUDED.bio,
                      avatar_url = EXCLUDED.avatar_url,
                      location_name = EXCLUDED.location_name,
                      updated_at = NOW()
                    '''
                ),
                tutor,
            )

            await conn.execute(
                text(
                    '''
                    INSERT INTO "tutors".profiles (
                      id, user_id, specialties, categories, is_available,
                      hourly_rate, years_experience, verification_status,
                      coordinates, created_at, updated_at
                    )
                    VALUES (
                      :user_id,
                      :user_id,
                      :specialties,
                      :categories,
                      TRUE,
                      :hourly_rate,
                      :years_experience,
                      'verified',
                      ST_SetSRID(ST_MakePoint(:lng, :lat), 4326),
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
                      updated_at = NOW()
                    '''
                ),
                tutor,
            )

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/tutors")


@app.on_event("startup")
async def startup() -> None:
    await ensure_schema_ready()
    await seed_real_tutors_if_needed()

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "tutor-service"}