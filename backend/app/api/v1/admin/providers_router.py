import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.common import StandardResponse
from app.schemas.provider import (
    ProviderBlueprintOut,
    TestConnectionRequest,
    TestConnectionResponse,
    ProviderCreateRequest,
    ProviderUpdateRequest,
    ProviderOut,
)
from app.services.providers.registry import provider_registry
from app.repositories.provider_repository import ProviderRepository
from app.repositories.api_service_repository import ApiServiceRepository
from app.models.api_service import ApiService
from app.api.dependencies import get_current_admin
from app.models.user import User

router = APIRouter(prefix="/admin/providers", tags=["Provider Integrations"])


@router.get("/available", response_model=StandardResponse[List[ProviderBlueprintOut]])
async def get_available_provider_templates(admin: User = Depends(get_current_admin)):
    """
    Returns available provider definitions with dynamic credential schemas and supported operations.
    """
    available = provider_registry.list_available()
    return StandardResponse.ok(
        data=[ProviderBlueprintOut(**p) for p in available],
        message="Available provider blueprints retrieved",
    )


@router.post("/test-connection", response_model=StandardResponse[TestConnectionResponse])
async def test_candidate_connection(
    payload: TestConnectionRequest,
    admin: User = Depends(get_current_admin),
):
    """
    Test provider credentials before saving. Never exposes raw credentials in logs or errors.
    """
    success, message = await provider_registry.test_connection(
        provider_name=payload.provider_name,
        credentials=payload.credentials,
    )
    if not success:
        return StandardResponse(
            success=False,
            data=TestConnectionResponse(success=False, message=message),
            message=message,
        )

    return StandardResponse.ok(
        data=TestConnectionResponse(success=True, message=message),
        message="Connection verified successfully",
    )


@router.post("", response_model=StandardResponse[ProviderOut])
async def register_provider_integration(
    payload: ProviderCreateRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """
    Register a provider with encrypted credentials at rest, and optionally auto-register
    its supported operations into the API Service Catalogue.
    """
    # 1. Verify connection first
    conn_ok, conn_msg = await provider_registry.test_connection(
        provider_name=payload.provider_name,
        credentials=payload.credentials,
    )
    if not conn_ok:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "CONNECTION_FAILED", "message": f"Provider connection test failed: {conn_msg}"},
        )

    provider_repo = ProviderRepository(db)
    integration = await provider_repo.create_integration(
        user_id=admin.id,
        provider_name=payload.provider_name,
        display_name=payload.display_name,
        credentials=payload.credentials,
        base_url=payload.base_url,
    )

    # 2. Auto-register default API catalogue services if requested
    services_count = 0
    if payload.register_default_services:
        blueprint = provider_registry.get(payload.provider_name)
        if blueprint:
            svc_repo = ApiServiceRepository(db)
            for op in blueprint.operations:
                op_slug = f"{payload.provider_name}-{op['id']}".replace("_", "-")
                # Check duplicate
                existing = await svc_repo.get_by_slug(op_slug)
                if not existing:
                    service = ApiService(
                        id=uuid.uuid4(),
                        provider_id=integration.id,
                        name=f"{blueprint.display_name} - {op['name']}",
                        slug=op_slug,
                        description=op["description"],
                        category=blueprint.category,
                        endpoint=op.get("endpoint", f"/api/v1/{payload.provider_name}/{op['id']}"),
                        method=op.get("method", "POST"),
                        version="v1",
                        status="ACTIVE",
                        requires_auth=True,
                        rate_limit_per_minute=100,
                        documentation={
                            "summary": op["description"],
                            "parameters": op.get("parameters", []),
                            "responses": {"200": {"description": "Operation successful"}},
                        },
                        config={"operation": op["id"], "provider": payload.provider_name},
                    )
                    await svc_repo.create(service)
                    services_count += 1

    masked = provider_repo.get_masked_credentials(integration)
    out = ProviderOut(
        id=integration.id,
        provider_name=integration.provider_name,
        display_name=integration.display_name,
        masked_credentials=masked,
        base_url=integration.base_url,
        status=integration.status,
        last_tested_at=integration.last_tested_at,
        created_at=integration.created_at,
        updated_at=integration.updated_at,
        services_count=services_count,
    )

    return StandardResponse.ok(
        data=out,
        message=f"Provider '{payload.display_name}' registered successfully with {services_count} active API services.",
    )


@router.get("", response_model=StandardResponse[List[ProviderOut]])
async def list_registered_providers(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """
    List all registered provider integrations with masked credentials.
    """
    provider_repo = ProviderRepository(db)
    integrations = await provider_repo.list_all()

    result = []
    for item in integrations:
        masked = provider_repo.get_masked_credentials(item)
        result.append(
            ProviderOut(
                id=item.id,
                provider_name=item.provider_name,
                display_name=item.display_name,
                masked_credentials=masked,
                base_url=item.base_url,
                status=item.status,
                last_tested_at=item.last_tested_at,
                created_at=item.created_at,
                updated_at=item.updated_at,
                services_count=len(item.api_services),
            )
        )

    return StandardResponse.ok(data=result, message="Registered providers retrieved")


@router.get("/{provider_id}", response_model=StandardResponse[ProviderOut])
async def get_provider_details(
    provider_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    provider_repo = ProviderRepository(db)
    item = await provider_repo.get_by_id(provider_id)
    if not item:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Provider not found"})

    masked = provider_repo.get_masked_credentials(item)
    return StandardResponse.ok(
        data=ProviderOut(
            id=item.id,
            provider_name=item.provider_name,
            display_name=item.display_name,
            masked_credentials=masked,
            base_url=item.base_url,
            status=item.status,
            last_tested_at=item.last_tested_at,
            created_at=item.created_at,
            updated_at=item.updated_at,
            services_count=len(item.api_services),
        ),
        message="Provider details retrieved",
    )


@router.patch("/{provider_id}", response_model=StandardResponse[ProviderOut])
async def update_provider_credentials(
    provider_id: uuid.UUID,
    payload: ProviderUpdateRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    provider_repo = ProviderRepository(db)
    item = await provider_repo.get_by_id(provider_id)
    if not item:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Provider not found"})

    updated = await provider_repo.update_credentials(
        provider_id=provider_id,
        new_credentials=payload.credentials or {},
        display_name=payload.display_name,
    )

    masked = provider_repo.get_masked_credentials(updated)
    return StandardResponse.ok(
        data=ProviderOut(
            id=updated.id,
            provider_name=updated.provider_name,
            display_name=updated.display_name,
            masked_credentials=masked,
            base_url=updated.base_url,
            status=updated.status,
            last_tested_at=updated.last_tested_at,
            created_at=updated.created_at,
            updated_at=updated.updated_at,
            services_count=len(updated.api_services),
        ),
        message="Provider credentials updated securely",
    )


@router.delete("/{provider_id}", response_model=StandardResponse[dict])
async def delete_provider_integration(
    provider_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    provider_repo = ProviderRepository(db)
    deleted = await provider_repo.delete(provider_id)
    if not deleted:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Provider not found"})

    return StandardResponse.ok(
        data={"deleted_id": str(provider_id)},
        message="Provider integration and associated APIs removed",
    )
