import uuid
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.api_service import ApiService
from app.repositories.api_service_repository import ApiServiceRepository
from app.schemas.api_service import ApiServiceCreate, ApiServiceUpdate


class ApiServiceManager:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = ApiServiceRepository(db)

    async def list_services(
        self,
        category: Optional[str] = None,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[ApiService]:
        return await self.repo.list_services(category, status, skip, limit)

    async def get_by_id(self, service_id: uuid.UUID) -> Optional[ApiService]:
        return await self.repo.get_by_id(service_id)

    async def get_by_slug(self, slug: str) -> Optional[ApiService]:
        return await self.repo.get_by_slug(slug)

    async def create_service(self, payload: ApiServiceCreate) -> ApiService:
        existing = await self.repo.get_by_slug(payload.slug)
        if existing:
            raise ValueError(f"Service with slug '{payload.slug}' already exists.")

        service = ApiService(
            id=uuid.uuid4(),
            name=payload.name,
            slug=payload.slug,
            description=payload.description,
            category=payload.category,
            endpoint=payload.endpoint,
            method=payload.method.upper(),
            version=payload.version,
            status=payload.status,
            requires_auth=payload.requires_auth,
            rate_limit_per_minute=payload.rate_limit_per_minute,
            documentation=payload.documentation or {},
        )
        return await self.repo.create(service)

    async def update_service(self, service_id: uuid.UUID, payload: ApiServiceUpdate) -> Optional[ApiService]:
        service = await self.repo.get_by_id(service_id)
        if not service:
            return None

        if payload.name is not None:
            service.name = payload.name
        if payload.description is not None:
            service.description = payload.description
        if payload.category is not None:
            service.category = payload.category
        if payload.endpoint is not None:
            service.endpoint = payload.endpoint
        if payload.method is not None:
            service.method = payload.method.upper()
        if payload.version is not None:
            service.version = payload.version
        if payload.status is not None:
            service.status = payload.status
        if payload.requires_auth is not None:
            service.requires_auth = payload.requires_auth
        if payload.rate_limit_per_minute is not None:
            service.rate_limit_per_minute = payload.rate_limit_per_minute
        if payload.documentation is not None:
            service.documentation = payload.documentation

        return await self.repo.update(service)

    async def delete_service(self, service_id: uuid.UUID) -> bool:
        return await self.repo.delete(service_id)
