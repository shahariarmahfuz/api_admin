import uuid
from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field


class ProviderBlueprintOut(BaseModel):
    name: str
    provider_name: str
    display_name: str
    description: str
    category: str
    credential_schema: List[Dict[str, Any]]
    fields: List[Dict[str, Any]] = Field(default_factory=list)
    operations: List[Dict[str, Any]]
    supported_operations: List[str] = Field(default_factory=list)


class TestConnectionRequest(BaseModel):
    provider_name: str
    credentials: Dict[str, Any]


class TestConnectionResponse(BaseModel):
    success: bool
    message: str


class ProviderCreateRequest(BaseModel):
    provider_name: str
    display_name: str
    credentials: Dict[str, Any]
    base_url: Optional[str] = None
    register_default_services: bool = True


class ProviderUpdateRequest(BaseModel):
    display_name: Optional[str] = None
    credentials: Optional[Dict[str, Any]] = None


class ProviderOut(BaseModel):
    id: uuid.UUID
    provider_name: str
    display_name: str
    masked_credentials: Dict[str, str]
    base_url: Optional[str] = None
    status: str
    last_tested_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    services_count: int = 0

    class Config:
        from_attributes = True


class AdminExecuteTestRequest(BaseModel):
    provider_id: Optional[uuid.UUID] = None
    service_id: Optional[uuid.UUID] = None
    provider_name: str
    operation: str
    parameters: Dict[str, Any] = Field(default_factory=dict)


class AdminExecuteTestResponse(BaseModel):
    success: bool
    status_code: int
    response_time_ms: float
    data: Optional[Any] = None
    error: Optional[str] = None


class TestHistoryOut(BaseModel):
    id: uuid.UUID
    provider_name: str
    operation: str
    status_code: int
    response_time_ms: float
    success: bool
    created_at: datetime

    class Config:
        from_attributes = True
