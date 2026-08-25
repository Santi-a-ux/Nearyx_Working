from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from typing import List, Optional
from app.database import get_db
from app.models import TutorProfile, TutorRating, VerificationRequest, VerificationDocument
from app.schemas import (
    TutorProfileCreate,
    TutorProfileUpdate,
    TutorProfileOut,
    TutorListOut,
    TutorRatingIn,
    TutorRatingOut,
    VerificationRequestIn,
    VerificationRequestOut,
    VerificationPublicOut,
    VerificationReviewIn,
    VerificationListOut,
    VERIFICATION_REVIEW_STATUSES,
)
from app.dependencies import require_tutor_role, get_current_user, require_admin
from app.embeddings import build_profile_text, embed_passage, embed_query
from datetime import datetime, timezone
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

    profile_text = build_profile_text(profile_in.specialties, profile_in.categories)
    profile_embedding = embed_passage(profile_text)

    new_profile = TutorProfile(
        user_id=user_id,
        specialties=profile_in.specialties,
        categories=profile_in.categories,
        is_available=profile_in.is_available if profile_in.is_available is not None else True,
        hourly_rate=profile_in.hourly_rate,
        years_experience=profile_in.years_experience,
        coordinates=coord,
        embedding=profile_embedding
    )
    db.add(new_profile)
    await db.commit()
    await db.refresh(new_profile)
    
    return _format_profile_out(new_profile, lat=profile_in.lat, lng=profile_in.lng)

def _format_profile_out(db_profile: TutorProfile, lat=None, lng=None):
    return {
        "id": db_profile.id,
        "user_id": db_profile.user_id,
        "specialties": db_profile.specialties,
        "categories": db_profile.categories,
        "preferred_payment_method": getattr(db_profile, 'preferred_payment_method', None),
        "hourly_rate": db_profile.hourly_rate,
        "years_experience": db_profile.years_experience,
        "is_available": db_profile.is_available,
        "verification_status": db_profile.verification_status,
        "created_at": db_profile.created_at,
        "updated_at": db_profile.updated_at,
        "lat": lat,
        "lng": lng
    }

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

    if profile_in.specialties is not None or profile_in.categories is not None:
        profile_text = build_profile_text(profile.specialties, profile.categories)
        profile.embedding = embed_passage(profile_text)
        
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
    q: Optional[str] = Query(None, description="búsqueda semántica libre, ej: 'llanta'"),
    is_available: Optional[bool] = None,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    radius: Optional[int] = Query(None, description="radius in meters"),
    limit: int = 20,
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
):
    tutors = []
    total = 0

    # Búsqueda semántica: si viene "q", se ordena por similitud del embedding
    # en vez de (o además de) el filtro exacto por categoría.
    query_embedding = embed_query(q) if q else None

    if query_embedding is not None:
        distance_expr = TutorProfile.embedding.cosine_distance(query_embedding)

        fetch_stmt = select(
            TutorProfile,
            func.ST_Y(TutorProfile.coordinates).label('lat'),
            func.ST_X(TutorProfile.coordinates).label('lng'),
            distance_expr.label('semantic_distance')
        ).where(TutorProfile.embedding.is_not(None))

        if is_available is not None:
            fetch_stmt = fetch_stmt.where(TutorProfile.is_available == is_available)

        # Si además viene ubicación, se combina con el radio geográfico
        if lat is not None and lng is not None and radius is not None:
            fetch_stmt = fetch_stmt.where(func.ST_DistanceSphere(
                TutorProfile.coordinates,
                func.ST_SetSRID(func.ST_MakePoint(lng, lat), 4326)
            ) <= radius)

        # Umbral de relevancia: descarta matches demasiado lejanos semánticamente
        # (0.0 = idéntico, 1.0 = sin relación). Ajusta este valor probando resultados reales.
        fetch_stmt = fetch_stmt.where(distance_expr < 0.6)
        fetch_stmt = fetch_stmt.order_by(distance_expr).limit(limit).offset(offset)

        result = await db.execute(fetch_stmt)
        rows = result.all()
        total = len(rows)
        for row in rows:
            tutors.append(_format_profile_out(row.TutorProfile, lat=row.lat, lng=row.lng))
        return {'tutors': tutors, 'total': total}

    # If lat/lng provided, use distance-based query and ordering
    if lat is not None and lng is not None and radius is not None:
        # Build base filters
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

        # filter by radius (meters)
        fetch_stmt = fetch_stmt.where(func.ST_DistanceSphere(
            TutorProfile.coordinates,
            func.ST_SetSRID(func.ST_MakePoint(lng, lat), 4326)
        ) <= radius)

        # order by nearest
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

    # Fallback to original behavior (no proximity filter)
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
        # 2. Fetch full profiles with geometry functions bypassing limit bugs
        fetch_stmt = select(
            TutorProfile,
            func.ST_Y(TutorProfile.coordinates).label('lat'),
            func.ST_X(TutorProfile.coordinates).label('lng')
        ).where(TutorProfile.id.in_(profile_ids))

        profiles_result = await db.execute(fetch_stmt)
        for row in profiles_result.all():
            tutors.append(_format_profile_out(row.TutorProfile, lat=row.lat, lng=row.lng))

    return {'tutors': tutors, 'total': total}
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail='Tutor not found')
        
    return _format_profile_out(row.TutorProfile, lat=row.lat, lng=row.lng)

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

    return _format_profile_out(row.TutorProfile, lat=row.lat, lng=row.lng)


