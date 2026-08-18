from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.controllers.profile_controller import router as profile_router
from app.controllers.profile_image_controller import router as profile_image_router
from app.database import Base, engine
import app.model.profile_model  # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(title="TTP User Service", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(profile_router, prefix="/users")
app.include_router(profile_image_router, prefix="/users")


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "user-service"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8002, reload=False)
