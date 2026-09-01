import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.config import settings
from backend.app.core.database import get_db
from backend.app.core.security import get_current_user, get_password_hash
from backend.app.models.user import User
from backend.app.schemas.user import UserOut, UserUpdate

router = APIRouter(prefix="/api/users", tags=["Users"])

@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/update", response_model=UserOut)
async def update_profile(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if payload.name is not None:
        current_user.name = payload.name
        
    if payload.email is not None:
        current_user.email = payload.email
        
    if payload.password is not None and payload.password != "":
        current_user.password_hash = get_password_hash(payload.password)
        
    if payload.avatar is not None:
        current_user.avatar = payload.avatar
        
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    return current_user

@router.post("/avatar", response_model=UserOut)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPEG, PNG, GIF, and WEBP image uploads are allowed"
        )
        
    # Standardize and save file
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"avatar_{current_user.id}_{uuid.uuid4().hex}{file_extension}"
    
    avatar_dir = os.path.join(settings.UPLOAD_DIR, "avatars")
    os.makedirs(avatar_dir, exist_ok=True)
    
    file_path = os.path.join(avatar_dir, unique_filename)
    
    try:
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not save file: {str(e)}"
        )
        
    # Save path in DB
    relative_path = f"/uploads/avatars/{unique_filename}"
    current_user.avatar = relative_path
    
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    return current_user

@router.delete("/delete", status_code=status.HTTP_200_OK)
async def delete_account(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Delete user's avatar file if exists
    if current_user.avatar and current_user.avatar.startswith("/uploads"):
        path_to_delete = os.path.join(
            settings.UPLOAD_DIR, 
            current_user.avatar.replace("/uploads/", "")
        )
        if os.path.exists(path_to_delete):
            try:
                os.remove(path_to_delete)
            except Exception:
                pass
                
    await db.delete(current_user)
    await db.commit()
    return {"message": "Account successfully deleted"}
