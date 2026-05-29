from pydantic import BaseModel, UUID4
from typing import Optional
from datetime import datetime

class ProfileBase(BaseModel):
    display_name: str
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    location_name: Optional[str] = None

class ProfileCreate(ProfileBase):
    pass

class ProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    location_name: Optional[str] = None

class ProfileOut(ProfileBase):
    id: UUID4
    user_id: UUID4
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True