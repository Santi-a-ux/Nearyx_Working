from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.core.config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=True)
AsyncSessionLocal = async_sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session