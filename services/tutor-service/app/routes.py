from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from sqlalchemy.exc import SQLAlchemyError
from typing import List, Optional
from app.database import get_db
from app.models import TutorProfile, TutorRating
from app.schemas import TutorProfileCreate, TutorProfileUpdate, TutorProfileOut, TutorListOut, TutorRatingCreate, TutorRatingOut
from app.dependencies import require_tutor_role, get_current_user
import uuid

router = APIRouter()

@router.post("/profiles", response_model=TutorProfileOut, status_code=status.HTTP_201_CREATED)
async def create_profile(
    profile_in: TutorProfileCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = uuid.UUID(current_user["user_id"])
    result = await db.execute(select(TutorProfile).where(TutorProfile.user_id == user_id))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Profile already exists")

    coord = f"SRID=4326;POINT({profile_in.lng} {profile_in.lat})" if profile_in.lng and profile_in.lat else None

    new_profile = TutorProfile(
        user_id=user_id,
        specialties=profile_in.specialties,
        categories=profile_in.categories,
        is_available=profile_in.is_available if profile_in.is_available is not None else True,
        hourly_rate=profile_in.hourly_rate,
        years_experience=profile_in.years_experience,
        coordinates=coord
    )
    db.add(new_profile)
    await db.commit()
    await db.refresh(new_profile)

    return _format_profile_out(new_profile, lat=profile_in.lat, lng=profile_in.lng)

def _format_profile_out(db_profile: TutorProfile, lat=None, lng=None, average_rating=None, ratings_count=0):
    return {
        "id": db_profile.id,
        "user_id": db_profile.user_id,
        "specialties": db_profile.specialties,
        "categories": db_profile.categories,
        "preferred_payment_method": getattr(db_profile, 'preferred_payment_method', None),
        "average_rating": round(float(average_rating), 1) if average_rating is not None else None,
        "ratings_count": ratings_count or 0,
        "hourly_rate": db_profile.hourly_rate,
        "years_experience": db_profile.years_experience,
        "is_available": db_profile.is_available,
        "verification_status": db_profile.verification_status,
        "created_at": db_profile.created_at,
        "updated_at": db_profile.updated_at,
        "lat": lat,
        "lng": lng
    }

async def _rating_summary(db: AsyncSession, tutor_user_id: uuid.UUID):
    try:
        result = await db.execute(
            select(
                func.avg(TutorRating.rating).label("average_rating"),
                func.count(TutorRating.id).label("ratings_count")
            ).where(TutorRating.tutor_user_id == tutor_user_id)
        )
        row = result.first()
        if not row:
            return None, 0
        return row.average_rating, row.ratings_count or 0
    except SQLAlchemyError:
        await db.rollback()
        return None, 0

@router.put('/profiles', response_model=TutorProfileOut)
async def update_profile(
    profile_in: TutorProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_tutor_role)
):
    user_id = uuid.UUID(current_user['user_id'])
    result = await db.execute(select(TutorProfile).where(TutorProfile.user_id == user_id))
    profile = result.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail='Profile not found')

    for var, value in vars(profile_in).items():
        if value is not None and var not in ('lat', 'lng'):
            setattr(profile, var, value)

    if profile_in.lat is not None and profile_in.lng is not None:
        profile.coordinates = f'SRID=4326;POINT({profile_in.lng} {profile_in.lat})'

    await db.commit()
    await db.refresh(profile)
    return _format_profile_out(profile)

@router.get('/profiles/me', response_model=TutorProfileOut)
async def get_my_profile(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_tutor_role)
):
    user_id = uuid.UUID(current_user['user_id'])
    stmt = select(TutorProfile, func.ST_Y(TutorProfile.coordinates).label('lat'), func.ST_X(TutorProfile.coordinates).label('lng')).where(TutorProfile.user_id == user_id)
    result = await db.execute(stmt)
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail='Profile not found')

    return _format_profile_out(row.TutorProfile, lat=row.lat, lng=row.lng)

