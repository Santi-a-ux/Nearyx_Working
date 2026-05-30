from fastapi import FastAPI
from app.api import routes
from app.database import engine, Base
import app.models  # noqa: F401

app = FastAPI(title="Chat Service", version="1.0.0")

app.include_router(routes.router, prefix="/chat", tags=["Chat"])


@app.on_event("startup")
async def ensure_schema_ready() -> None:
    async with engine.begin() as conn:
        await conn.exec_driver_sql("CREATE SCHEMA IF NOT EXISTS chat")
        await conn.run_sync(Base.metadata.create_all)


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "chat-service"}