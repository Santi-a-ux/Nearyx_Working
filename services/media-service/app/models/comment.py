import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import Column, DateTime, String, Text, text
from sqlalchemy.dialects.postgresql import UUID

from database import Base


class Comment(Base):
    __tablename__ = "comments"
    __table_args__ = {"schema": "feed"}

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    post_id = Column(UUID(as_uuid=True), nullable=False)
    author_id = Column(UUID(as_uuid=True), nullable=False)
    author_name = Column(String(120), nullable=False)
    author_avatar = Column(String(500), nullable=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=text("NOW()"))


class CommentCreate(BaseModel):
    post_id: uuid.UUID
    author_id: uuid.UUID
    author_name: str = Field(min_length=1, max_length=120)
    author_avatar: str | None = Field(default=None, max_length=500)
    content: str = Field(min_length=1)


class CommentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    post_id: uuid.UUID
    author_id: uuid.UUID
    author_name: str
    author_avatar: str | None = None
    content: str
    created_at: datetime