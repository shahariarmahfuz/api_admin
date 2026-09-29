import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel


class RequestLogOut(BaseModel):
    id: uuid.UUID
    request_id: str
    api_key_id: Optional[uuid.UUID] = None
    user_id: Optional[uuid.UUID] = None
    endpoint: str
    method: str
    status_code: int
    response_time_ms: float
    client_ip: str
    error_message: Optional[str] = None
    api_slug: Optional[str] = None
    category: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class DashboardStats(BaseModel):
    total_requests: int
    requests_today: int
    successful_requests: int
    failed_requests: int
    error_rate_percentage: float
    average_response_time_ms: float
    active_api_keys: int
    active_apis: int
    system_status: str


class RequestsOverTimePoint(BaseModel):
    timestamp: str
    count: int
    success_count: int
    error_count: int


class EndpointUsageStat(BaseModel):
    endpoint: str
    method: str
    total_calls: int
    avg_latency_ms: float
    error_count: int


class AnalyticsOverview(BaseModel):
    stats: DashboardStats
    requests_over_time: List[RequestsOverTimePoint]
    top_endpoints: List[EndpointUsageStat]
    status_code_distribution: Dict[str, int]
