from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import (
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    LoginRequest,
    RegisterRequest,
    ResetPasswordRequest,
    ResetPasswordResponse,
    TokenResponse,
    UserPublic,
)
from app.services.password_reset_service import (
    request_password_reset,
    reset_password_with_token,
)
from app.services.user_service import authenticate, register_user

router = APIRouter()

DbSession = Annotated[AsyncSession, Depends(get_db)]


@router.post("/register", response_model=TokenResponse)
async def register(body: RegisterRequest, db: DbSession) -> TokenResponse:
    token, user = await register_user(
        db,
        email=str(body.email),
        password=body.password,
        display_name=body.display_name,
    )
    return TokenResponse(access_token=token, user=user)


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: DbSession) -> TokenResponse:
    token, user = await authenticate(
        db,
        email=str(body.email),
        password=body.password,
    )
    return TokenResponse(access_token=token, user=user)


@router.get("/me", response_model=UserPublic)
async def me(user: Annotated[User, Depends(get_current_user)]) -> UserPublic:
    return UserPublic.model_validate(user)


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
async def forgot_password(
    body: ForgotPasswordRequest, db: DbSession
) -> ForgotPasswordResponse:
    _, dev_token = await request_password_reset(db, email=str(body.email))
    return ForgotPasswordResponse(
        detail=(
            "If an account exists for that email, reset instructions will follow "
            "(check your inbox or dev token below when enabled)."
        ),
        dev_reset_token=dev_token,
    )


@router.post("/reset-password", response_model=ResetPasswordResponse)
async def reset_password(body: ResetPasswordRequest, db: DbSession) -> ResetPasswordResponse:
    ok = await reset_password_with_token(
        db, token=body.token, new_password=body.new_password
    )
    if not ok:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset link. Request a new reset.",
        )
    return ResetPasswordResponse(detail="Password updated. You can sign in now.")
