import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.logging import logger
from app.core.security import hash_password, generate_api_key
from app.models.user import User
from app.models.api_key import ApiKey


async def bootstrap_initial_data(db: AsyncSession) -> dict:
    """
    Initializes primary admin account and admin API key if not already present.
    Does NOT seed fake/demo API records. Production catalog contains only real registered APIs.
    """
    # 1. Admin user
    result = await db.execute(select(User).where(User.email == settings.ADMIN_DEFAULT_EMAIL))
    admin_user = result.scalar_one_or_none()

    created_admin = False
    if not admin_user:
        logger.info(f"Creating default admin account: {settings.ADMIN_DEFAULT_EMAIL}")
        admin_user = User(
            id=uuid.uuid4(),
            email=settings.ADMIN_DEFAULT_EMAIL,
            hashed_password=hash_password(settings.ADMIN_DEFAULT_PASSWORD),
            full_name=settings.ADMIN_DEFAULT_NAME,
            role="admin",
            is_active=True,
        )
        db.add(admin_user)
        await db.commit()
        await db.refresh(admin_user)
        created_admin = True

    # 2. Check for default API key
    created_key = None
    key_res = await db.execute(select(ApiKey).where(ApiKey.user_id == admin_user.id))
    existing_key = key_res.scalars().first()
    
    if not existing_key:
        full_key, key_prefix, hashed_key = generate_api_key("orv_live")
        admin_key = ApiKey(
            id=uuid.uuid4(),
            user_id=admin_user.id,
            name="Primary Admin Key",
            key_prefix=key_prefix,
            hashed_key=hashed_key,
            rate_limit_per_minute=1000,
            rate_limit_per_day=100000,
            is_active=True,
        )
        db.add(admin_key)
        await db.commit()
        created_key = full_key
        logger.info(f"Generated bootstrap API key: {full_key}")

    return {
        "admin_created": created_admin,
        "admin_email": admin_user.email,
        "bootstrap_api_key": created_key,
    }
