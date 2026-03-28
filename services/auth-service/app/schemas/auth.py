import uuid
from typing import Annotated

from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    email: EmailStr
    password: Annotated[str, Field(min_length=8, max_length=72)]
    display_name: str | None = Field(default=None, max_length=120)


class LoginRequest(BaseModel):
    email: EmailStr
    password: Annotated[str, Field(min_length=1, max_length=72)]


class UserPublic(BaseModel):
    id: uuid.UUID
    email: str
    display_name: str | None

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ForgotPasswordResponse(BaseModel):
    """Generic detail avoids email enumeration. dev_reset_token is set only in dev when configured."""

    detail: str
    dev_reset_token: str | None = None


class ResetPasswordRequest(BaseModel):
    token: Annotated[str, Field(min_length=10, max_length=512)]
    new_password: Annotated[str, Field(min_length=8, max_length=72)]


class ResetPasswordResponse(BaseModel):
    detail: str
