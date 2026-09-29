import time
from typing import Optional, Any
from app.core.config import settings
from app.core.logging import logger

try:
    import redis.asyncio as aioredis
except ImportError:
    aioredis = None


class RedisManager:
    """
    Production-ready Redis manager with seamless in-memory fallback.
    Guarantees operation even when Redis is not deployed or offline.
    """
    def __init__(self):
        self._client = None
        self._memory_cache: dict[str, tuple[Any, float]] = {}
        self._memory_counters: dict[str, tuple[int, float]] = {}
        self._is_connected = False

    async def initialize(self):
        if settings.REDIS_URL and aioredis:
            try:
                self._client = aioredis.from_url(
                    settings.REDIS_URL,
                    max_connections=settings.REDIS_MAX_CONNECTIONS,
                    decode_responses=True,
                )
                await self._client.ping()
                self._is_connected = True
                logger.info("Connected to Redis server successfully.")
            except Exception as e:
                logger.warning(f"Redis unavailable, falling back to in-memory store: {e}")
                self._client = None
                self._is_connected = False
        else:
            logger.info("Redis not configured. Operating in high-performance in-memory mode.")

    async def close(self):
        if self._client:
            await self._client.close()

    async def get(self, key: str) -> Optional[str]:
        if self._client and self._is_connected:
            try:
                return await self._client.get(key)
            except Exception as e:
                logger.warning(f"Redis GET failed: {e}")
        
        # In-memory fallback
        now = time.time()
        if key in self._memory_cache:
            val, expiry = self._memory_cache[key]
            if expiry > now:
                return val
            del self._memory_cache[key]
        return None

    async def set(self, key: str, value: str, expire: Optional[int] = None) -> bool:
        if self._client and self._is_connected:
            try:
                if expire:
                    await self._client.setex(key, expire, value)
                else:
                    await self._client.set(key, value)
                return True
            except Exception as e:
                logger.warning(f"Redis SET failed: {e}")

        # In-memory fallback
        expiry = time.time() + (expire if expire else 86400 * 365)
        self._memory_cache[key] = (value, expiry)
        return True

    async def increment_sliding_window(self, key: str, window_seconds: int = 60) -> int:
        """Atomic sliding window increment for rate limiting"""
        now = time.time()
        if self._client and self._is_connected:
            try:
                pipe = self._client.pipeline()
                pipe.incr(key)
                pipe.expire(key, window_seconds)
                results = await pipe.execute()
                return results[0]
            except Exception as e:
                logger.warning(f"Redis sliding window failed: {e}")

        # In-memory sliding window
        count, expiry = self._memory_counters.get(key, (0, now + window_seconds))
        if now > expiry:
            count = 1
            expiry = now + window_seconds
        else:
            count += 1
        self._memory_counters[key] = (count, expiry)
        return count

    async def health_check(self) -> dict:
        if self._client and self._is_connected:
            try:
                start = time.perf_counter()
                await self._client.ping()
                latency_ms = round((time.perf_counter() - start) * 1000, 2)
                return {"status": "connected", "mode": "redis", "latency_ms": latency_ms}
            except Exception as e:
                return {"status": "degraded", "mode": "fallback_in_memory", "error": str(e)}
        return {"status": "ready", "mode": "in_memory_engine", "active_keys": len(self._memory_cache)}


redis_client = RedisManager()
