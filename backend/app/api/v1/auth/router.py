from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.common import StandardResponse
from app.schemas.auth import LoginRequest, TokenResponse, UserCreate, UserOut
from app.services.auth_service import AuthService
from app.api.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=StandardResponse[TokenResponse])
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    auth_service = AuthService(db)
    user, err = await auth_service.authenticate(payload)
    if err or not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_CREDENTIALS", "message": err or "Invalid email or password"},
        )

    token = auth_service.create_token_for_user(user)
    return StandardResponse.ok(
        data=TokenResponse(
            access_token=token,
            token_type="bearer",
            user=UserOut.model_validate(user),
        ),
        message="Authentication successful",
    )


@router.post("/register", response_model=StandardResponse[UserOut])
async def register(payload: UserCreate, db: AsyncSession = Depends(get_db)):
    auth_service = AuthService(db)
    user, err = await auth_service.register_user(payload)
    if err or not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "REGISTRATION_FAILED", "message": err or "Failed to register user"},
        )

    return StandardResponse.ok(
        data=UserOut.model_validate(user),
        message="User registered successfully",
    )


@router.get("/me", response_model=StandardResponse[UserOut])
async def get_me(current_user: User = Depends(get_current_user)):
    return StandardResponse.ok(
        data=UserOut.model_validate(current_user),
        message="Profile retrieved",
    )
