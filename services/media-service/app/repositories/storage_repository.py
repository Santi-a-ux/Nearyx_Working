import os
import uuid
from pathlib import Path
from typing import Any

try:
    from supabase import Client, create_client
except ImportError:  # pragma: no cover
    Client = Any  # type: ignore
    create_client = None  # type: ignore


class StorageRepository:
    def __init__(self, url: str | None = None, key: str | None = None, bucket: str | None = None):
        self.url = url or os.environ["SUPABASE_URL"]
        self.key = key or os.environ["SUPABASE_KEY"]
        self.bucket = bucket or os.getenv("SUPABASE_BUCKET", "tempoimages")
        self.client = self._build_client()

    def _build_client(self) -> Client:
        if create_client is None:
            raise RuntimeError("supabase package is not installed.")
        return create_client(self.url, self.key)

    def _build_object_path(self, folder: str, filename: str) -> str:
        extension = Path(Path(filename).name).suffix
        object_name = f"{uuid.uuid4()}{extension}"
        normalized_folder = folder.strip("/")
        return f"{normalized_folder}/{object_name}" if normalized_folder else object_name

    def upload(self, file_bytes: bytes, filename: str, folder: str, content_type: str) -> tuple[str, str]:
        if not file_bytes:
            raise ValueError("Image file is empty.")

        object_path = self._build_object_path(folder, filename)
        storage = self.client.storage.from_(self.bucket)
        storage.upload(
            path=object_path,
            file=file_bytes,
            file_options={"content-type": content_type, "upsert": "true"},
        )
        return object_path, storage.get_public_url(object_path)

    def get_public_url(self, object_path: str) -> str:
        return self.client.storage.from_(self.bucket).get_public_url(object_path)

    def delete(self, object_path: str) -> bool:
        result = self.client.storage.from_(self.bucket).remove([object_path])
        return bool(result)
