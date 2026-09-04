import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.publication import Publication


class PublicationRepository:
    async def list(self, db: AsyncSession, limit: int, offset: int) -> tuple[list[Publication], int]:
        total = await db.scalar(select(func.count()).select_from(Publication))
        result = await db.execute(
            select(Publication)
            .order_by(Publication.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        return list(result.scalars().all()), total or 0

    async def get_by_id(self, db: AsyncSession, publication_id: uuid.UUID) -> Publication | None:
        result = await db.execute(select(Publication).where(Publication.id == publication_id))
        return result.scalar_one_or_none()

    async def create(self, db: AsyncSession, publication: Publication) -> Publication:
        db.add(publication)
        await db.commit()
        await db.refresh(publication)
        return publication

    async def update(self, db: AsyncSession, publication: Publication) -> Publication:
        await db.commit()
        await db.refresh(publication)
        return publication

    async def delete(self, db: AsyncSession, publication: Publication) -> None:
        await db.delete(publication)
        await db.commit()
