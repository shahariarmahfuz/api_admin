import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.common import StandardResponse, PaginatedData
from app.schemas.request_log import RequestLogOut, DashboardStats, EndpointUsageStat
from app.services.analytics_service import AnalyticsService
from app.api.dependencies import get_current_admin

router = APIRouter(prefix="/logs", tags=["Monitoring & Logs"])


@router.get("", response_model=StandardResponse[PaginatedData[RequestLogOut]])
async def list_request_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    status_code: Optional[int] = Query(None),
    endpoint: Optional[str] = Query(None),
    api_key_id: Optional[uuid.UUID] = Query(None),
    category: Optional[str] = Query(None),
    failed_only: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    skip = (page - 1) * page_size
    analytics = AnalyticsService(db)
    logs, total = await analytics.get_request_logs(
        skip=skip,
        limit=page_size,
        status_code=status_code,
        endpoint=endpoint,
        api_key_id=api_key_id,
        category=category,
        failed_only=failed_only,
    )
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return StandardResponse.ok(
        data=PaginatedData(
            items=[RequestLogOut.model_validate(l) for l in logs],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        ),
        message="Request logs retrieved",
    )


@router.get("/stats", response_model=StandardResponse[DashboardStats])
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    analytics = AnalyticsService(db)
    stats = await analytics.get_dashboard_stats()
    return StandardResponse.ok(
        data=stats,
        message="Platform dashboard statistics calculated",
    )


@router.get("/top_endpoints", response_model=StandardResponse[List[EndpointUsageStat]])
async def get_top_endpoints(
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    analytics = AnalyticsService(db)
    top = await analytics.get_top_endpoints(limit)
    return StandardResponse.ok(
        data=[EndpointUsageStat(**item) for item in top],
        message="Top endpoint usage statistics retrieved",
    )


@router.get("/status_distribution", response_model=StandardResponse[dict])
async def get_status_distribution(
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    analytics = AnalyticsService(db)
    distribution = await analytics.get_status_code_distribution()
    return StandardResponse.ok(
        data=distribution,
        message="HTTP status code distribution",
    )
