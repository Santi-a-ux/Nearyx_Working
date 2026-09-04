import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models import FileMetadata


class FileMetadataRepository:
    async def create(self, db: AsyncSession, file_metadata: FileMetadata) -> FileMetadata:
        db.add(file_metadata)
        await db.commit()
        await db.refresh(file_metadata)
        return file_metadata

    async def get_by_id(self, db: AsyncSession, file_id: uuid.UUID) -> FileMetadata | None:
        result = await db.execute(select(FileMetadata).where(FileMetadata.id == file_id))
        return result.scalar_one_or_none()

    async def delete(self, db: AsyncSession, file_metadata: FileMetadata) -> None:
        await db.delete(file_metadata)
        await db.commit()
