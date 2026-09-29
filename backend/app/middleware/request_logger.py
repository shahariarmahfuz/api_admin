import time
import uuid
import asyncio
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.database import AsyncSessionLocal
from app.core.logging import logger
from app.models.request_log import RequestLog


async def _persist_log_entry(log_data: dict) -> None:
    """Asynchronously persist request log to PostgreSQL in background"""
    try:
        async with AsyncSessionLocal() as session:
            entry = RequestLog(
                id=uuid.uuid4(),
                request_id=log_data["request_id"],
                api_key_id=log_data.get("api_key_id"),
                user_id=log_data.get("user_id"),
                endpoint=log_data["endpoint"],
                method=log_data["method"],
                status_code=log_data["status_code"],
                response_time_ms=log_data["response_time_ms"],
                client_ip=log_data.get("client_ip", ""),
                error_message=log_data.get("error_message"),
                api_slug=log_data.get("api_slug"),
                category=log_data.get("category"),
            )
            session.add(entry)
            await session.commit()
    except Exception as e:
        logger.error(f"Failed to persist request log entry to database: {e}")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Generate or retain request ID
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        request.state.request_id = request_id
        request.state.api_key_id = None
        request.state.user_id = None
        request.state.api_slug = None
        request.state.category = None

        start_time = time.perf_counter()
        error_message = None
        status_code = 500

        try:
            response = await call_next(request)
            status_code = response.status_code
        except Exception as exc:
            error_message = str(exc)
            raise exc
        finally:
            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
            client_ip = (
                request.headers.get("x-forwarded-for", "").split(",")[0].strip()
                or (request.client.host if request.client else "")
            )

            # Extract category & slug from path if /api/v1/{category}/...
            path = request.url.path
            category = getattr(request.state, "category", None)
            api_slug = getattr(request.state, "api_slug", None)
            if not category and path.startswith("/api/v1/"):
                parts = path.strip("/").split("/")
                if len(parts) >= 3:
                    category = parts[2]
                if len(parts) >= 4:
                    api_slug = f"{parts[2]}-{parts[3]}"

            # Only log API requests to database (exclude static/docs/health probes if desired, but keep API calls logged)
            if path.startswith("/api/"):
                log_data = {
                    "request_id": request_id,
                    "api_key_id": getattr(request.state, "api_key_id", None),
                    "user_id": getattr(request.state, "user_id", None),
                    "endpoint": path,
                    "method": request.method,
                    "status_code": status_code,
                    "response_time_ms": duration_ms,
                    "client_ip": client_ip,
                    "error_message": error_message,
                    "api_slug": api_slug,
                    "category": category,
                }
                # Dispatch background write non-blockingly
                asyncio.create_task(_persist_log_entry(log_data))

        # Attach telemetry headers to response
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Response-Time"] = f"{duration_ms}ms"
        return response
