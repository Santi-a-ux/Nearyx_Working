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


class TutorRatingIn(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = Field(default=None, max_length=500)

class TutorRatingReviewOut(BaseModel):
    rating: int
    comment: Optional[str] = None
    rater_user_id: UUID4
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class TutorRatingOut(BaseModel):
    my_rating: Optional[int] = None
    my_comment: Optional[str] = None
    average_rating: Optional[float] = None
    ratings_count: int = 0
    reviews: List[TutorRatingReviewOut] = []

# --- Verificación de tutores -------------------------------------------------

VERIFICATION_REVIEW_STATUSES = ("approved", "rejected")


class EducationItem(BaseModel):
    degree: str = Field(max_length=150)
    institution: str = Field(max_length=150)
    field: Optional[str] = Field(default=None, max_length=150)
    start_year: Optional[int] = Field(default=None, ge=1900, le=2100)
    end_year: Optional[int] = Field(default=None, ge=1900, le=2100)


class CertificationItem(BaseModel):
    name: str = Field(max_length=150)
    issuer: Optional[str] = Field(default=None, max_length=150)
    year: Optional[int] = Field(default=None, ge=1900, le=2100)


class ExperienceItem(BaseModel):
    role: str = Field(max_length=150)
    organization: Optional[str] = Field(default=None, max_length=150)
    start_year: Optional[int] = Field(default=None, ge=1900, le=2100)
    end_year: Optional[int] = Field(default=None, ge=1900, le=2100)
    description: Optional[str] = Field(default=None, max_length=1000)


class VerificationDocumentIn(BaseModel):
    file_url: str = Field(max_length=500)
    file_name: Optional[str] = Field(default=None, max_length=255)
    doc_type: Optional[str] = Field(default=None, max_length=50)


class VerificationDocumentOut(VerificationDocumentIn):
    id: UUID4
    created_at: datetime

    class Config:
        from_attributes = True


class VerificationRequestIn(BaseModel):
    summary: Optional[str] = Field(default=None, max_length=2000)
    education: List[EducationItem] = Field(min_length=1)
    certifications: List[CertificationItem] = []
    experience: List[ExperienceItem] = []
    skills: List[str] = []
    documents: List[VerificationDocumentIn] = Field(min_length=1)


class VerificationRequestOut(BaseModel):
    id: UUID4
    user_id: UUID4
    status: str
    summary: Optional[str] = None
    education: List[EducationItem] = []
    certifications: List[CertificationItem] = []
    experience: List[ExperienceItem] = []
    skills: List[str] = []
    review_notes: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    documents: List[VerificationDocumentOut] = []
    created_at: datetime
    updated_at: datetime


class VerificationPublicOut(BaseModel):
    """Datos aprobados visibles en el perfil público. Nunca incluye documentos."""
    user_id: UUID4
    summary: Optional[str] = None
    education: List[EducationItem] = []
    certifications: List[CertificationItem] = []
    experience: List[ExperienceItem] = []
    skills: List[str] = []
    reviewed_at: Optional[datetime] = None


class VerificationReviewIn(BaseModel):
    status: str
    review_notes: Optional[str] = Field(default=None, max_length=1000)


class VerificationListOut(BaseModel):
    requests: List[VerificationRequestOut]
    total: int
