import uuid
import base64
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.core.security import hash_password, verify_password
from app.schemas.common import StandardResponse
from app.schemas.auth import (
    UserOut,
    UserCreate,
    UserUpdate,
    UserProfileUpdate,
    ChangePasswordRequest,
    SecurityDetailsOut,
)
from app.repositories.user_repository import UserRepository
from app.repositories.provider_repository import ProviderRepository
from app.services.providers.registry import provider_registry
from app.models.user import User
from app.models.api_key import ApiKey
from app.api.dependencies import get_current_user, get_current_admin

router = APIRouter(prefix="/users", tags=["User Management"])


# ==========================================
# Current User Self-Service Endpoints (/me)
# (Must be declared before /{user_id} path)
# ==========================================

@router.get("/me", response_model=StandardResponse[UserOut])
async def get_my_profile(current_user: User = Depends(get_current_user)):
    """Retrieve profile of currently authenticated user"""
    return StandardResponse.ok(
        data=UserOut.model_validate(current_user),
        message="Profile retrieved",
    )


@router.patch("/me", response_model=StandardResponse[UserOut])
async def update_my_profile(
    payload: UserProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update profile details (e.g. display name, avatar URL) for current user"""
    repo = UserRepository(db)
    user = await repo.get_by_id(current_user.id)
    if not user:
        raise HTTPException(status_code=404, detail={"code": "USER_NOT_FOUND", "message": "User not found"})

    if payload.full_name is not None:
        user.full_name = payload.full_name.strip()
    if payload.avatar_url is not None:
        user.avatar_url = payload.avatar_url.strip() if payload.avatar_url else None

    updated = await repo.update(user)
    return StandardResponse.ok(
        data=UserOut.model_validate(updated),
        message="Profile updated successfully",
    )


@router.post("/me/avatar", response_model=StandardResponse[UserOut])
async def upload_my_avatar(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Upload and update avatar photo for current user.
    Uses Cloudinary provider if configured, otherwise stores securely.
    """
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "FILE_TOO_LARGE", "message": "Avatar image cannot exceed 5MB"},
        )

    content_type = file.content_type or "image/jpeg"
    if not content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_IMAGE_TYPE", "message": "Uploaded file must be an image"},
        )

    avatar_url = None

    # Try Cloudinary Provider first if configured
    repo_p = ProviderRepository(db)
    provider_record = await repo_p.get_by_provider_name("cloudinary")
    if provider_record:
        provider_service = provider_registry.get("cloudinary")
        if provider_service:
            credentials = repo_p.get_decrypted_credentials(provider_record)
            res = await provider_service.execute(
                operation="upload_image",
                credentials=credentials,
                params={
                    "folder": "user_avatars",
                    "public_id": f"avatar_{current_user.id}_{int(datetime.now().timestamp())}",
                },
                file_bytes=contents,
                filename=file.filename,
            )
            if res.success and res.data and "secure_url" in res.data:
                avatar_url = res.data["secure_url"]

    # If Cloudinary is not configured or fails, create an optimized inline data URL
    if not avatar_url:
        b64 = base64.b64encode(contents).decode("utf-8")
        avatar_url = f"data:{content_type};base64,{b64}"

    repo = UserRepository(db)
    user = await repo.get_by_id(current_user.id)
    if not user:
        raise HTTPException(status_code=404, detail={"code": "USER_NOT_FOUND", "message": "User not found"})

    user.avatar_url = avatar_url
    updated = await repo.update(user)

    return StandardResponse.ok(
        data=UserOut.model_validate(updated),
        message="Profile photo updated successfully",
    )


@router.delete("/me/avatar", response_model=StandardResponse[UserOut])
async def remove_my_avatar(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove avatar photo for current user"""
    repo = UserRepository(db)
    user = await repo.get_by_id(current_user.id)
    if not user:
        raise HTTPException(status_code=404, detail={"code": "USER_NOT_FOUND", "message": "User not found"})

    user.avatar_url = None
    updated = await repo.update(user)
    return StandardResponse.ok(
        data=UserOut.model_validate(updated),
        message="Profile photo removed successfully",
    )


@router.post("/me/change-password", response_model=StandardResponse[dict])
async def change_my_password(
    payload: ChangePasswordRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Secure password change for currently authenticated user.
    Verifies current password and securely hashes new password.
    """
    repo = UserRepository(db)
    user = await repo.get_by_id(current_user.id)
    if not user:
        raise HTTPException(status_code=404, detail={"code": "USER_NOT_FOUND", "message": "User not found"})

    if not verify_password(payload.current_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_CURRENT_PASSWORD", "message": "Current password does not match records"},
        )

    if payload.new_password == payload.current_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "PASSWORD_UNCHANGED", "message": "New password cannot be identical to current password"},
        )

    user.hashed_password = hash_password(payload.new_password)
    await repo.update(user)

    return StandardResponse.ok(
        data={"updated": True},
        message="Password updated successfully",
    )


@router.get("/me/security", response_model=StandardResponse[SecurityDetailsOut])
async def get_my_security_overview(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve security and session metrics for current user"""
    # Count active API keys owned by user
    stmt = select(func.count(ApiKey.id)).where(ApiKey.user_id == current_user.id, ApiKey.is_active == True)
    res = await db.execute(stmt)
    active_keys_count = res.scalar() or 0

    return StandardResponse.ok(
        data=SecurityDetailsOut(
            email=current_user.email,
            role=current_user.role,
            created_at=current_user.created_at,
            last_login_at=current_user.last_login_at,
            active_api_keys_count=active_keys_count,
            password_last_changed=current_user.updated_at,
        ),
        message="Security overview retrieved",
    )


# ==========================================
# Administrative User Management Endpoints
# ==========================================

@router.get("", response_model=StandardResponse[List[UserOut]])
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    repo = UserRepository(db)
    users = await repo.list_users(skip=skip, limit=limit)
    return StandardResponse.ok(
        data=[UserOut.model_validate(u) for u in users],
        message="Users retrieved",
    )


@router.post("", response_model=StandardResponse[UserOut])
async def create_user(
    payload: UserCreate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    repo = UserRepository(db)
    existing = await repo.get_by_email(payload.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "DUPLICATE_EMAIL", "message": "Email already registered"},
        )

    user = User(
        id=uuid.uuid4(),
        email=payload.email.lower().strip(),
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        role=payload.role,
        is_active=True,
    )
    created = await repo.create(user)
    return StandardResponse.ok(
        data=UserOut.model_validate(created),
        message="User created successfully",
    )


@router.patch("/{user_id}", response_model=StandardResponse[UserOut])
async def update_user(
    user_id: uuid.UUID,
    payload: UserUpdate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    repo = UserRepository(db)
    user = await repo.get_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "USER_NOT_FOUND", "message": "User not found"},
        )

    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.role is not None:
        user.role = payload.role
    if payload.is_active is not None:
        user.is_active = payload.is_active
    if payload.password:
        user.hashed_password = hash_password(payload.password)

    updated = await repo.update(user)
    return StandardResponse.ok(
        data=UserOut.model_validate(updated),
        message="User updated successfully",
    )


@router.delete("/{user_id}", response_model=StandardResponse[dict])
async def delete_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    if user_id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "CANNOT_DELETE_SELF", "message": "Cannot delete current admin user account"},
        )
    repo = UserRepository(db)
    deleted = await repo.delete(user_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "USER_NOT_FOUND", "message": "User not found"},
        )
    return StandardResponse.ok(
        data={"deleted_id": str(user_id)},
        message="User deleted successfully",
    )
