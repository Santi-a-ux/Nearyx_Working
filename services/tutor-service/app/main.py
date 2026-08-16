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