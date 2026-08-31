"""
Script de diagnóstico: muestra la distancia semántica real entre una
búsqueda de texto y cada perfil de tutor guardado, para calibrar el
umbral de relevancia con datos reales en vez de adivinar.

Uso:
    python -m app.debug_search "llanta"
    python -m app.debug_search "yoga"
"""
import asyncio
import sys

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from sqlalchemy import select, func
from app.database import SessionLocal
from app.models import TutorProfile
from app.embeddings import embed_query


async def main(query_text: str):
    query_embedding = embed_query(query_text)

    async with SessionLocal() as db:
        distance_expr = TutorProfile.embedding.cosine_distance(query_embedding)
        stmt = (
            select(
                TutorProfile.id,
                TutorProfile.specialties,
                TutorProfile.categories,
                distance_expr.label("distance"),
            )
            .where(TutorProfile.embedding.is_not(None))
            .order_by(distance_expr)
        )
        result = await db.execute(stmt)
        rows = result.all()

        print(f"\nBúsqueda: '{query_text}'\n" + "-" * 50)
        for row in rows:
            texto = ", ".join((row.specialties or []) + (row.categories or []))
            print(f"distancia={row.distance:.4f}  |  {texto}  (id={row.id})")
        print()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python -m app.debug_search \"texto a buscar\"")
        sys.exit(1)
    asyncio.run(main(sys.argv[1]))