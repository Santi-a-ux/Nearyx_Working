import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import Column, DateTime, String, Text, text
from sqlalchemy.dialects.postgresql import UUID

from database import Base


class Publication(Base):
    __tablename__ = "posts"
    __table_args__ = {"schema": "feed"}

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    author_id = Column(UUID(as_uuid=True), nullable=False)
    author_name = Column(String(120), nullable=False)
    author_avatar = Column(String(500), nullable=True)
    author_role = Column(String(30), nullable=True)
    content = Column(Text, nullable=False)
    image_url = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=text("NOW()"))


class PublicationCreate(BaseModel):
    author_id: uuid.UUID
    author_name: str = Field(min_length=1, max_length=120)
    author_avatar: str | None = Field(default=None, max_length=500)
    author_role: str | None = Field(default=None, max_length=30)
    content: str = Field(min_length=1)
    image_url: str | None = Field(default=None, max_length=500)


class PublicationUpdate(BaseModel):
    content: str | None = Field(default=None, min_length=1)
    image_url: str | None = Field(default=None, max_length=500)
    author_role: str | None = Field(default=None, max_length=30)


class PublicationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    author_id: uuid.UUID
    content: str
    image_url: str | None = None
    created_at: datetime
    author_name: str | None = None
    author_avatar: str | None = None
    author_role: str | None = None