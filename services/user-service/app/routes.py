from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from app.database import get_db
from app.models import UserProfile
from app.schemas import ProfileCreate, ProfileUpdate, ProfileOut
from app.dependencies import get_current_user
import uuid

router = APIRouter()

@router.post("/profiles", response_model=ProfileOut, status_code=status.HTTP_201_CREATED)
async def create_profile(
    profile_in: ProfileCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = uuid.UUID(current_user["user_id"])
    result = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
    existing_profile = result.scalars().first()
    if existing_profile:
        raise HTTPException(status_code=400, detail="Profile already exists for this user")
    
    new_profile = UserProfile(
        user_id=user_id,
        display_name=profile_in.display_name,
        bio=profile_in.bio,
        avatar_url=profile_in.avatar_url,
        location_name=profile_in.location_name
    )
    db.add(new_profile)
    await db.commit()
    await db.refresh(new_profile)
    return new_profile

@router.get("/me", response_model=ProfileOut)
async def get_my_profile_root(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get authenticated user's profile (alias for /profiles/me)"""
    user_id = uuid.UUID(current_user["user_id"])
    result = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
    profile = result.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

@router.get("/profiles/me", response_model=ProfileOut)
async def get_my_profile(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = uuid.UUID(current_user["user_id"])
    result = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
    profile = result.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

@router.put("/profiles/me", response_model=ProfileOut)
async def update_my_profile(
    profile_in: ProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = uuid.UUID(current_user["user_id"])
    result = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
    profile = result.scalars().first()
    if not profile:
        # Upsert behavior: if profile does not exist yet, create it with safe defaults.
        profile = UserProfile(
            user_id=user_id,
            display_name=profile_in.display_name or "Usuario",
            bio=profile_in.bio,
            avatar_url=profile_in.avatar_url,
            location_name=profile_in.location_name,
        )
        db.add(profile)
        await db.commit()
        await db.refresh(profile)
        return profile
    
    for var, value in vars(profile_in).items():
        if value is not None:
            setattr(profile, var, value)
            
    await db.commit()
    await db.refresh(profile)
    return profile

@router.get("/profiles/{user_id}", response_model=ProfileOut)
async def get_profile(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
    profile = result.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile