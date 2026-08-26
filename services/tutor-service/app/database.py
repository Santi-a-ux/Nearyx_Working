from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy import event
from pgvector.asyncpg import register_vector
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/ttp")

engine = create_async_engine(
    DATABASE_URL,
    echo=True,
    connect_args={"statement_cache_size": 0},  # necesario con el pooler de Supabase (pgbouncer)
)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)


@event.listens_for(engine.sync_engine, "connect")
def _register_vector_type(dbapi_connection, connection_record):
    # Registra el tipo `vector` de pgvector en cada conexión asyncpg nueva,
    # necesario para poder guardar/leer embeddings correctamente.
    dbapi_connection.run_async(lambda connection: register_vector(connection))

Base = declarative_base()

async def get_db():
    async with SessionLocal() as session:
        yield session