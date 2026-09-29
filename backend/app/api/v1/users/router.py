import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import hash_password
from app.schemas.common import StandardResponse
from app.schemas.auth import UserOut, UserCreate, UserUpdate
from app.repositories.user_repository import UserRepository
from app.models.user import User
from app.api.dependencies import get_current_admin

router = APIRouter(prefix="/users", tags=["User Management"])


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
