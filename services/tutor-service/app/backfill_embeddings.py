"""
Script de una sola vez: genera el embedding para los perfiles de tutores
que ya existen en Supabase y aún no tienen (embedding IS NULL).

Correr desde services/tutor-service/ (usa el mismo DATABASE_URL del .env):
    python -m app.backfill_embeddings
"""
import asyncio
import sys

# En Windows, el ProactorEventLoop (el default) tiene un bug conocido con
# asyncpg al hacer el handshake SSL (corta la conexión a mitad de camino).
# SelectEventLoopPolicy no tiene ese problema.
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from sqlalchemy import select
from app.database import SessionLocal
from app.models import TutorProfile
from app.embeddings import build_profile_text, embed_passage


async def main():
    async with SessionLocal() as db:
        result = await db.execute(
            select(TutorProfile).where(TutorProfile.embedding.is_(None))
        )
        profiles = result.scalars().all()
        print(f"Perfiles sin embedding: {len(profiles)}")

        for profile in profiles:
            text = build_profile_text(profile.specialties, profile.categories)
            profile.embedding = embed_passage(text)
            print(f" - {profile.id}: '{text}'")

        await db.commit()
        print("Listo.")


if __name__ == "__main__":
    asyncio.run(main())