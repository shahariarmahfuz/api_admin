import uuid
from typing import Optional, List
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.api_test_history import ApiTestHistory


class TestHistoryRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def record_test(
        self,
        provider_name: str,
        operation: str,
        status_code: int,
        response_time_ms: float,
        success: bool,
        provider_id: Optional[uuid.UUID] = None,
        service_id: Optional[uuid.UUID] = None,
    ) -> ApiTestHistory:
        entry = ApiTestHistory(
            id=uuid.uuid4(),
            provider_id=provider_id,
            service_id=service_id,
            provider_name=provider_name,
            operation=operation,
            status_code=status_code,
            response_time_ms=response_time_ms,
            success=success,
        )
        self.db.add(entry)
        await self.db.commit()
        await self.db.refresh(entry)
        return entry

    async def list_recent(self, limit: int = 20) -> List[ApiTestHistory]:
        stmt = select(ApiTestHistory).order_by(desc(ApiTestHistory.created_at)).limit(limit)
        res = await self.db.execute(stmt)
        return list(res.scalars().all())
