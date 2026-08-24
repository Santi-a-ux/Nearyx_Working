from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.database import Base, engine
import app.models  # noqa: F401
from app.routes import router

app = FastAPI(title="TTP Tutor Service", version="1.0.0")


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

        await conn.execute(text('''
            CREATE TABLE IF NOT EXISTS "tutors".ratings (
                id UUID PRIMARY KEY,
                tutor_user_id UUID NOT NULL REFERENCES "tutors".profiles(user_id) ON DELETE CASCADE,
                rater_user_id UUID NOT NULL,
                rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
                comment VARCHAR(500),
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW(),
                CONSTRAINT uq_tutor_rater UNIQUE (tutor_user_id, rater_user_id)
            )
        '''))
        
        await conn.execute(text('''
            ALTER TABLE "tutors".ratings
            ADD COLUMN IF NOT EXISTS comment VARCHAR(500)
        '''))

        await conn.execute(text('''
            CREATE TABLE IF NOT EXISTS "tutors".verification_requests (
                id UUID PRIMARY KEY,
                user_id UUID NOT NULL,
                status VARCHAR(20) NOT NULL DEFAULT 'pending',
                summary TEXT,
                education JSONB,
                certifications JSONB,
                experience JSONB,
                skills TEXT[],
                review_notes TEXT,
                reviewed_by UUID,
                reviewed_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        '''))

        await conn.execute(text('''
            CREATE INDEX IF NOT EXISTS ix_verification_requests_user_id
            ON "tutors".verification_requests (user_id)
        '''))

        await conn.execute(text('''
            CREATE TABLE IF NOT EXISTS "tutors".verification_documents (
                id UUID PRIMARY KEY,
                request_id UUID NOT NULL REFERENCES "tutors".verification_requests(id) ON DELETE CASCADE,
                file_url VARCHAR(500) NOT NULL,
                file_name VARCHAR(255),
                doc_type VARCHAR(50),
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        '''))

        # El default historico era 'pending', lo que hacia que cualquier tutor recien
        # creado apareciera como "en revision" sin haber enviado ninguna solicitud.
        await conn.execute(text('''
            ALTER TABLE "tutors".profiles
            ALTER COLUMN verification_status SET DEFAULT 'unverified'
        '''))

        await conn.execute(text('''
            UPDATE "tutors".profiles p
            SET verification_status = 'unverified'
            WHERE p.verification_status = 'pending'
              AND NOT EXISTS (
                  SELECT 1 FROM "tutors".verification_requests r
                  WHERE r.user_id = p.user_id
              )
        '''))

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

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "tutor-service"}