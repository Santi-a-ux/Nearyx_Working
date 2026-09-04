from fastapi import FastAPI
from sqlalchemy import text

from controllers.comment_controller import router as comment_router
from controllers.media_controller import router as media_router
from controllers.publication_controller import router as publication_router
from database import Base, engine
from models import Comment, FileMetadata, Publication

app = FastAPI(title="Media Service", version="1.0.0")

app.include_router(publication_router, prefix="/media")
app.include_router(comment_router, prefix="/media")
app.include_router(media_router, prefix="/media", tags=["Media"])


@app.on_event("startup")
async def ensure_schema_ready() -> None:
    async with engine.begin() as conn:
        await conn.exec_driver_sql("CREATE SCHEMA IF NOT EXISTS media")
        await conn.execute(text("CREATE SCHEMA IF NOT EXISTS feed"))
        await conn.run_sync(Base.metadata.create_all)


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "media-service"}