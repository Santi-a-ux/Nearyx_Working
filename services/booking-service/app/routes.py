from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from app.database import get_db
from app.models import Booking
from app.schemas import BookingCreate, BookingUpdate, BookingOut
from app.dependencies import get_current_user
import uuid

router = APIRouter()

@router.post("/", response_model=BookingOut, status_code=status.HTTP_201_CREATED)
async def create_booking(
    booking_in: BookingCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    student_id = uuid.UUID(current_user["user_id"])
    
    # Prevenir que empiece despues de que termine
    if booking_in.scheduled_end <= booking_in.scheduled_start:
        raise HTTPException(status_code=400, detail="Invalid time range")

    new_booking = Booking(
        student_id=student_id,
        tutor_id=booking_in.tutor_id,
        scheduled_start=booking_in.scheduled_start,
        scheduled_end=booking_in.scheduled_end,
        status="pending"
    )
    db.add(new_booking)
    await db.commit()
    await db.refresh(new_booking)
    return new_booking

@router.get("/", response_model=List[BookingOut])
async def get_my_bookings(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = uuid.UUID(current_user["user_id"])
    role = current_user.get("role")
    
    stmt = select(Booking)
    if role == "tutor":
        stmt = stmt.where(Booking.tutor_id == user_id)
    else:
        stmt = stmt.where(Booking.student_id == user_id)
        
    result = await db.execute(stmt)
    return result.scalars().all()

@router.patch("/{booking_id}/status", response_model=BookingOut)
async def update_booking_status(
    booking_id: uuid.UUID,
    status_update: BookingUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    result = await db.execute(select(Booking).where(Booking.id == booking_id))
    booking = result.scalars().first()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    user_id = uuid.UUID(current_user["user_id"])
    
    # Validacion: Solo el tutor o el estudiante pueden cambiar el estado
    if user_id not in (booking.student_id, booking.tutor_id):
        raise HTTPException(status_code=403, detail="Not authorized")

    booking.status = status_update.status
    await db.commit()
    await db.refresh(booking)
    return booking
