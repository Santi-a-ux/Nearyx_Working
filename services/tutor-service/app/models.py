import uuid
from sqlalchemy import Column, String, Integer, Numeric, Boolean, DateTime, Text, MetaData, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, ARRAY, JSONB
from geoalchemy2 import Geometry
from datetime import datetime, timezone
from app.database import Base

Base.metadata = MetaData(schema="tutors")


def _utcnow():
    """Callable: se evalúa por fila. datetime.now(...) como default se congela al importar."""
    return datetime.now(timezone.utc)


class TutorProfile(Base):
    __tablename__ = "profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), unique=True, nullable=False)
    specialties = Column(ARRAY(String), nullable=True)
    categories = Column(ARRAY(String), nullable=True)
    is_available = Column(Boolean, default=True)
    hourly_rate = Column(Numeric(10, 2), nullable=True)
    years_experience = Column(Integer, nullable=True)
    verification_status = Column(String(20), default='unverified')
    coordinates = Column(Geometry('POINT', srid=4326), nullable=True)
    preferred_payment_method = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))


class TutorRating(Base):
    __tablename__ = "ratings"
    __table_args__ = (
        UniqueConstraint("tutor_user_id", "rater_user_id", name="uq_tutor_rater"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tutor_user_id = Column(UUID(as_uuid=True), ForeignKey("tutors.profiles.user_id", ondelete="CASCADE"), nullable=False)
    rater_user_id = Column(UUID(as_uuid=True), nullable=False)
    rating = Column(Integer, nullable=False)
    comment = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))

class VerificationRequest(Base):
    __tablename__ = "verification_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    status = Column(String(20), nullable=False, default='pending')
    summary = Column(Text, nullable=True)
    education = Column(JSONB, nullable=True)
    certifications = Column(JSONB, nullable=True)
    experience = Column(JSONB, nullable=True)
    skills = Column(ARRAY(String), nullable=True)
    review_notes = Column(Text, nullable=True)
    reviewed_by = Column(UUID(as_uuid=True), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=_utcnow)
    updated_at = Column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)


class VerificationDocument(Base):
    __tablename__ = "verification_documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    request_id = Column(
        UUID(as_uuid=True),
        ForeignKey("tutors.verification_requests.id", ondelete="CASCADE"),
        nullable=False,
    )
    file_url = Column(String(500), nullable=False)
    file_name = Column(String(255), nullable=True)
    doc_type = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), default=_utcnow)
