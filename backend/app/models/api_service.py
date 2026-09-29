import uuid
from typing import Optional, Any
from sqlalchemy import String, Boolean, Integer, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class ApiService(Base, TimestampMixin):
    __tablename__ = "api_services"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
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
        nullable=False,  # e.g. "utility", "image", "media", "social"
    )
    endpoint: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    method: Mapped[str] = mapped_column(
        String(10),
        default="GET",
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
