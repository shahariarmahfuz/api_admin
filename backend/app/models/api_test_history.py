import uuid
from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Integer, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.provider_integration import ProviderIntegration
    from app.models.api_service import ApiService


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class ApiTestHistory(Base):
    __tablename__ = "api_test_history"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    provider_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("provider_integrations.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    service_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("api_services.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    provider_name: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )
    operation: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    status_code: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )
    response_time_ms: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )
    success: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        index=True,
        nullable=False,
    )

    # Relationships
    provider: Mapped[Optional["ProviderIntegration"]] = relationship(
        "ProviderIntegration",
        back_populates="test_history",
    )
