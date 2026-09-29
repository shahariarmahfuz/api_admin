import os
import sys
import platform
import psutil
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db, check_db_health
from app.core.redis import redis_client
from app.schemas.common import StandardResponse
from app.api.dependencies import get_current_admin

router = APIRouter(prefix="/admin", tags=["Admin System"])


@router.get("/health", response_model=StandardResponse[dict])
async def get_system_health(
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    db_health = await check_db_health()
    redis_health = await redis_client.health_check()

    # Memory and process stats
    process = psutil.Process(os.getpid())
    memory_info = process.memory_info()

    health_data = {
        "status": "OPERATIONAL" if db_health.get("status") == "healthy" else "DEGRADED",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "platform": {
            "name": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "environment": settings.ENVIRONMENT,
            "python_version": platform.python_version(),
            "os": platform.platform(),
        },
        "database": db_health,
        "cache": redis_health,
        "process": {
            "memory_rss_mb": round(memory_info.rss / (1024 * 1024), 2),
            "cpu_percent": process.cpu_percent(interval=None),
            "threads_count": process.num_threads(),
        }
    }
    return StandardResponse.ok(
        data=health_data,
        message="System health status evaluated",
    )


@router.get("/settings", response_model=StandardResponse[dict])
async def get_system_settings(admin=Depends(get_current_admin)):
    return StandardResponse.ok(
        data={
            "project_name": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "environment": settings.ENVIRONMENT,
            "cors_origins": settings.CORS_ORIGINS,
            "default_rate_limit_per_minute": settings.DEFAULT_RATE_LIMIT_PER_MINUTE,
            "token_expiration_minutes": settings.ACCESS_TOKEN_EXPIRE_MINUTES,
            "database_pool_size": settings.DB_POOL_SIZE,
            "redis_configured": bool(settings.REDIS_URL),
        },
        message="System settings retrieved",
    )
