import time
from typing import Tuple, Optional
from app.core.redis import redis_client
from app.core.logging import logger


class RateLimiterService:
    """
    High-performance distributed rate limiter with fallback.
    Uses sliding window counter algorithm.
    """
    @staticmethod
    async def check_rate_limit(
        identifier: str,
        limit_per_minute: int,
        endpoint_key: Optional[str] = None,
    ) -> Tuple[bool, int, int]:
        """
        Check rate limit.
        Returns:
            allowed: bool
            remaining: int
            reset_seconds: int
        """
        if limit_per_minute <= 0:
            return True, 9999, 60

        current_minute = int(time.time() // 60)
        cache_key = f"ratelimit:{identifier}:{current_minute}"
        if endpoint_key:
            cache_key = f"ratelimit:{identifier}:{endpoint_key}:{current_minute}"

        # Increment atomic counter with 60 second window
        current_count = await redis_client.increment_sliding_window(cache_key, window_seconds=65)
        
        remaining = max(0, limit_per_minute - current_count)
        reset_seconds = 60 - int(time.time() % 60)
        allowed = current_count <= limit_per_minute

        return allowed, remaining, reset_seconds


rate_limiter = RateLimiterService()
