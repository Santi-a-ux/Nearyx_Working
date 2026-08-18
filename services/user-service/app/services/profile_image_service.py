from fastapi import HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.profile_repository import ProfileRepository
from app.repositories.supabase_storage_repository import SupabaseStorageRepository


class ProfileImageService:
    def __init__(self, storage_repo: SupabaseStorageRepository | None = None):
        self.storage_repo = storage_repo or SupabaseStorageRepository()

    async def upload_avatar(self, db: AsyncSession, file: UploadFile, user_id: str) -> str:
        if not file or not file.filename:
            raise HTTPException(status_code=400, detail="File is required")

        allowed_types = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
        content_type = file.content_type or "image/jpeg"
        if content_type not in allowed_types and not content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Only image files are allowed")

        avatar_url = await self.storage_repo.upload_image_from_upload_file(
            upload_file=file,
            folder=f"users/{user_id}/avatars",
            content_type=content_type,
        )

        profile = await ProfileRepository.get_by_user_id(db, user_id)
        if profile is None:
            raise HTTPException(status_code=404, detail="Profile not found")

        profile.avatar_url = avatar_url
        await ProfileRepository.update(db, profile)
        return avatar_url