async def _build_rating_out(
    tutor_user_id: uuid.UUID,
    db: AsyncSession,
    rater_user_id: Optional[uuid.UUID] = None,
) -> TutorRatingOut:
    stats_stmt = select(
        func.avg(TutorRating.rating).label("average_rating"),
        func.count(TutorRating.id).label("ratings_count"),
    ).where(TutorRating.tutor_user_id == tutor_user_id)

    stats_result = await db.execute(stats_stmt)
    stats_row = stats_result.one()

    my_rating = None
    my_comment = None

    if rater_user_id is not None:
        my_stmt = select(
            TutorRating.rating,
            TutorRating.comment
        ).where(
            TutorRating.tutor_user_id == tutor_user_id,
            TutorRating.rater_user_id == rater_user_id,
        )

        my_result = await db.execute(my_stmt)
        my_row = my_result.first()

        if my_row:
            my_rating = my_row.rating
            my_comment = my_row.comment

    reviews_stmt = (
        select(TutorRating)
        .where(TutorRating.tutor_user_id == tutor_user_id)
        .order_by(TutorRating.created_at.desc())
    )

    reviews_result = await db.execute(reviews_stmt)
    reviews = reviews_result.scalars().all()

    avg_value = stats_row.average_rating

    return TutorRatingOut(
        my_rating=my_rating,
        my_comment=my_comment,
        average_rating=float(avg_value) if avg_value is not None else None,
        ratings_count=int(stats_row.ratings_count or 0),
        reviews=reviews,
    )


@router.get('/{user_id}/rating', response_model=TutorRatingOut)
async def get_tutor_rating(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    exists_stmt = select(TutorProfile.user_id).where(TutorProfile.user_id == user_id)
    exists_result = await db.execute(exists_stmt)
    if exists_result.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail='Tutor not found')

    current_user_id = uuid.UUID(current_user['user_id'])
    return await _build_rating_out(user_id, db, current_user_id)


@router.put('/{user_id}/rating', response_model=TutorRatingOut)
async def put_tutor_rating(
    user_id: uuid.UUID,
    rating_in: TutorRatingIn,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    exists_stmt = select(TutorProfile.user_id).where(TutorProfile.user_id == user_id)
    exists_result = await db.execute(exists_stmt)
    if exists_result.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail='Tutor not found')

    rater_user_id = uuid.UUID(current_user['user_id'])
    if rater_user_id == user_id:
        raise HTTPException(status_code=400, detail='No puedes calificar tu propio perfil')

    rating_stmt = select(TutorRating).where(
        TutorRating.tutor_user_id == user_id,
        TutorRating.rater_user_id == rater_user_id,
    )
    rating_result = await db.execute(rating_stmt)
    existing = rating_result.scalar_one_or_none()

    if existing:
        existing.rating = rating_in.rating
        existing.comment = rating_in.comment
    else:
        db.add(
            TutorRating(
                tutor_user_id=user_id,
                rater_user_id=rater_user_id,
                rating=rating_in.rating,
                comment=rating_in.comment,
            )
        )

    await db.commit()
    return await _build_rating_out(user_id, db, rater_user_id)


# --- Verificación de tutores -------------------------------------------------
# Orden importante: las rutas literales (/verification/me, /verification/requests)
# deben declararse antes de /verification/{user_id}, o FastAPI intentará parsear
# "me" y "requests" como UUID y devolverá 422.


def _format_verification_out(request: VerificationRequest, documents: List[VerificationDocument]):
    return {
        "id": request.id,
        "user_id": request.user_id,
        "status": request.status,
        "summary": request.summary,
        "education": request.education or [],
        "certifications": request.certifications or [],
        "experience": request.experience or [],
        "skills": request.skills or [],
        "review_notes": request.review_notes,
        "reviewed_at": request.reviewed_at,
        "documents": documents,
        "created_at": request.created_at,
        "updated_at": request.updated_at,
    }


async def _get_documents(db: AsyncSession, request_ids: List[uuid.UUID]):
    """Devuelve {request_id: [documentos]} resolviendo todo en una sola consulta."""
    if not request_ids:
        return {}

    result = await db.execute(
        select(VerificationDocument)
        .where(VerificationDocument.request_id.in_(request_ids))
        .order_by(VerificationDocument.created_at)
    )

    grouped = {request_id: [] for request_id in request_ids}
    for document in result.scalars().all():
        grouped[document.request_id].append(document)
    return grouped


async def _get_latest_request(db: AsyncSession, user_id: uuid.UUID, status_filter: Optional[str] = None):
    stmt = select(VerificationRequest).where(VerificationRequest.user_id == user_id)
    if status_filter:
        stmt = stmt.where(VerificationRequest.status == status_filter)
    stmt = stmt.order_by(VerificationRequest.created_at.desc()).limit(1)

    result = await db.execute(stmt)
    return result.scalars().first()


