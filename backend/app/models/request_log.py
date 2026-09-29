import uuid
from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Integer, Float, Text, ForeignKey, DateTime, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.api_key import ApiKey


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class RequestLog(Base):
    __tablename__ = "request_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    request_id: Mapped[str] = mapped_column(
        String(64),
        index=True,
        nullable=False,
    )
    api_key_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("api_keys.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    endpoint: Mapped[str] = mapped_column(
        String(255),
        index=True,
        nullable=False,
    )
    method: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
    )
    status_code: Mapped[int] = mapped_column(
        Integer,
        index=True,
        nullable=False,
    )
    response_time_ms: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )
    client_ip: Mapped[str] = mapped_column(
        String(45),
        nullable=False,
        default="",
    )
    error_message: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    api_slug: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
        index=True,
    )
    category: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        index=True,
        nullable=False,
    )

    # Relationships
    user: Mapped[Optional["User"]] = relationship("User", back_populates="request_logs")
    api_key: Mapped[Optional["ApiKey"]] = relationship("ApiKey", back_populates="request_logs")

    __table_args__ = (
        Index("idx_request_logs_created_at_desc", created_at.desc()),
        Index("idx_request_logs_status_created", status_code, created_at.desc()),
    )
