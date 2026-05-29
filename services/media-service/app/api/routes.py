from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse as FastAPIFileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
import uuid
import os
from pathlib import Path
from supabase import create_client, Client
from pydantic import BaseModel
from datetime import datetime

from app.core.security import verify_token
from app.core.config import settings
from app.database import get_db
from app.models import FileMetadata

router = APIRouter()
MEDIA_ROOT = Path(os.getenv("MEDIA_LOCAL_ROOT", "/tmp/ttp-media"))
PUBLIC_MEDIA_BASE_URL = os.getenv("PUBLIC_MEDIA_BASE_URL", "http://localhost:8006")

# Initialize Supabase client lazily or handle empty config gracefully for local tests
def get_supabase() -> Client:
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        raise HTTPException(status_code=500, detail="Supabase configuration is missing.")
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

class FileResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    file_url: str
    file_type: str
    file_size: int
    bucket_path: str
    created_at: datetime
    
    class Config:
        from_attributes = True

@router.post("/upload", response_model=dict)
async def upload_file(
    file: UploadFile = File(...),
    type: str = Form(...),
    db: AsyncSession = Depends(get_db),
    user_payload: dict = Depends(verify_token)
):
    valid_types = ['avatar', 'post', 'document']
    if type not in valid_types:
        raise HTTPException(status_code=400, detail=f"Invalid type. Must be one of {valid_types}")
        
    user_id = user_payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID missing from token")
        
    # Read file content
    contents = await file.read()
    file_size = len(contents)
    
    # Generate unique filename
    ext = os.path.splitext(file.filename)[1] if file.filename else ""
    unique_filename = f"{user_id}/{type}/{uuid.uuid4()}{ext}"

    # Local file storage fallback so uploads work without external object storage
    disk_path = MEDIA_ROOT / unique_filename
    disk_path.parent.mkdir(parents=True, exist_ok=True)
    disk_path.write_bytes(contents)
    file_url = f"{PUBLIC_MEDIA_BASE_URL}/media/files/{unique_filename}"

    # In a real scenario, uncomment:
    # supabase = get_supabase()
    # res = supabase.storage.from_('media_bucket').upload(unique_filename, contents)
    # file_url = supabase.storage.from_('media_bucket').get_public_url(unique_filename)
    
    # Save to db
    db_file = FileMetadata(
        user_id=user_id,
        file_url=file_url,
        file_type=file.content_type or "application/octet-stream",
        file_size=file_size,
        bucket_path=unique_filename
    )
    
    db.add(db_file)
    await db.commit()
    await db.refresh(db_file)
    
    return {
        "url": db_file.file_url,
        "file_id": str(db_file.id),
        "file_type": db_file.file_type,
        "file_size": db_file.file_size
    }

@router.get("/{file_id}", response_model=FileResponse)
async def get_file_metadata(file_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(FileMetadata).where(FileMetadata.id == file_id))
    db_file = result.scalar_first()
    if not db_file:
         raise HTTPException(status_code=404, detail="File not found")
    return db_file

@router.get("/files/{file_path:path}")
async def get_file_content(file_path: str):
    safe_path = (MEDIA_ROOT / file_path).resolve()
    media_root_resolved = MEDIA_ROOT.resolve()

    # Prevent path traversal
    if not str(safe_path).startswith(str(media_root_resolved)):
        raise HTTPException(status_code=400, detail="Invalid file path")

    if not safe_path.exists() or not safe_path.is_file():
        raise HTTPException(status_code=404, detail="File not found")

    return FastAPIFileResponse(path=str(safe_path))

@router.delete("/{file_id}")
async def delete_file(
    file_id: uuid.UUID, 
    db: AsyncSession = Depends(get_db),
    user_payload: dict = Depends(verify_token)
):
    user_id = user_payload.get("sub")
    result = await db.execute(select(FileMetadata).where(FileMetadata.id == file_id))
    db_file = result.scalar_first()
    if not db_file:
         raise HTTPException(status_code=404, detail="File not found")
         
    if str(db_file.user_id) != str(user_id):
        raise HTTPException(status_code=403, detail="Not authorized to delete this file")

    # supabase = get_supabase()
    # supabase.storage.from_('media_bucket').remove([db_file.bucket_path])

    await db.delete(db_file)
    await db.commit()
    
    return {"deleted": True}