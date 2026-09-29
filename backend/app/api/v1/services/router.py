import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.common import StandardResponse
from app.schemas.api_service import ApiServiceCreate, ApiServiceUpdate, ApiServiceOut
from app.services.api_service_manager import ApiServiceManager
from app.api.dependencies import get_current_admin

router = APIRouter(prefix="/services", tags=["API Management"])


@router.get("", response_model=StandardResponse[List[ApiServiceOut]])
async def list_api_services(
    category: Optional[str] = Query(None, description="Filter by category"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    manager = ApiServiceManager(db)
    services = await manager.list_services(category=category, status=status_filter, skip=skip, limit=limit)
    return StandardResponse.ok(
        data=[ApiServiceOut.model_validate(s) for s in services],
        message="API services retrieved successfully",
    )


@router.get("/{slug}", response_model=StandardResponse[ApiServiceOut])
async def get_api_service_by_slug(
    slug: str,
    db: AsyncSession = Depends(get_db),
):
    manager = ApiServiceManager(db)
    service = await manager.get_by_slug(slug)
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "SERVICE_NOT_FOUND", "message": f"API service '{slug}' not found"},
        )
    return StandardResponse.ok(
        data=ApiServiceOut.model_validate(service),
        message="API service details retrieved",
    )


@router.post("", response_model=StandardResponse[ApiServiceOut])
async def create_api_service(
    payload: ApiServiceCreate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    manager = ApiServiceManager(db)
    try:
        service = await manager.create_service(payload)
        return StandardResponse.ok(
            data=ApiServiceOut.model_validate(service),
            message="New API service registered in platform catalogue",
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "DUPLICATE_SLUG", "message": str(e)},
        )


@router.patch("/{service_id}", response_model=StandardResponse[ApiServiceOut])
async def update_api_service(
    service_id: uuid.UUID,
    payload: ApiServiceUpdate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    manager = ApiServiceManager(db)
    updated = await manager.update_service(service_id, payload)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "SERVICE_NOT_FOUND", "message": "API service not found"},
        )
    return StandardResponse.ok(
        data=ApiServiceOut.model_validate(updated),
        message="API service updated successfully",
    )


@router.delete("/{service_id}", response_model=StandardResponse[dict])
async def delete_api_service(
    service_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    manager = ApiServiceManager(db)
    deleted = await manager.delete_service(service_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "SERVICE_NOT_FOUND", "message": "API service not found"},
        )
    return StandardResponse.ok(
        data={"deleted_id": str(service_id)},
        message="API service removed from catalogue",
    )