@router.get('/', response_model=TutorListOut)
async def list_tutors(
    category: Optional[str] = None,
    is_available: Optional[bool] = None,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    radius: Optional[int] = Query(None, description="radius in meters"),
    sort_by: Optional[str] = Query(None, description="Sort field: rating"),
    limit: int = 20,
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
):
    tutors = []
    total = 0

    if lat is not None and lng is not None and radius is not None:
        fetch_stmt = select(
            TutorProfile,
            func.ST_Y(TutorProfile.coordinates).label('lat'),
            func.ST_X(TutorProfile.coordinates).label('lng'),
            func.ST_DistanceSphere(
                TutorProfile.coordinates,
                func.ST_SetSRID(func.ST_MakePoint(lng, lat), 4326)
            ).label('distance')
        )
        if category:
            fetch_stmt = fetch_stmt.where(TutorProfile.categories.any(category))
        if is_available is not None:
            fetch_stmt = fetch_stmt.where(TutorProfile.is_available == is_available)

        fetch_stmt = fetch_stmt.where(func.ST_DistanceSphere(
            TutorProfile.coordinates,
            func.ST_SetSRID(func.ST_MakePoint(lng, lat), 4326)
        ) <= radius)

        fetch_stmt = fetch_stmt.order_by(func.ST_DistanceSphere(
            TutorProfile.coordinates,
            func.ST_SetSRID(func.ST_MakePoint(lng, lat), 4326)
        )).limit(limit).offset(offset)

        profiles_result = await db.execute(fetch_stmt)
        rows = profiles_result.all()
        total = len(rows)
        for row in rows:
            tutors.append(_format_profile_out(row.TutorProfile, lat=row.lat, lng=row.lng))
        return {'tutors': tutors, 'total': total}

    base_stmt = select(TutorProfile.id)
    if category:
        base_stmt = base_stmt.where(TutorProfile.categories.any(category))
    if is_available is not None:
        base_stmt = base_stmt.where(TutorProfile.is_available == is_available)

    count_stmt = select(func.count()).select_from(base_stmt.subquery())
    total_result = await db.execute(count_stmt)
    total = total_result.scalar() or 0

    base_stmt = base_stmt.limit(limit).offset(offset)
    ids_result = await db.execute(base_stmt)
    profile_ids = ids_result.scalars().all()

    if profile_ids:
        fetch_stmt = select(
            TutorProfile,
            func.ST_Y(TutorProfile.coordinates).label('lat'),
            func.ST_X(TutorProfile.coordinates).label('lng'),
            func.avg(TutorRating.rating).label('average_rating'),
            func.count(TutorRating.id).label('ratings_count')
        ).outerjoin(TutorRating, TutorRating.tutor_user_id == TutorProfile.user_id
        ).where(TutorProfile.id.in_(profile_ids)
        ).group_by(TutorProfile.id)

        if sort_by == 'rating':
            fetch_stmt = fetch_stmt.order_by(func.avg(TutorRating.rating).desc().nulls_last())

        profiles_result = await db.execute(fetch_stmt)
        for row in profiles_result.all():
            tutors.append(_format_profile_out(row.TutorProfile, lat=row.lat, lng=row.lng, average_rating=row.average_rating, ratings_count=row.ratings_count))

    return {'tutors': tutors, 'total': total}

@router.put('/availability', response_model=TutorProfileOut)
async def update_availability(
    is_available: bool,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_tutor_role)
):
    user_id = uuid.UUID(current_user['user_id'])
    result = await db.execute(select(TutorProfile).where(TutorProfile.user_id == user_id))
    profile = result.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail='Profile not found')

    profile.is_available = is_available
    await db.commit()
    await db.refresh(profile)
    return _format_profile_out(profile)

@router.get('/{user_id}/rating', response_model=TutorRatingOut)
async def get_my_tutor_rating(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    tutor_result = await db.execute(select(TutorProfile.user_id).where(TutorProfile.user_id == user_id))
    if not tutor_result.scalar():
        raise HTTPException(status_code=404, detail='Tutor not found')

    rater_user_id = uuid.UUID(current_user['user_id'])
    rating_result = await db.execute(
        select(TutorRating).where(
            TutorRating.tutor_user_id == user_id,
            TutorRating.rater_user_id == rater_user_id
        )
    )
    rating = rating_result.scalars().first()
    average_rating, ratings_count = await _rating_summary(db, user_id)

    return {
        "tutor_user_id": user_id,
        "my_rating": rating.rating if rating else None,
        "average_rating": round(float(average_rating), 1) if average_rating is not None else None,
        "ratings_count": ratings_count,
    }

@router.put('/{user_id}/rating', response_model=TutorRatingOut)
async def rate_tutor(
    user_id: uuid.UUID,
    rating_in: TutorRatingCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    rater_user_id = uuid.UUID(current_user['user_id'])
    if rater_user_id == user_id:
        raise HTTPException(status_code=400, detail='No puedes calificar tu propio perfil')

    tutor_result = await db.execute(select(TutorProfile.user_id).where(TutorProfile.user_id == user_id))
    if not tutor_result.scalar():
        raise HTTPException(status_code=404, detail='Tutor not found')

    rating_result = await db.execute(
        select(TutorRating).where(
            TutorRating.tutor_user_id == user_id,
            TutorRating.rater_user_id == rater_user_id
        )
    )
    rating = rating_result.scalars().first()

    if rating:
        rating.rating = rating_in.rating
    else:
        rating = TutorRating(
            tutor_user_id=user_id,
            rater_user_id=rater_user_id,
            rating=rating_in.rating,
        )
        db.add(rating)

    await db.commit()
    average_rating, ratings_count = await _rating_summary(db, user_id)

    return {
        "tutor_user_id": user_id,
        "my_rating": rating_in.rating,
        "average_rating": round(float(average_rating), 1) if average_rating is not None else None,
        "ratings_count": ratings_count,
    }

@router.get('/{user_id}', response_model=TutorProfileOut)
async def get_tutor_profile_by_user_id(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(
        TutorProfile,
        func.ST_Y(TutorProfile.coordinates).label('lat'),
        func.ST_X(TutorProfile.coordinates).label('lng')
    ).where(TutorProfile.user_id == user_id)
    result = await db.execute(stmt)
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail='Tutor not found')

    average_rating, ratings_count = await _rating_summary(db, user_id)
    return _format_profile_out(row.TutorProfile, lat=row.lat, lng=row.lng, average_rating=average_rating, ratings_count=ratings_count)