async def _sync_profile_status(db: AsyncSession, user_id: uuid.UUID, verification_status: str):
    result = await db.execute(select(TutorProfile).where(TutorProfile.user_id == user_id))
    profile = result.scalars().first()
    if profile:
        profile.verification_status = verification_status
    return profile


@router.post('/verification', response_model=VerificationRequestOut, status_code=status.HTTP_201_CREATED)
async def submit_verification(
    request_in: VerificationRequestIn,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_tutor_role),
):
    user_id = uuid.UUID(current_user['user_id'])

    profile_result = await db.execute(select(TutorProfile).where(TutorProfile.user_id == user_id))
    profile = profile_result.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail='Primero debes completar tu perfil de experto')

    latest = await _get_latest_request(db, user_id)
    if latest and latest.status == 'pending':
        raise HTTPException(status_code=400, detail='Ya tienes una solicitud de verificación en revisión')
    if latest and latest.status == 'approved':
        raise HTTPException(status_code=400, detail='Tu perfil ya está verificado')

    new_request = VerificationRequest(
        user_id=user_id,
        status='pending',
        summary=request_in.summary,
        education=[item.model_dump() for item in request_in.education],
        certifications=[item.model_dump() for item in request_in.certifications],
        experience=[item.model_dump() for item in request_in.experience],
        skills=request_in.skills,
    )
    db.add(new_request)
    await db.flush()

    documents = [
        VerificationDocument(
            request_id=new_request.id,
            file_url=document.file_url,
            file_name=document.file_name,
            doc_type=document.doc_type,
        )
        for document in request_in.documents
    ]
    db.add_all(documents)

    profile.verification_status = 'pending'

    await db.commit()
    await db.refresh(new_request)
    for document in documents:
        await db.refresh(document)

    return _format_verification_out(new_request, documents)


@router.get('/verification/me', response_model=VerificationRequestOut)
async def get_my_verification(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_tutor_role),
):
    user_id = uuid.UUID(current_user['user_id'])
    request = await _get_latest_request(db, user_id)
    if not request:
        raise HTTPException(status_code=404, detail='No has enviado una solicitud de verificación')

    documents = (await _get_documents(db, [request.id])).get(request.id, [])
    return _format_verification_out(request, documents)


@router.get('/verification/requests', response_model=VerificationListOut)
async def list_verification_requests(
    status_filter: Optional[str] = Query('pending', alias='status'),
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    stmt = select(VerificationRequest)
    count_stmt = select(func.count()).select_from(VerificationRequest)

    if status_filter:
        stmt = stmt.where(VerificationRequest.status == status_filter)
        count_stmt = count_stmt.where(VerificationRequest.status == status_filter)

    total_result = await db.execute(count_stmt)
    total = total_result.scalar() or 0

    stmt = stmt.order_by(VerificationRequest.created_at.desc()).limit(limit).offset(offset)
    result = await db.execute(stmt)
    requests = result.scalars().all()

    documents_by_request = await _get_documents(db, [request.id for request in requests])

    return {
        'requests': [
            _format_verification_out(request, documents_by_request.get(request.id, []))
            for request in requests
        ],
        'total': total,
    }


@router.patch('/verification/requests/{request_id}', response_model=VerificationRequestOut)
async def review_verification_request(
    request_id: uuid.UUID,
    review_in: VerificationReviewIn,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    if review_in.status not in VERIFICATION_REVIEW_STATUSES:
        raise HTTPException(
            status_code=400,
            detail='Estado inválido. Debe ser approved o rejected',
        )

    notes = (review_in.review_notes or '').strip()
    if review_in.status == 'rejected' and not notes:
        raise HTTPException(status_code=400, detail='Debes indicar el motivo del rechazo')

    result = await db.execute(select(VerificationRequest).where(VerificationRequest.id == request_id))
    request = result.scalars().first()
    if not request:
        raise HTTPException(status_code=404, detail='Solicitud no encontrada')

    if request.status != 'pending':
        raise HTTPException(status_code=400, detail='Esta solicitud ya fue revisada')

    request.status = review_in.status
    request.review_notes = notes or None
    request.reviewed_by = uuid.UUID(current_user['user_id'])
    request.reviewed_at = datetime.now(timezone.utc)

    await _sync_profile_status(
        db,
        request.user_id,
        'verified' if review_in.status == 'approved' else 'rejected',
    )

    await db.commit()
    await db.refresh(request)

    documents = (await _get_documents(db, [request.id])).get(request.id, [])
    return _format_verification_out(request, documents)


@router.get('/verification/{user_id}', response_model=VerificationPublicOut)
async def get_public_verification(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    request = await _get_latest_request(db, user_id, status_filter='approved')
    if not request:
        raise HTTPException(status_code=404, detail='Este experto no tiene verificación aprobada')

    return {
        'user_id': request.user_id,
        'summary': request.summary,
        'education': request.education or [],
        'certifications': request.certifications or [],
        'experience': request.experience or [],
        'skills': request.skills or [],
        'reviewed_at': request.reviewed_at,
    }