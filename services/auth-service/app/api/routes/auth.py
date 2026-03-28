from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserPublic
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
