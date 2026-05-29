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
    verification_status: str
    is_available: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class TutorListOut(BaseModel):
    tutors: List[TutorProfileOut]
    total: int