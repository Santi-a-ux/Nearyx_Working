from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database import get_db
from app.models import User, RefreshToken
from app.schemas import UserCreate, UserLogin, UserOut, Token, TokenRefresh, VerifyTokenRequest, VerifyTokenResponse, TokenFormat
from app.security import (
    get_password_hash, verify_password, 
    create_access_token, create_refresh_token, decode_token
)

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")
    return user

@router.post("/register", response_model=Token)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    if user_in.role not in ["student", "tutor", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    result = await db.execute(select(User).where(User.email == user_in.email))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user_in.password)
    new_user = User(email=user_in.email, password_hash=hashed_password, role=user_in.role)
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    access_token = create_access_token(new_user.id, new_user.role)
    refresh_token_str, expires_at = create_refresh_token(new_user.id)
    
    db_refresh = RefreshToken(
        user_id=new_user.id,
        token_hash=get_password_hash(refresh_token_str),
        expires_at=expires_at.replace(tzinfo=None) 
    )
    db.add(db_refresh)
    await db.commit()
    
    return Token(access_token=access_token, refresh_token=refresh_token_str, user=new_user)

@router.post("/login", response_model=Token)
async def login(user_in: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == user_in.email))
    user = result.scalars().first()
    
    if not user or not verify_password(user_in.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
        
    access_token = create_access_token(user.id, user.role)
    refresh_token_str, expires_at = create_refresh_token(user.id)
    
    db_refresh = RefreshToken(
        user_id=user.id,
        token_hash=get_password_hash(refresh_token_str),
        expires_at=expires_at.replace(tzinfo=None)
    )
    db.add(db_refresh)
    await db.commit()
    
    return Token(access_token=access_token, refresh_token=refresh_token_str, user=user)

@router.post("/refresh", response_model=TokenFormat)
async def refresh_token(data: TokenRefresh, db: AsyncSession = Depends(get_db)):
    payload = decode_token(data.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")
        
    user_id = payload.get("sub")
    result = await db.execute(select(RefreshToken).where(RefreshToken.user_id == user_id))
    tokens = result.scalars().all()
    
    valid_token = None
    for t in tokens:
        if verify_password(data.refresh_token, t.token_hash) and t.expires_at > datetime.utcnow():
            valid_token = t
            break
            
    if not valid_token:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
        
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    access_token = create_access_token(user.id, user.role)
    new_refresh_str, expires_at = create_refresh_token(user.id)
    
    await db.delete(valid_token)
    new_token_db = RefreshToken(
        user_id=user.id, 
        token_hash=get_password_hash(new_refresh_str), 
        expires_at=expires_at.replace(tzinfo=None)
    )
    db.add(new_token_db)
    await db.commit()
    
    return TokenFormat(access_token=access_token, refresh_token=new_refresh_str)

@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(RefreshToken).where(RefreshToken.user_id == current_user.id))
    for t in result.scalars().all():
        await db.delete(t)
    await db.commit()
    return {"message": "logged out"}

@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/verify-token", response_model=VerifyTokenResponse)
async def verify_token(req: VerifyTokenRequest):
    payload = decode_token(req.token)
    if not payload:
         return VerifyTokenResponse(valid=False)
    
    return VerifyTokenResponse(
        valid=True,
        user_id=str(payload.get("sub")),
        role=payload.get("role")
    )

@router.get("/ws-token")
async def get_ws_token(current_user: User = Depends(get_current_user)):
    """
    Endpoint to retrieve the current access token for WebSocket authentication.
    Used when the client cannot access httpOnly cookies via JavaScript.
    """
    access_token = create_access_token(current_user.id, current_user.role)
    return {"token": access_token}

@router.put("/promote-to-tutor")
async def promote_to_tutor(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "tutor":
        current_user.role = "tutor"
        await db.commit()
        await db.refresh(current_user)

    access_token = create_access_token(current_user.id, current_user.role)
    return {"access_token": access_token, "role": current_user.role}
