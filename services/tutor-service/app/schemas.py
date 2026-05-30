from pydantic import BaseModel, UUID4, Field
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

class TutorProfileBase(BaseModel):
    specialties: Optional[List[str]] = None
    categories: Optional[List[str]] = None
    hourly_rate: Optional[Decimal] = None
    years_experience: Optional[int] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    is_available: Optional[bool] = None
    preferred_payment_method: Optional[str] = None

class TutorProfileCreate(TutorProfileBase):
    pass

class TutorProfileUpdate(TutorProfileBase):
    pass

class TutorProfileOut(TutorProfileBase):
    id: UUID4
    user_id: UUID4
    preferred_payment_method: Optional[str]
    average_rating: Optional[float] = None
    ratings_count: int = 0
    verification_status: str
    is_available: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class TutorListOut(BaseModel):
    tutors: List[TutorProfileOut]
    total: int

class TutorRatingCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)

class TutorRatingOut(BaseModel):
    tutor_user_id: UUID4
    my_rating: Optional[int] = None
    average_rating: Optional[float] = None
    ratings_count: int = 0
