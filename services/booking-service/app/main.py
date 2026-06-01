from fastapi import FastAPI
from sqlalchemy import text
from app.database import engine
from app.routes import router

app = FastAPI(title="TTP Booking Service", version="1.0.0")


async def ensure_schema_ready() -> None:
    async with engine.begin() as conn:
        await conn.execute(text("CREATE SCHEMA IF NOT EXISTS bookings"))
        await conn.execute(text('''
            CREATE TABLE IF NOT EXISTS "bookings".bookings (
                id UUID PRIMARY KEY,
                student_id UUID NOT NULL,
                tutor_id UUID NOT NULL,
                scheduled_start TIMESTAMPTZ NOT NULL,
                scheduled_end TIMESTAMPTZ NOT NULL,
                status VARCHAR(50) NOT NULL DEFAULT 'pending',
                session_notes TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        '''))

app.include_router(router, prefix="/bookings")


@app.on_event("startup")
async def startup() -> None:
    await ensure_schema_ready()

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "booking-service"}
