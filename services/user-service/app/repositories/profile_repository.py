from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.model.profile_model import UserProfile


class ProfileRepository:
    @staticmethod
    async def get_by_user_id(db: AsyncSession, user_id: UUID) -> UserProfile | None:
        result = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
        return result.scalars().first()

    @staticmethod
    async def create(db: AsyncSession, profile: UserProfile) -> UserProfile:
        db.add(profile)
        await db.commit()
        await db.refresh(profile)
        return profile

    @staticmethod
    async def update(db: AsyncSession, profile: UserProfile) -> UserProfile:
        await db.commit()
        await db.refresh(profile)
        return profile
