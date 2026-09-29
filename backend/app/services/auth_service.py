import uuid
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import UserCreate, LoginRequest


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = UserRepository(db)

    async def register_user(self, payload: UserCreate) -> tuple[Optional[User], Optional[str]]:
        existing = await self.repo.get_by_email(payload.email)
        if existing:
            return None, "Email is already registered"

        user = User(
            id=uuid.uuid4(),
            email=payload.email.lower().strip(),
            hashed_password=hash_password(payload.password),
            full_name=payload.full_name,
            role=payload.role if payload.role in ["user", "admin"] else "user",
            is_active=True,
        )
        created = await self.repo.create(user)
        return created, None

    async def authenticate(self, payload: LoginRequest) -> tuple[Optional[User], Optional[str]]:
        user = await self.repo.get_by_email(payload.email)
        if not user:
            return None, "Invalid email or password"
        if not user.is_active:
            return None, "User account is inactive"
        if not verify_password(payload.password, user.hashed_password):
            return None, "Invalid email or password"

        from datetime import datetime, timezone
        user.last_login_at = datetime.now(timezone.utc)
        await self.db.commit()
        await self.db.refresh(user)

        return user, None

    def create_token_for_user(self, user: User) -> str:
        return create_access_token(subject=str(user.id), role=user.role)
