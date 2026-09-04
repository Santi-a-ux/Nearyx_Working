import os
import uuid

from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from models import FileMetadata
from repositories.file_metadata_repository import FileMetadataRepository
from repositories.storage_repository import StorageRepository


class MediaService:
    VALID_TYPES = {"avatar", "post", "document"}

    def __init__(
        self,
        metadata_repository: FileMetadataRepository | None = None,
        storage_repository: StorageRepository | None = None,
    ):
        self.metadata_repository = metadata_repository or FileMetadataRepository()
        self.storage_repository = storage_repository or StorageRepository()

    async def upload_file(
        self,
        db: AsyncSession,
        file: UploadFile,
        file_type: str,
        user_id: str,
    ) -> FileMetadata:
        if file_type not in self.VALID_TYPES:
            raise ValueError(f"Invalid type. Must be one of {sorted(self.VALID_TYPES)}")
        if not user_id:
            raise ValueError("User ID missing from token")

        contents = await file.read()
        extension = os.path.splitext(file.filename or "")[1]
        object_path, file_url = self.storage_repository.upload(
            file_bytes=contents,
            filename=f"{uuid.uuid4()}{extension}",
            folder=f"{user_id}/{file_type}",
            content_type=file.content_type or "application/octet-stream",
        )

        metadata = FileMetadata(
            user_id=user_id,
            file_url=file_url,
            file_type=file.content_type or "application/octet-stream",
            file_size=len(contents),
            bucket_path=object_path,
        )
        return await self.metadata_repository.create(db, metadata)

    async def get_metadata(self, db: AsyncSession, file_id: uuid.UUID) -> FileMetadata | None:
        return await self.metadata_repository.get_by_id(db, file_id)

    def get_content_url(self, file_path: str) -> str:
        return self.storage_repository.get_public_url(file_path)

    async def delete_file(self, db: AsyncSession, file_id: uuid.UUID, user_id: str) -> bool | None:
        metadata = await self.metadata_repository.get_by_id(db, file_id)
        if metadata is None:
            return None
        if str(metadata.user_id) != str(user_id):
            raise PermissionError("Not authorized to delete this file")

        self.storage_repository.delete(metadata.bucket_path)
        await self.metadata_repository.delete(db, metadata)
        return True
