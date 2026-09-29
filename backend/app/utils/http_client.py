import httpx
from typing import Optional

_client: Optional[httpx.AsyncClient] = None


def get_http_client() -> httpx.AsyncClient:
    """Returns singleton reusable async HTTP client with connection pooling"""
    global _client
    if _client is None or _client.is_closed:
        limits = httpx.Limits(max_keepalive_connections=50, max_connections=200, keepalive_expiry=30.0)
        timeout = httpx.Timeout(15.0, connect=5.0)
        _client = httpx.AsyncClient(
            limits=limits,
            timeout=timeout,
            follow_redirects=True,
            headers={"User-Agent": "Orvia-API-Platform/1.0"},
        )
    return _client


async def close_http_client() -> None:
    """Gracefully close HTTP client connection pool on server shutdown"""
    global _client
    if _client is not None and not _client.is_closed:
        await _client.aclose()
        _client = None
