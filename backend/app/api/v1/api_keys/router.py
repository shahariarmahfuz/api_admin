import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.common import StandardResponse
from app.schemas.api_key import ApiKeyCreate, ApiKeyUpdate, ApiKeyOut, ApiKeyCreatedOut
from app.services.api_key_service import ApiKeyService
from app.api.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api_keys", tags=["API Keys"])


@router.get("", response_model=StandardResponse[List[ApiKeyOut]])
async def list_api_keys(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    key_service = ApiKeyService(db)
    # If admin, list all; if user, list user's keys
    user_id = None if current_user.role == "admin" else current_user.id
    keys = await key_service.list_keys(user_id=user_id)
    return StandardResponse.ok(
        data=[ApiKeyOut.model_validate(k) for k in keys],
        message="API keys retrieved successfully",
    )


@router.post("", response_model=StandardResponse[ApiKeyCreatedOut])
async def create_api_key(
    payload: ApiKeyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    key_service = ApiKeyService(db)
    key, raw_secret = await key_service.create_api_key(current_user.id, payload)
    
    out = ApiKeyCreatedOut(
        id=key.id,
        user_id=key.user_id,
        name=key.name,
        key_prefix=key.key_prefix,
        rate_limit_per_minute=key.rate_limit_per_minute,
        rate_limit_per_day=key.rate_limit_per_day,
        is_active=key.is_active,
        request_count=key.request_count,
        last_used_at=key.last_used_at,
        created_at=key.created_at,
        updated_at=key.updated_at,
        secret_key=raw_secret,
    )
    return StandardResponse.ok(
        data=out,
        message="API key generated successfully. Save this secret key now as it will not be displayed again.",
    )


@router.patch("/{key_id}", response_model=StandardResponse[ApiKeyOut])
async def update_api_key(
    key_id: uuid.UUID,
    payload: ApiKeyUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    key_service = ApiKeyService(db)
    key = await key_service.get_key_by_id(key_id)
    if not key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "API key not found"},
        )
    if current_user.role != "admin" and key.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "FORBIDDEN", "message": "Permission denied"},
        )

    updated = await key_service.update_key(key_id, payload)
    return StandardResponse.ok(
        data=ApiKeyOut.model_validate(updated),
        message="API key updated successfully",
    )


@router.delete("/{key_id}", response_model=StandardResponse[dict])
async def revoke_api_key(
    key_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    key_service = ApiKeyService(db)
    key = await key_service.get_key_by_id(key_id)
    if not key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "API key not found"},
        )
    if current_user.role != "admin" and key.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "FORBIDDEN", "message": "Permission denied"},
        )

    await key_service.revoke_key(key_id)
    return StandardResponse.ok(
        data={"revoked_id": str(key_id)},
        message="API key permanently revoked",
    )
