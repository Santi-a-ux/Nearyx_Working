import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.comment import Comment


class CommentRepository:
    async def list_by_post(self, db: AsyncSession, post_id: uuid.UUID) -> list[Comment]:
        result = await db.execute(
            select(Comment)
            .where(Comment.post_id == post_id)
            .order_by(Comment.created_at.asc())
        )
        return list(result.scalars().all())

    async def create(self, db: AsyncSession, comment: Comment) -> Comment:
        db.add(comment)
        await db.commit()
        await db.refresh(comment)
        return comment

    async def get_by_id(self, db: AsyncSession, comment_id: uuid.UUID) -> Comment | None:
        result = await db.execute(select(Comment).where(Comment.id == comment_id))
        return result.scalar_one_or_none()

    async def delete(self, db: AsyncSession, comment: Comment) -> None:
        await db.delete(comment)
        await db.commit()