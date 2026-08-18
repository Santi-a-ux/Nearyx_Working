import uuid

from fastapi import APIRouter, Depends, status

from app.database import get_db
from app.dependencies import get_current_user
from app.schemas import ProfileCreate, ProfileOut, ProfileUpdate
from app.services.profile_service import ProfileService

router = APIRouter()


@router.post("/profiles", response_model=ProfileOut, status_code=status.HTTP_201_CREATED)
async def create_profile(
    profile_in: ProfileCreate,
    db=Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    return await ProfileService.create_profile(db, current_user, profile_in)


@router.get("/me", response_model=ProfileOut)
async def get_my_profile_root(
    db=Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    return await ProfileService.get_profile_by_user_id(db, uuid.UUID(current_user["user_id"]))


@router.get("/profiles/me", response_model=ProfileOut)
async def get_my_profile(
    db=Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    return await ProfileService.get_profile_by_user_id(db, uuid.UUID(current_user["user_id"]))


@router.put("/profiles/me", response_model=ProfileOut)
async def update_my_profile(
    profile_in: ProfileUpdate,
    db=Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    return await ProfileService.update_profile(db, current_user, profile_in)


@router.get("/profiles/{user_id}", response_model=ProfileOut)
async def get_profile(user_id: uuid.UUID, db=Depends(get_db)):
    return await ProfileService.get_profile_by_user_id(db, user_id)
