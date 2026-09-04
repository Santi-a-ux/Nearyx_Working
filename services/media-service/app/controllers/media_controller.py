import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from core.security import verify_token
from database import get_db
from models.file_response import FileResponse
from services.media_service import MediaService

router = APIRouter()


def get_media_service() -> MediaService:
    return MediaService()


@router.post("/upload", response_model=dict)
async def upload_file(
    file: UploadFile = File(...),
    type: str = Form(...),
    db: AsyncSession = Depends(get_db),
    user_payload: dict = Depends(verify_token),
    service: MediaService = Depends(get_media_service),
):
    try:
        file_metadata = await service.upload_file(db, file, type, user_payload.get("sub"))
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    return {
        "url": file_metadata.file_url,
        "file_id": str(file_metadata.id),
        "file_type": file_metadata.file_type,
        "file_size": file_metadata.file_size,
    }


@router.get("/files/{file_path:path}")
async def get_file_content(file_path: str, service: MediaService = Depends(get_media_service)):
    return RedirectResponse(url=service.get_content_url(file_path))

@router.get("/{file_id}", response_model=FileResponse)
async def get_file_metadata(
    file_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    service: MediaService = Depends(get_media_service),
):
    file_metadata = await service.get_metadata(db, file_id)
    if file_metadata is None:
        raise HTTPException(status_code=404, detail="File not found")
    return file_metadata



@router.delete("/{file_id}")
async def delete_file(
    file_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user_payload: dict = Depends(verify_token),
    service: MediaService = Depends(get_media_service),
):
    try:
        deleted = await service.delete_file(db, file_id, user_payload.get("sub"))
    except PermissionError as error:
        raise HTTPException(status_code=403, detail=str(error)) from error

    if deleted is None:
        raise HTTPException(status_code=404, detail="File not found")
    return {"deleted": True}
