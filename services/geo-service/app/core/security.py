from fastapi import Request, HTTPException, status
from jose import jwt, JWTError
from app.core.config import settings

def verify_token(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Valid credentials are required",
        )
    token = auth_header.split(" ")[1]
    valid_payload = check_jwt(token)
    request.state.user = valid_payload
    return valid_payload

def check_jwt(token: str):
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is invalid or expired",
        )