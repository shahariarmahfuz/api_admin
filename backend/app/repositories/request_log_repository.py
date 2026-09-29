import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy import select, func, desc, case
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.request_log import RequestLog
from app.models.api_key import ApiKey
from app.models.api_service import ApiService


class RequestLogRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, log_entry: RequestLog) -> RequestLog:
        self.db.add(log_entry)
        await self.db.commit()
        return log_entry

    async def list_logs(
        self,
        skip: int = 0,
        limit: int = 50,
        status_code: Optional[int] = None,
        endpoint: Optional[str] = None,
        api_key_id: Optional[uuid.UUID] = None,
        category: Optional[str] = None,
        failed_only: bool = False,
    ) -> tuple[List[RequestLog], int]:
        stmt = select(RequestLog)
        count_stmt = select(func.count(RequestLog.id))

        if failed_only:
            stmt = stmt.where(RequestLog.status_code >= 400)
            count_stmt = count_stmt.where(RequestLog.status_code >= 400)
        elif status_code:
            stmt = stmt.where(RequestLog.status_code == status_code)
            count_stmt = count_stmt.where(RequestLog.status_code == status_code)

        if endpoint:
            stmt = stmt.where(RequestLog.endpoint.ilike(f"%{endpoint}%"))
            count_stmt = count_stmt.where(RequestLog.endpoint.ilike(f"%{endpoint}%"))

        if api_key_id:
            stmt = stmt.where(RequestLog.api_key_id == api_key_id)
            count_stmt = count_stmt.where(RequestLog.api_key_id == api_key_id)

        if category:
            stmt = stmt.where(RequestLog.category == category)
            count_stmt = count_stmt.where(RequestLog.category == category)

        total_res = await self.db.execute(count_stmt)
        total = total_res.scalar() or 0

        stmt = stmt.order_by(RequestLog.created_at.desc()).offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        return list(result.scalars().all()), total

    async def get_dashboard_stats(self) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        today_start = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)

        # Aggregate requests stats
        stmt = select(
            func.count(RequestLog.id).label("total_requests"),
            func.coalesce(func.sum(case((RequestLog.created_at >= today_start, 1), else_=0)), 0).label("requests_today"),
            func.coalesce(func.sum(case((RequestLog.status_code < 400, 1), else_=0)), 0).label("successful_requests"),
            func.coalesce(func.sum(case((RequestLog.status_code >= 400, 1), else_=0)), 0).label("failed_requests"),
            func.coalesce(func.avg(RequestLog.response_time_ms), 0.0).label("avg_latency"),
        )
        res = await self.db.execute(stmt)
        row = res.one()

        total = row.total_requests or 0
        failed = row.failed_requests or 0
        error_rate = round((failed / total * 100), 2) if total > 0 else 0.0

        # Count active API keys
        key_stmt = select(func.count(ApiKey.id)).where(ApiKey.is_active == True)
        key_res = await self.db.execute(key_stmt)
        active_keys = key_res.scalar() or 0

        # Count active APIs
        svc_stmt = select(func.count(ApiService.id)).where(ApiService.status == "ACTIVE")
        svc_res = await self.db.execute(svc_stmt)
        active_apis = svc_res.scalar() or 0

        return {
            "total_requests": total,
            "requests_today": row.requests_today or 0,
            "successful_requests": row.successful_requests or 0,
            "failed_requests": failed,
            "error_rate_percentage": error_rate,
            "average_response_time_ms": round(float(row.avg_latency), 2),
            "active_api_keys": active_keys,
            "active_apis": active_apis,
            "system_status": "OPERATIONAL",
        }

    async def get_top_endpoints(self, limit: int = 10) -> List[Dict[str, Any]]:
        stmt = (
            select(
                RequestLog.endpoint,
                RequestLog.method,
                func.count(RequestLog.id).label("total_calls"),
                func.coalesce(func.avg(RequestLog.response_time_ms), 0.0).label("avg_latency"),
                func.coalesce(func.sum(case((RequestLog.status_code >= 400, 1), else_=0)), 0).label("error_count"),
            )
            .group_by(RequestLog.endpoint, RequestLog.method)
            .order_by(desc("total_calls"))
            .limit(limit)
        )
        res = await self.db.execute(stmt)
        rows = res.all()
        return [
            {
                "endpoint": r.endpoint,
                "method": r.method,
                "total_calls": r.total_calls,
                "avg_latency_ms": round(float(r.avg_latency), 2),
                "error_count": r.error_count,
            }
            for r in rows
        ]

    async def get_status_code_distribution(self) -> Dict[str, int]:
        stmt = (
            select(RequestLog.status_code, func.count(RequestLog.id))
            .group_by(RequestLog.status_code)
        )
        res = await self.db.execute(stmt)
        return {str(code): count for code, count in res.all()}
