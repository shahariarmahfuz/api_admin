import uuid
from datetime import datetime
from typing import Optional, Any, Literal
from pydantic import BaseModel, Field

ServiceStatus = Literal["ACTIVE", "INACTIVE", "MAINTENANCE", "BETA"]


class ApiServiceCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    slug: str = Field(..., min_length=2, max_length=100)
    description: str = Field(default="")
    category: str = Field(..., min_length=2, max_length=50)
    endpoint: str = Field(..., min_length=1, max_length=255)
    method: str = Field(default="GET", max_length=10)
    version: str = Field(default="v1", max_length=20)
    status: ServiceStatus = "ACTIVE"
    requires_auth: bool = True
    rate_limit_per_minute: int = Field(default=60, ge=1)
    documentation: Optional[Any] = None


class ApiServiceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    endpoint: Optional[str] = None
    method: Optional[str] = None
    version: Optional[str] = None
    status: Optional[ServiceStatus] = None
    requires_auth: Optional[bool] = None
    rate_limit_per_minute: Optional[int] = None
    documentation: Optional[Any] = None


class ApiServiceOut(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    description: str
    category: str
    endpoint: str
    method: str
    version: str
    status: str
    requires_auth: bool
    rate_limit_per_minute: int
    documentation: Optional[Any] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
