import uuid
from typing import Optional, List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import generate_api_key, hash_api_key
from app.models.api_key import ApiKey
from app.repositories.api_key_repository import ApiKeyRepository
from app.schemas.api_key import ApiKeyCreate, ApiKeyUpdate


class ApiKeyService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = ApiKeyRepository(db)

    async def create_api_key(self, user_id: uuid.UUID, payload: ApiKeyCreate) -> Tuple[ApiKey, str]:
        full_key, prefix, hashed_key = generate_api_key("orv_live")
        api_key = ApiKey(
            id=uuid.uuid4(),
            user_id=user_id,
            name=payload.name,
            key_prefix=prefix,
            hashed_key=hashed_key,
            rate_limit_per_minute=payload.rate_limit_per_minute,
            rate_limit_per_day=payload.rate_limit_per_day,
            is_active=True,
            request_count=0,
        )
        created = await self.repo.create(api_key)
        return created, full_key

    async def list_keys(self, user_id: Optional[uuid.UUID] = None, skip: int = 0, limit: int = 50) -> List[ApiKey]:
        if user_id:
            return await self.repo.list_for_user(user_id)
        return await self.repo.list_all(skip=skip, limit=limit)

    async def get_key_by_id(self, key_id: uuid.UUID) -> Optional[ApiKey]:
        return await self.repo.get_by_id(key_id)

    async def update_key(self, key_id: uuid.UUID, payload: ApiKeyUpdate) -> Optional[ApiKey]:
        key = await self.repo.get_by_id(key_id)
        if not key:
            return None
        if payload.name is not None:
            key.name = payload.name
        if payload.rate_limit_per_minute is not None:
            key.rate_limit_per_minute = payload.rate_limit_per_minute
        if payload.rate_limit_per_day is not None:
            key.rate_limit_per_day = payload.rate_limit_per_day
        if payload.is_active is not None:
            key.is_active = payload.is_active
        return await self.repo.update(key)

    async def revoke_key(self, key_id: uuid.UUID) -> bool:
        return await self.repo.delete(key_id)

    async def validate_api_key(self, raw_key: str) -> Optional[ApiKey]:
        hashed = hash_api_key(raw_key)
        key = await self.repo.get_by_hashed_key(hashed)
        if key and key.is_active:
            # Asynchronously record usage counter
            await self.repo.record_usage(key.id)
            return key
        return None
