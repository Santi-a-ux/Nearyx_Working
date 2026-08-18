import uuid
from typing import Optional

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.model.profile_model import UserProfile
from app.repositories.profile_repository import ProfileRepository
from app.schemas import ProfileCreate, ProfileUpdate


class ProfileService:
    @staticmethod
    async def create_profile(db: AsyncSession, current_user: dict, profile_in: ProfileCreate) -> UserProfile:
        user_id = uuid.UUID(current_user["user_id"])
        existing_profile = await ProfileRepository.get_by_user_id(db, user_id)
        if existing_profile:
            raise HTTPException(status_code=400, detail="Profile already exists for this user")

        profile = UserProfile(
            user_id=user_id,
            display_name=profile_in.display_name,
            bio=profile_in.bio,
            avatar_url=profile_in.avatar_url,
            location_name=profile_in.location_name,
        )
        return await ProfileRepository.create(db, profile)

    @staticmethod
    async def get_profile_by_user_id(db: AsyncSession, user_id: uuid.UUID) -> UserProfile:
        profile = await ProfileRepository.get_by_user_id(db, user_id)
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        return profile

    @staticmethod
    async def update_profile(db: AsyncSession, current_user: dict, profile_in: ProfileUpdate) -> UserProfile:
        user_id = uuid.UUID(current_user["user_id"])
        profile = await ProfileRepository.get_by_user_id(db, user_id)

        if not profile:
            profile = UserProfile(
                user_id=user_id,
                display_name=profile_in.display_name or "Usuario",
                bio=profile_in.bio,
                avatar_url=profile_in.avatar_url,
                location_name=profile_in.location_name,
            )
            return await ProfileRepository.create(db, profile)

        for field, value in vars(profile_in).items():
            if value is not None:
                setattr(profile, field, value)

        return await ProfileRepository.update(db, profile)
