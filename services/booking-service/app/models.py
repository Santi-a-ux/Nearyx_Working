from sqlalchemy import Column, String, DateTime, ForeignKey, text, Text
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.database import Base

class Booking(Base):
    __tablename__ = "bookings"
    __table_args__ = {"schema": "bookings"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), nullable=False)
    tutor_id = Column(UUID(as_uuid=True), nullable=False)
    scheduled_start = Column(DateTime(timezone=True), nullable=False)
    scheduled_end = Column(DateTime(timezone=True), nullable=False)
    status = Column(String(50), nullable=False, server_default="pending") # pending, confirmed, cancelled, completed
    session_notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=text("now()"))
    updated_at = Column(DateTime(timezone=True), server_default=text("now()"), onupdate=text("now()"))
