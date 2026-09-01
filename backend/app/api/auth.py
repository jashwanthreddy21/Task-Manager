from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from jose import jwt, JWTError

from backend.app.core.config import settings
from backend.app.core.database import get_db
from backend.app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token
)
from backend.app.models.user import User
from backend.app.schemas.auth import RegisterSchema, LoginSchema, TokenSchema, TokenRefreshSchema
from backend.app.schemas.user import UserOut

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterSchema, db: AsyncSession = Depends(get_db)):
    # Check if user already exists
    result = await db.execute(select(User).where(User.email == payload.email))
    existing_user = result.scalar_one_or_none()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists"
        )
    
    # Hash password and save new user
    new_user = User(
        name=payload.name,
        email=payload.email,
        password_hash=get_password_hash(payload.password)
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user

@router.post("/login", response_model=TokenSchema)
async def login(payload: LoginSchema, db: AsyncSession = Depends(get_db)):
    # Fetch user by email
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Generate Access and Refresh tokens
    access_expiry = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    if payload.remember_me:
        # Long-lived access and refresh tokens
        access_expiry = timedelta(days=7)
        refresh_expiry = timedelta(days=30)
    else:
        refresh_expiry = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        
    access_token = create_access_token(subject=user.id, expires_delta=access_expiry)
    refresh_token = create_refresh_token(subject=user.id, expires_delta=refresh_expiry)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@router.post("/refresh", response_model=TokenSchema)
async def refresh(payload: TokenRefreshSchema, db: AsyncSession = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate refresh token"
    )
    try:
        token_payload = jwt.decode(payload.refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = token_payload.get("sub")
        token_type: str = token_payload.get("type")
        
        if user_id is None or token_type != "refresh":
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if user is None:
        raise credentials_exception
        
    # Generate new pair of tokens
    access_token = create_access_token(subject=user.id)
    refresh_token = create_refresh_token(subject=user.id)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@router.post("/logout")
async def logout():
    # Simple logout endpoint, JWT token destruction is handled on the client side (erasing local state)
    return {"message": "Successfully logged out"}
