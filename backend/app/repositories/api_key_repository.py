import uuid
from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.api_key import ApiKey


class ApiKeyRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, key_id: uuid.UUID) -> Optional[ApiKey]:
        stmt = select(ApiKey).where(ApiKey.id == key_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_hashed_key(self, hashed_key: str) -> Optional[ApiKey]:
        stmt = select(ApiKey).where(ApiKey.hashed_key == hashed_key)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_all(self, skip: int = 0, limit: int = 50) -> List[ApiKey]:
        stmt = select(ApiKey).order_by(ApiKey.created_at.desc()).offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def list_for_user(self, user_id: uuid.UUID) -> List[ApiKey]:
        stmt = select(ApiKey).where(ApiKey.user_id == user_id).order_by(ApiKey.created_at.desc())
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def create(self, api_key: ApiKey) -> ApiKey:
        self.db.add(api_key)
        await self.db.commit()
        await self.db.refresh(api_key)
        return api_key

    async def update(self, api_key: ApiKey) -> ApiKey:
        await self.db.commit()
        await self.db.refresh(api_key)
        return api_key

    async def record_usage(self, key_id: uuid.UUID) -> None:
        """Atomic usage tracking"""
        stmt = (
            update(ApiKey)
            .where(ApiKey.id == key_id)
            .values(
                request_count=ApiKey.request_count + 1,
                last_used_at=datetime.now(timezone.utc),
            )
        )
        await self.db.execute(stmt)
        await self.db.commit()

    async def delete(self, key_id: uuid.UUID) -> bool:
        key = await self.get_by_id(key_id)
        if key:
            await self.db.delete(key)
            await self.db.commit()
            return True
        return False
