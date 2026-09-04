import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.security import verify_token
from database import get_db
from models.publication import PublicationCreate, PublicationResponse, PublicationUpdate
from services.publication_service import PublicationService

router = APIRouter(prefix="/posts", tags=["Publications"])


def get_publication_service() -> PublicationService:
    return PublicationService()


def current_author_id(payload: dict) -> uuid.UUID:
    try:
        return uuid.UUID(str(payload.get("sub")))
    except (TypeError, ValueError) as error:
        raise HTTPException(status_code=401, detail="User ID is invalid") from error


@router.get("", response_model=dict)
async def list_publications(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
    service: PublicationService = Depends(get_publication_service),
):
    publications, total = await service.list(db, limit, offset)
    return {
        "posts": [PublicationResponse.model_validate(publication) for publication in publications],
        "total": total,
    }


@router.post("", response_model=PublicationResponse, status_code=status.HTTP_201_CREATED)
async def create_publication(
    data: PublicationCreate,
    db: AsyncSession = Depends(get_db),
    user_payload: dict = Depends(verify_token),
    service: PublicationService = Depends(get_publication_service),
):
    author_id = current_author_id(user_payload)
    if data.author_id != author_id:
        raise HTTPException(status_code=403, detail="Author does not match authenticated user")
    return await service.create(db, data)


@router.get("/{publication_id}", response_model=PublicationResponse)
async def get_publication(
    publication_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    service: PublicationService = Depends(get_publication_service),
):
    publication = await service.get(db, publication_id)
    if publication is None:
        raise HTTPException(status_code=404, detail="Publication not found")
    return publication


@router.put("/{publication_id}", response_model=PublicationResponse)
async def update_publication(
    publication_id: uuid.UUID,
    data: PublicationUpdate,
    db: AsyncSession = Depends(get_db),
    user_payload: dict = Depends(verify_token),
    service: PublicationService = Depends(get_publication_service),
):
    try:
        publication = await service.update(db, publication_id, data, current_author_id(user_payload))
    except PermissionError as error:
        raise HTTPException(status_code=403, detail=str(error)) from error
    if publication is None:
        raise HTTPException(status_code=404, detail="Publication not found")
    return publication


@router.delete("/{publication_id}")
async def delete_publication(
    publication_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user_payload: dict = Depends(verify_token),
    service: PublicationService = Depends(get_publication_service),
):
    try:
        deleted = await service.delete(db, publication_id, current_author_id(user_payload))
    except PermissionError as error:
        raise HTTPException(status_code=403, detail=str(error)) from error
    if deleted is None:
        raise HTTPException(status_code=404, detail="Publication not found")
    return {"deleted": True}
