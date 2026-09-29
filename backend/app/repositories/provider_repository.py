import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.provider_integration import ProviderIntegration
from app.models.api_service import ApiService
from app.core.encryption import encrypt_credentials, decrypt_credentials, mask_secret


class ProviderRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_integration(
        self,
        user_id: uuid.UUID,
        provider_name: str,
        display_name: str,
        credentials: Dict[str, Any],
        base_url: Optional[str] = None,
    ) -> ProviderIntegration:
        encrypted_blob = encrypt_credentials(credentials)
        integration = ProviderIntegration(
            id=uuid.uuid4(),
            user_id=user_id,
            provider_name=provider_name.lower().strip(),
            display_name=display_name.strip(),
            encrypted_credentials=encrypted_blob,
            base_url=base_url,
            status="CONNECTED",
            last_tested_at=datetime.now(timezone.utc),
        )
        self.db.add(integration)
        await self.db.commit()
        await self.db.refresh(integration)
        return integration

    async def get_by_id(self, provider_id: uuid.UUID) -> Optional[ProviderIntegration]:
        stmt = (
            select(ProviderIntegration)
            .options(selectinload(ProviderIntegration.api_services))
            .where(ProviderIntegration.id == provider_id)
        )
        res = await self.db.execute(stmt)
        return res.scalar_one_or_none()

    async def get_by_provider_name(self, provider_name: str) -> Optional[ProviderIntegration]:
        stmt = (
            select(ProviderIntegration)
            .where(ProviderIntegration.provider_name == provider_name.lower().strip())
            .order_by(ProviderIntegration.created_at.desc())
        )
        res = await self.db.execute(stmt)
        return res.scalars().first()

    async def list_all(self, skip: int = 0, limit: int = 50) -> List[ProviderIntegration]:
        stmt = (
            select(ProviderIntegration)
            .options(selectinload(ProviderIntegration.api_services))
            .order_by(ProviderIntegration.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        res = await self.db.execute(stmt)
        return list(res.scalars().all())

    async def update_credentials(
        self,
        provider_id: uuid.UUID,
        new_credentials: Dict[str, Any],
        display_name: Optional[str] = None,
    ) -> Optional[ProviderIntegration]:
        integration = await self.get_by_id(provider_id)
        if not integration:
            return None

        # Merge with existing decrypted credentials if partial update
        existing = decrypt_credentials(integration.encrypted_credentials)
        existing.update({k: v for k, v in new_credentials.items() if v is not None and v != "••••••••"})
        integration.encrypted_credentials = encrypt_credentials(existing)

        if display_name:
            integration.display_name = display_name
        integration.last_tested_at = datetime.now(timezone.utc)
        integration.status = "CONNECTED"

        await self.db.commit()
        await self.db.refresh(integration)
        return integration

    async def delete(self, provider_id: uuid.UUID) -> bool:
        integration = await self.get_by_id(provider_id)
        if integration:
            await self.db.delete(integration)
            await self.db.commit()
            return True
        return False

    def get_decrypted_credentials(self, integration: ProviderIntegration) -> Dict[str, Any]:
        return decrypt_credentials(integration.encrypted_credentials)

    def get_masked_credentials(self, integration: ProviderIntegration) -> Dict[str, str]:
        decrypted = self.get_decrypted_credentials(integration)
        masked = {}
        for k, v in decrypted.items():
            if isinstance(v, str):
                if any(sec in k.lower() for sec in ["secret", "key", "password", "token"]):
                    masked[k] = mask_secret(v)
                else:
                    masked[k] = v
            else:
                masked[k] = "••••••••"
        return masked
