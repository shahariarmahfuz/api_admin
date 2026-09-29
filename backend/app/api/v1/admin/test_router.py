import time
import uuid
import json
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.common import StandardResponse
from app.schemas.provider import (
    AdminExecuteTestRequest,
    AdminExecuteTestResponse,
    TestHistoryOut,
)
from app.services.providers.registry import provider_registry
from app.repositories.provider_repository import ProviderRepository
from app.repositories.test_history_repository import TestHistoryRepository
from app.api.dependencies import get_current_admin
from app.models.user import User

router = APIRouter(prefix="/admin/tester", tags=["Admin API Tester"])


@router.post("/execute", response_model=StandardResponse[AdminExecuteTestResponse])
async def execute_admin_test(
    payload: AdminExecuteTestRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """
    Execute a real API operation test against a provider using securely stored credentials.
    Measures latency and records lightweight test history without storing secrets.
    """
    provider_repo = ProviderRepository(db)
    history_repo = TestHistoryRepository(db)

    # 1. Retrieve provider credentials
    integration = None
    if payload.provider_id:
        integration = await provider_repo.get_by_id(payload.provider_id)
    else:
        integration = await provider_repo.get_by_provider_name(payload.provider_name)

    if not integration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "PROVIDER_NOT_CONFIGURED", "message": f"No active integration found for '{payload.provider_name}'"},
        )

    credentials = provider_repo.get_decrypted_credentials(integration)

    # 2. Execute operation and measure time
    start_time = time.perf_counter()
    status_code = 200
    success = True
    error_msg = None
    data = None

    try:
        data = await provider_registry.execute_operation(
            provider_name=payload.provider_name,
            operation=payload.operation,
            credentials=credentials,
            params=payload.parameters,
        )
    except Exception as e:
        success = False
        status_code = 400
        error_msg = str(e)
    finally:
        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)

        # Record test history safely (no secrets stored)
        await history_repo.record_test(
            provider_id=integration.id,
            service_id=payload.service_id,
            provider_name=payload.provider_name,
            operation=payload.operation,
            status_code=status_code,
            response_time_ms=latency_ms,
            success=success,
        )

    return StandardResponse.ok(
        data=AdminExecuteTestResponse(
            success=success,
            status_code=status_code,
            response_time_ms=latency_ms,
            data=data,
            error=error_msg,
        ),
        message="Test request executed",
    )


@router.post("/execute-upload", response_model=StandardResponse[AdminExecuteTestResponse])
async def execute_admin_upload_test(
    provider_id: uuid.UUID = Form(...),
    operation: str = Form("upload_image"),
    folder: Optional[str] = Form(None),
    public_id: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """
    Execute a real file upload test to Cloudinary from the Admin API Tester.
    """
    provider_repo = ProviderRepository(db)
    history_repo = TestHistoryRepository(db)

    integration = await provider_repo.get_by_id(provider_id)
    if not integration:
        raise HTTPException(
            status_code=404,
            detail={"code": "PROVIDER_NOT_FOUND", "message": "Provider integration not found"},
        )

    credentials = provider_repo.get_decrypted_credentials(integration)

    start_time = time.perf_counter()
    status_code = 200
    success = True
    error_msg = None
    data = None

    try:
        file_bytes = await file.read()
        files = {"file": (file.filename, file_bytes, file.content_type)}
        params = {"folder": folder, "public_id": public_id, "tags": tags}

        data = await provider_registry.execute_operation(
            provider_name=integration.provider_name,
            operation=operation,
            credentials=credentials,
            params=params,
            files=files,
        )
    except Exception as e:
        success = False
        status_code = 400
        error_msg = str(e)
    finally:
        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
        await history_repo.record_test(
            provider_id=integration.id,
            provider_name=integration.provider_name,
            operation=operation,
            status_code=status_code,
            response_time_ms=latency_ms,
            success=success,
        )

    return StandardResponse.ok(
        data=AdminExecuteTestResponse(
            success=success,
            status_code=status_code,
            response_time_ms=latency_ms,
            data=data,
            error=error_msg,
        ),
        message="Upload test executed",
    )


@router.get("/history", response_model=StandardResponse[List[TestHistoryOut]])
async def get_test_history(
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    history_repo = TestHistoryRepository(db)
    records = await history_repo.list_recent(limit=limit)
    return StandardResponse.ok(
        data=[TestHistoryOut.model_validate(r) for r in records],
        message="Test history retrieved",
    )
