from typing import Generic, TypeVar, Optional, Any, List
from pydantic import BaseModel, Field

T = TypeVar("T")


class ErrorDetail(BaseModel):
    code: str
    message: str
    details: Optional[Any] = None


class StandardResponse(BaseModel, Generic[T]):
    success: bool = True
    data: Optional[T] = None
    message: str = "Request completed successfully"

    @classmethod
    def ok(cls, data: Any = None, message: str = "Request completed successfully"):
        return cls(success=True, data=data, message=message)


class ErrorResponse(BaseModel):
    success: bool = False
    error: ErrorDetail

    @classmethod
    def fail(cls, code: str, message: str, details: Optional[Any] = None):
        return cls(
            success=False,
            error=ErrorDetail(code=code, message=message, details=details),
        )


class PaginatedData(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    page_size: int
    total_pages: int
