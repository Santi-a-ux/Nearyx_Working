from fastapi import FastAPI

from app.api import routes
from app.database import Base, engine
from app.models import FileMetadata

app = FastAPI(title="Media Service", version="1.0.0")

app.include_router(routes.router, prefix="/media", tags=["Media"])


@app.on_event("startup")
async def ensure_schema_ready() -> None:
    async with engine.begin() as conn:
        await conn.exec_driver_sql("CREATE SCHEMA IF NOT EXISTS media")
        await conn.run_sync(Base.metadata.create_all)


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "media-service"}