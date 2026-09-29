import uuid
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.api_service import ApiService
    from app.models.api_test_history import ApiTestHistory


class ProviderIntegration(Base, TimestampMixin):
    __tablename__ = "provider_integrations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    provider_name: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,  # e.g. "cloudinary"
    )
    display_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    encrypted_credentials: Mapped[str] = mapped_column(
        Text,
        nullable=False,  # Encrypted at rest via Fernet AES
    )
    base_url: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
    )
    status: Mapped[str] = mapped_column(
        String(20),
        default="CONNECTED",
        nullable=False,  # "CONNECTED" | "ERROR" | "INACTIVE"
    )
    last_tested_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Relationships
    user: Mapped["User"] = relationship("User")
    api_services: Mapped[List["ApiService"]] = relationship(
        "ApiService",
        back_populates="provider",
        cascade="all, delete-orphan",
    )
    test_history: Mapped[List["ApiTestHistory"]] = relationship(
        "ApiTestHistory",
        back_populates="provider",
        cascade="all, delete-orphan",
    )
