import uuid
from typing import Optional, List
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.api_service import ApiService


class ApiServiceRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, service_id: uuid.UUID) -> Optional[ApiService]:
        stmt = select(ApiService).where(ApiService.id == service_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_slug(self, slug: str) -> Optional[ApiService]:
        stmt = select(ApiService).where(ApiService.slug == slug)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_services(
        self,
        category: Optional[str] = None,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[ApiService]:
        stmt = select(ApiService)
        if category:
            stmt = stmt.where(ApiService.category == category)
        if status:
            stmt = stmt.where(ApiService.status == status)
        stmt = stmt.order_by(ApiService.category.asc(), ApiService.name.asc()).offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def count_active(self) -> int:
        stmt = select(func.count(ApiService.id)).where(ApiService.status == "ACTIVE")
        result = await self.db.execute(stmt)
        return result.scalar() or 0

    async def create(self, service: ApiService) -> ApiService:
        self.db.add(service)
        await self.db.commit()
        await self.db.refresh(service)
        return service

    async def update(self, service: ApiService) -> ApiService:
        await self.db.commit()
        await self.db.refresh(service)
        return service

    async def delete(self, service_id: uuid.UUID) -> bool:
        service = await self.get_by_id(service_id)
        if service:
            await self.db.delete(service)
            await self.db.commit()
            return True
        return False
