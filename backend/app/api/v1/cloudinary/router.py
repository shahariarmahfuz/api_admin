import os
import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.schemas.common import StandardResponse
from app.api.dependencies import require_api_key
from app.repositories.provider_repository import ProviderRepository
from app.services.providers.registry import provider_registry

router = APIRouter(prefix="/cloudinary", tags=["Cloudinary Media Gateway"])


class CloudinaryTransformRequest(BaseModel):
    public_id: str
    width: Optional[int] = None
    height: Optional[int] = None
    crop: Optional[str] = "fill"
    quality: Optional[str] = "auto"
    format: Optional[str] = "webp"


@router.post("/upload", response_model=StandardResponse[dict])
async def upload_to_cloudinary(
    file: Optional[UploadFile] = File(None),
    file_url: Optional[str] = Form(None),
    folder: Optional[str] = Form("api_gateway_uploads"),
    public_id: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    auth=Depends(require_api_key),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload an image asset to Cloudinary via the platform gateway.
    Requires a valid API key and a configured Cloudinary Provider Integration.
    """
    repo = ProviderRepository(db)
    provider_record = await repo.get_by_provider_name("cloudinary")
    if not provider_record:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "PROVIDER_NOT_CONFIGURED",
                "message": "Cloudinary provider integration is not configured. An administrator must register Cloudinary credentials first.",
            },
        )

    provider_service = provider_registry.get("cloudinary")
    if not provider_service:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "PROVIDER_UNAVAILABLE", "message": "Cloudinary provider engine not loaded"},
        )

    credentials = repo.get_decrypted_credentials(provider_record)

    file_bytes = None
    filename = None
    if file:
        file_bytes = await file.read()
        filename = file.filename

    if not file_bytes and not file_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "PAYLOAD_REQUIRED", "message": "Either 'file' or 'file_url' must be provided."},
        )

    parsed_tags = [t.strip() for t in tags.split(",") if t.strip()] if tags else None

    result = await provider_service.execute(
        operation="upload_image",
        credentials=credentials,
        params={
            "folder": folder,
            "public_id": public_id,
            "tags": parsed_tags,
            "file_url": file_url,
        },
        file_bytes=file_bytes,
        filename=filename,
    )

    if not result.success:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={
                "code": "CLOUDINARY_UPLOAD_FAILED",
                "message": result.error_message or "Cloudinary rejected the upload request",
            },
        )

    return StandardResponse.ok(
        data=result.data,
        message="Asset uploaded to Cloudinary successfully",
    )


@router.get("/resource/{public_id:path}", response_model=StandardResponse[dict])
async def get_cloudinary_resource(
    public_id: str,
    auth=Depends(require_api_key),
    db: AsyncSession = Depends(get_db),
):
    """
    Fetch details of a Cloudinary asset by public_id.
    """
    repo = ProviderRepository(db)
    provider_record = await repo.get_by_provider_name("cloudinary")
    if not provider_record:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "PROVIDER_NOT_CONFIGURED",
                "message": "Cloudinary provider integration is not configured.",
            },
        )

    provider_service = provider_registry.get("cloudinary")
    credentials = repo.get_decrypted_credentials(provider_record)

    result = await provider_service.execute(
        operation="get_resource",
        credentials=credentials,
        params={"public_id": public_id},
    )

    if not result.success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND if "not found" in (result.error_message or "").lower() else status.HTTP_502_BAD_GATEWAY,
            detail={
                "code": "RESOURCE_FETCH_FAILED",
                "message": result.error_message or "Could not retrieve Cloudinary resource",
            },
        )

    return StandardResponse.ok(
        data=result.data,
        message="Cloudinary resource retrieved successfully",
    )


@router.post("/transform", response_model=StandardResponse[dict])
async def generate_transformed_url(
    payload: CloudinaryTransformRequest,
    auth=Depends(require_api_key),
    db: AsyncSession = Depends(get_db),
):
    """
    Generate an optimized on-the-fly Cloudinary delivery URL with transformations.
    """
    repo = ProviderRepository(db)
    provider_record = await repo.get_by_provider_name("cloudinary")
    if not provider_record:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"code": "PROVIDER_NOT_CONFIGURED", "message": "Cloudinary provider integration is not configured."},
        )

    provider_service = provider_registry.get("cloudinary")
    credentials = repo.get_decrypted_credentials(provider_record)

    result = await provider_service.execute(
        operation="generate_url",
        credentials=credentials,
        params=payload.model_dump(),
    )

    return StandardResponse.ok(
        data=result.data,
        message="Transformed delivery URL generated successfully",
    )


@router.delete("/resource/{public_id:path}", response_model=StandardResponse[dict])
async def delete_cloudinary_resource(
    public_id: str,
    auth=Depends(require_api_key),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete an asset from Cloudinary by public_id.
    """
    repo = ProviderRepository(db)
    provider_record = await repo.get_by_provider_name("cloudinary")
    if not provider_record:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"code": "PROVIDER_NOT_CONFIGURED", "message": "Cloudinary provider integration is not configured."},
        )

    provider_service = provider_registry.get("cloudinary")
    credentials = repo.get_decrypted_credentials(provider_record)

    result = await provider_service.execute(
        operation="delete_resource",
        credentials=credentials,
        params={"public_id": public_id},
    )

    if not result.success:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={
                "code": "RESOURCE_DELETE_FAILED",
                "message": result.error_message or "Could not delete Cloudinary resource",
            },
        )

    return StandardResponse.ok(
        data=result.data,
        message="Cloudinary resource deleted successfully",
    )
