from pydantic import BaseModel
from pydantic import UUID4
from datetime import datetime
from typing import Optional

class BookingCreate(BaseModel):
    tutor_id: UUID4
    scheduled_start: datetime
    scheduled_end: datetime

class BookingUpdate(BaseModel):
    status: str

class BookingOut(BaseModel):
    id: UUID4
    student_id: UUID4
    tutor_id: UUID4
    scheduled_start: datetime
    scheduled_end: datetime
    status: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class SessionNotesIn(BaseModel):
    notes: str
