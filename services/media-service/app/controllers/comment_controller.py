import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.security import verify_token
from database import get_db
from models.comment import CommentCreate, CommentResponse
from services.comment_service import CommentService

router = APIRouter(prefix="/posts/{post_id}/comments", tags=["Comments"])


def get_comment_service() -> CommentService:
    return CommentService()


def current_author_id(payload: dict) -> uuid.UUID:
    try:
        return uuid.UUID(str(payload.get("sub")))
    except (TypeError, ValueError) as error:
        raise HTTPException(status_code=401, detail="User ID is invalid") from error


@router.get("", response_model=dict)
async def list_comments(
    post_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    service: CommentService = Depends(get_comment_service),
):
    comments = await service.list_by_post(db, post_id)
    if comments is None:
        raise HTTPException(status_code=404, detail="Publication not found")
    return {
        "comments": [CommentResponse.model_validate(comment) for comment in comments],
        "total": len(comments),
    }


@router.post("", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
async def create_comment(
    post_id: uuid.UUID,
    data: CommentCreate,
    db: AsyncSession = Depends(get_db),
    user_payload: dict = Depends(verify_token),
    service: CommentService = Depends(get_comment_service),
):
    author_id = current_author_id(user_payload)
    if data.post_id != post_id or data.author_id != author_id:
        raise HTTPException(status_code=403, detail="Comment author or publication does not match")
    comment = await service.create(db, data)
    if comment is None:
        raise HTTPException(status_code=404, detail="Publication not found")
    return comment


@router.delete("/{comment_id}")
async def delete_comment(
    comment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user_payload: dict = Depends(verify_token),
    service: CommentService = Depends(get_comment_service),
):
    try:
        deleted = await service.delete(db, comment_id, current_author_id(user_payload))
    except PermissionError as error:
        raise HTTPException(status_code=403, detail=str(error)) from error
    if deleted is None:
        raise HTTPException(status_code=404, detail="Comment not found")
    return {"deleted": True}