import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ApiKeyCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    rate_limit_per_minute: int = Field(default=60, ge=1, le=10000)
    rate_limit_per_day: int = Field(default=10000, ge=10, le=1000000)


class ApiKeyUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    rate_limit_per_minute: Optional[int] = Field(None, ge=1, le=10000)
    rate_limit_per_day: Optional[int] = Field(None, ge=10, le=1000000)
    is_active: Optional[bool] = None


class ApiKeyOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    key_prefix: str
    rate_limit_per_minute: int
    rate_limit_per_day: int
    is_active: bool
    request_count: int
    last_used_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ApiKeyCreatedOut(ApiKeyOut):
    """Returned ONLY on key creation — the raw secret key is never retrievable again"""
    secret_key: str
