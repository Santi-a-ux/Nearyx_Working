import os
import uuid
from pathlib import Path
from typing import Any, Optional

try:
    from supabase import Client, create_client
except ImportError:  # pragma: no cover - optional dependency in some environments
    Client = Any  # type: ignore
    create_client = None  # type: ignore


class SupabaseStorageRepository:
    def __init__(
        self,
        url: Optional[str] = None,
        key: Optional[str] = None,
        bucket: Optional[str] = None,
    ):
        self.url = url or os.getenv(
            "SUPABASE_URL",
            "https://bwwoqvaboapbpteqtmjp.supabase.co",
        )
        self.key = key or os.getenv(
            "SUPABASE_KEY"      )
        self.bucket = bucket or os.getenv("SUPABASE_BUCKET", "tempoimages")
        self.client = self._build_client()

    def _build_client(self):
        if create_client is None:
            raise RuntimeError(
                "supabase package is not installed. Add it to the project requirements."
            )
        return create_client(self.url, self.key)

    def _build_object_path(self, folder: str, filename: str) -> str:
        safe_filename = Path(filename).name
        extension = Path(safe_filename).suffix
        object_name = f"{uuid.uuid4()}{extension}"
        normalized_folder = str(folder).strip("/")
        if normalized_folder:
            return f"{normalized_folder}/{object_name}"
        return object_name

    async def upload_image(
        self,
        file_bytes: bytes,
        filename: str,
        folder: str = "avatars",
        content_type: str = "image/jpeg",
    ) -> str:
        if not file_bytes:
            raise ValueError("Image file is empty.")

        object_path = self._build_object_path(folder, filename)
        storage = self.client.storage.from_(self.bucket)
        storage.upload(
            path=object_path,
            file=file_bytes,
            file_options={"content-type": content_type, "upsert": "true"},
        )
        return storage.get_public_url(object_path)

    async def upload_image_from_upload_file(
        self,
        upload_file,
        folder: str = "avatars",
        content_type: Optional[str] = None,
    ) -> str:
        file_content = await upload_file.read()
        filename = upload_file.filename or "image.jpg"
        resolved_content_type = content_type or upload_file.content_type or "image/jpeg"
        return await self.upload_image(
            file_bytes=file_content,
            filename=filename,
            folder=folder,
            content_type=resolved_content_type,
        )

    async def delete_image(self, object_path: str) -> bool:
        storage = self.client.storage.from_(self.bucket)
        result = storage.remove([object_path])
        return bool(result)

    def get_public_url(self, object_path: str) -> str:
        return self.client.storage.from_(self.bucket).get_public_url(object_path)
