import uuid
from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.request_log import RequestLog
from app.repositories.request_log_repository import RequestLogRepository
from app.schemas.request_log import DashboardStats


class AnalyticsService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = RequestLogRepository(db)

    async def get_dashboard_stats(self) -> DashboardStats:
        stats = await self.repo.get_dashboard_stats()
        return DashboardStats(**stats)

    async def get_request_logs(
        self,
        skip: int = 0,
        limit: int = 50,
        status_code: Optional[int] = None,
        endpoint: Optional[str] = None,
        api_key_id: Optional[uuid.UUID] = None,
        category: Optional[str] = None,
        failed_only: bool = False,
    ) -> tuple[List[RequestLog], int]:
        return await self.repo.list_logs(
            skip=skip,
            limit=limit,
            status_code=status_code,
            endpoint=endpoint,
            api_key_id=api_key_id,
            category=category,
            failed_only=failed_only,
        )

    async def get_top_endpoints(self, limit: int = 10) -> List[Dict[str, Any]]:
        return await self.repo.get_top_endpoints(limit)

    async def get_status_code_distribution(self) -> Dict[str, int]:
        return await self.repo.get_status_code_distribution()
