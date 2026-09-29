from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.core.logging import logger
from app.core.database import engine, AsyncSessionLocal
from app.core.redis import redis_client
from app.core.bootstrap import bootstrap_initial_data
from app.utils.http_client import close_http_client
from app.middleware.request_logger import RequestLoggingMiddleware
from app.api.router import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup sequence
    logger.info("Initializing Orvia API Platform...")
    await redis_client.initialize()

    # Bootstrap admin user, keys, and services
    try:
        async with AsyncSessionLocal() as session:
            boot_res = await bootstrap_initial_data(session)
            logger.info(f"Bootstrap complete: {boot_res}")
    except Exception as e:
        logger.error(f"Bootstrap initialization error: {e}")

    yield

    # Shutdown sequence
    logger.info("Shutting down Orvia API Platform...")
    await redis_client.close()
    await close_http_client()
    await engine.dispose()
    logger.info("Shutdown cleanup complete.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID", "X-Response-Time", "X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"],
)

# Request Logging and Telemetry Middleware
app.add_middleware(RequestLoggingMiddleware)


# Standard API Error Handlers
@app.exception_handler(StarletteHTTPException)
async def custom_http_exception_handler(request: Request, exc: StarletteHTTPException):
    detail = exc.detail
    if isinstance(detail, dict):
        code = detail.get("code", "ERROR")
        message = detail.get("message", "An error occurred")
        details = detail.get("details")
    else:
        code = f"HTTP_{exc.status_code}"
        message = str(detail)
        details = None

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": code,
                "message": message,
                "details": details,
            },
        },
        headers=getattr(exc, "headers", None),
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for err in exc.errors():
        loc = " -> ".join([str(x) for x in err.get("loc", [])])
        errors.append({"field": loc, "message": err.get("msg", "Validation error")})

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Invalid request parameters or payload",
                "details": errors,
            },
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception occurred: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected server error occurred. Please contact platform administrators.",
            },
        },
    )


# Root Health Probe
@app.get("/health", tags=["Root"])
async def root_health():
    return {
        "success": True,
        "data": {
            "platform": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "status": "online",
        },
        "message": "Platform online",
    }


# Include Routers
app.include_router(api_router)
