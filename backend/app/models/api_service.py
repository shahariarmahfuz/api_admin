import uuid
from typing import Optional, Any, TYPE_CHECKING
from sqlalchemy import String, Boolean, Integer, Text, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.provider_integration import ProviderIntegration


class ApiService(Base, TimestampMixin):
    __tablename__ = "api_services"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    provider_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("provider_integrations.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    slug: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        index=True,
        nullable=False,
    )
    description: Mapped[str] = mapped_column(
        Text,
        default="",
        nullable=False,
    )
    category: Mapped[str] = mapped_column(
        String(50),
        index=True,
        nullable=False,  # e.g. "image", "media", "utility", etc.
    )
    endpoint: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    method: Mapped[str] = mapped_column(
        String(10),
        default="POST",
        nullable=False,
    )
    version: Mapped[str] = mapped_column(
        String(20),
        default="v1",
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        String(20),
        default="ACTIVE",
        index=True,
        nullable=False,  # "ACTIVE" | "INACTIVE" | "MAINTENANCE" | "BETA"
    )
    requires_auth: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )
    rate_limit_per_minute: Mapped[int] = mapped_column(
        Integer,
        default=60,
        nullable=False,
    )
    documentation: Mapped[Optional[Any]] = mapped_column(
        JSON,
        nullable=True,
        default=dict,
    )
    config: Mapped[Optional[Any]] = mapped_column(
        JSON,
        nullable=True,
        default=dict,  # Extra provider operation details, e.g. {"operation": "upload_image"}
    )

    # Relationships
    provider: Mapped[Optional["ProviderIntegration"]] = relationship(
        "ProviderIntegration",
        back_populates="api_services",
    )
