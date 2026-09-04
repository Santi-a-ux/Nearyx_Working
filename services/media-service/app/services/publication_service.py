import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from models.publication import Publication, PublicationCreate, PublicationUpdate
from repositories.publication_repository import PublicationRepository


class PublicationService:
    def __init__(self, repository: PublicationRepository | None = None):
        self.repository = repository or PublicationRepository()

    async def list(self, db: AsyncSession, limit: int = 20, offset: int = 0):
        return await self.repository.list(db, limit, offset)

    async def get(self, db: AsyncSession, publication_id: uuid.UUID) -> Publication | None:
        return await self.repository.get_by_id(db, publication_id)

    async def create(self, db: AsyncSession, data: PublicationCreate) -> Publication:
        publication = Publication(**data.model_dump())
        return await self.repository.create(db, publication)

    async def update(
        self,
        db: AsyncSession,
        publication_id: uuid.UUID,
        data: PublicationUpdate,
        author_id: uuid.UUID,
    ) -> Publication | None:
        publication = await self.repository.get_by_id(db, publication_id)
        if publication is None:
            return None
        if publication.author_id != author_id:
            raise PermissionError("Not authorized to update this publication")

        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(publication, field, value)
        return await self.repository.update(db, publication)

    async def delete(
        self,
        db: AsyncSession,
        publication_id: uuid.UUID,
        author_id: uuid.UUID,
    ) -> bool | None:
        publication = await self.repository.get_by_id(db, publication_id)
        if publication is None:
            return None
        if publication.author_id != author_id:
            raise PermissionError("Not authorized to delete this publication")

        await self.repository.delete(db, publication)
        return True
