import uuid
from sqlalchemy import Column, String, Integer, Numeric, Boolean, DateTime, MetaData, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from geoalchemy2 import Geometry
from datetime import datetime, timezone
from app.database import Base

Base.metadata = MetaData(schema="tutors")

class TutorProfile(Base):
    __tablename__ = "profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), unique=True, nullable=False)
    specialties = Column(ARRAY(String), nullable=True)
    categories = Column(ARRAY(String), nullable=True)
    is_available = Column(Boolean, default=True)
    hourly_rate = Column(Numeric(10, 2), nullable=True)
    years_experience = Column(Integer, nullable=True)
    verification_status = Column(String(20), default='pending')
    coordinates = Column(Geometry('POINT', srid=4326), nullable=True)
    preferred_payment_method = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))