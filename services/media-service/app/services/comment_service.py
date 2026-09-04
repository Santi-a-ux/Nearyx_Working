import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from models.comment import Comment, CommentCreate
from repositories.comment_repository import CommentRepository
from repositories.publication_repository import PublicationRepository


class CommentService:
    def __init__(
        self,
        repository: CommentRepository | None = None,
        publication_repository: PublicationRepository | None = None,
    ):
        self.repository = repository or CommentRepository()
        self.publication_repository = publication_repository or PublicationRepository()

    async def list_by_post(self, db: AsyncSession, post_id: uuid.UUID) -> list[Comment] | None:
        if await self.publication_repository.get_by_id(db, post_id) is None:
            return None
        return await self.repository.list_by_post(db, post_id)

    async def create(self, db: AsyncSession, data: CommentCreate) -> Comment | None:
        if await self.publication_repository.get_by_id(db, data.post_id) is None:
            return None
        return await self.repository.create(db, Comment(**data.model_dump()))

    async def delete(self, db: AsyncSession, comment_id: uuid.UUID, author_id: uuid.UUID) -> bool | None:
        comment = await self.repository.get_by_id(db, comment_id)
        if comment is None:
            return None
        if comment.author_id != author_id:
            raise PermissionError("Not authorized to delete this comment")
        await self.repository.delete(db, comment)
        return True