import uuid
from typing import Optional, Union
from fastapi import Depends, HTTPException, Security, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials, APIKeyHeader
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User
from app.models.api_key import ApiKey
from app.services.auth_service import AuthService
from app.services.api_key_service import ApiKeyService
from app.services.rate_limiter import rate_limiter

security_bearer = HTTPBearer(auto_error=False)
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security_bearer),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Validate JWT token and return active User"""
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "UNAUTHORIZED", "message": "Authentication required"},
        )

    payload = decode_access_token(credentials.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_TOKEN", "message": "Invalid or expired access token"},
        )

    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_TOKEN", "message": "Token payload missing subject"},
        )

    try:
        user_id = uuid.UUID(user_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_TOKEN", "message": "Malformed user identifier"},
        )

    auth_service = AuthService(db)
    user = await auth_service.repo.get_by_id(user_id)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "USER_INACTIVE", "message": "User account inactive or not found"},
        )

    request.state.user_id = user.id
    return user


async def get_current_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """Enforce admin privileges"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "FORBIDDEN", "message": "Administrator privileges required"},
        )
    return current_user


async def require_api_key(
    request: Request,
    bearer_creds: Optional[HTTPAuthorizationCredentials] = Security(security_bearer),
    custom_header_key: Optional[str] = Security(api_key_header),
    db: AsyncSession = Depends(get_db),
) -> ApiKey:
    """
    Validate API Key passed via 'Authorization: Bearer <key>' or 'X-API-Key: <key>'.
    Enforces per-key rate limiting.
    """
    raw_key = None
    if bearer_creds and bearer_creds.credentials:
        raw_key = bearer_creds.credentials
    elif custom_header_key:
        raw_key = custom_header_key

    if not raw_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "API_KEY_REQUIRED", "message": "API key required in Authorization or X-API-Key header"},
        )

    key_service = ApiKeyService(db)
    api_key = await key_service.validate_api_key(raw_key)

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_API_KEY", "message": "Invalid, revoked or inactive API key"},
        )

    # Attach key ID to request state for request logging
    request.state.api_key_id = api_key.id
    request.state.user_id = api_key.user_id

    # Enforce Rate Limiting
    allowed, remaining, reset_secs = await rate_limiter.check_rate_limit(
        identifier=str(api_key.id),
        limit_per_minute=api_key.rate_limit_per_minute,
        endpoint_key=request.url.path,
    )

    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "code": "RATE_LIMIT_EXCEEDED",
                "message": f"Rate limit of {api_key.rate_limit_per_minute} requests/minute exceeded. Try again in {reset_secs} seconds.",
            },
            headers={
                "Retry-After": str(reset_secs),
                "X-RateLimit-Limit": str(api_key.rate_limit_per_minute),
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": str(reset_secs),
            },
        )

    return api_key


async def optional_api_key_or_user(
    request: Request,
    bearer_creds: Optional[HTTPAuthorizationCredentials] = Security(security_bearer),
    custom_header_key: Optional[str] = Security(api_key_header),
    db: AsyncSession = Depends(get_db),
) -> Optional[Union[ApiKey, User]]:
    """Allows either API Key or JWT Bearer or public access"""
    # Try API key first
    raw_key = None
    if bearer_creds and bearer_creds.credentials and bearer_creds.credentials.startswith("orv_"):
        raw_key = bearer_creds.credentials
    elif custom_header_key:
        raw_key = custom_header_key

    if raw_key:
        key_service = ApiKeyService(db)
        key = await key_service.validate_api_key(raw_key)
        if key:
            request.state.api_key_id = key.id
            request.state.user_id = key.user_id
            return key

    # Try JWT
    if bearer_creds and bearer_creds.credentials and not bearer_creds.credentials.startswith("orv_"):
        payload = decode_access_token(bearer_creds.credentials)
        if payload and payload.get("sub"):
            try:
                user_id = uuid.UUID(payload.get("sub"))
                auth_service = AuthService(db)
                user = await auth_service.repo.get_by_id(user_id)
                if user and user.is_active:
                    request.state.user_id = user.id
                    return user
            except Exception:
                pass

    return None
