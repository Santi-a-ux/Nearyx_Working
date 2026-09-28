from uuid import uuid4
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.core.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=True,
    connect_args={
        "statement_cache_size": 0,
        "prepared_statement_name_func": lambda: f"__asyncpg_{uuid4()}__",
    })
AsyncSessionLocal = async_sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session