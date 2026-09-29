import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple
import bcrypt
import jwt

from app.core.config import settings


def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against bcrypt hash"""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8"),
        )
    except Exception:
        return False


def create_access_token(subject: str, role: str, expires_delta: Optional[timedelta] = None) -> str:
    """Generate JWT access token"""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "sub": str(subject),
        "role": role,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """Decode and validate JWT access token"""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None


def generate_api_key(environment_prefix: str = "orv_live") -> Tuple[str, str, str]:
    """
    Generate a cryptographically secure API key.
    Returns:
        full_key: str - Full secret key shown once to user (e.g. orv_live_4a8b1c2d_xyz...)
        key_prefix: str - Short display prefix stored in DB (e.g. orv_live_4a8b1c2d)
        hashed_key: str - SHA-256 hash stored in DB for fast indexed lookup
    """
    short_id = secrets.token_hex(4)
    key_prefix = f"{environment_prefix}_{short_id}"
    secret_part = secrets.token_urlsafe(32)
    full_key = f"{key_prefix}_{secret_part}"
    hashed_key = hash_api_key(full_key)
    return full_key, key_prefix, hashed_key


def hash_api_key(api_key: str) -> str:
    """Hash raw API key with SHA-256 for secure constant-time lookup"""
    return hashlib.sha256(api_key.encode("utf-8")).hexdigest()
