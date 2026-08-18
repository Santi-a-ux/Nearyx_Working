from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.database import get_db
from app.dependencies import get_current_user
from app.services.profile_image_service import ProfileImageService

router = APIRouter()


@router.post("/profiles/avatar", status_code=status.HTTP_201_CREATED)
async def upload_avatar(
    file: UploadFile = File(...),
    db=Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if not current_user or "user_id" not in current_user:
        raise HTTPException(status_code=401, detail="User not authenticated")

    image_url = await ProfileImageService().upload_avatar(db, file, str(current_user["user_id"]))
    return {"avatar_url": image_url}
