import re
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, hash_password, verify_password
from app.models.membership import WorkspaceMembership
from app.models.user import User
from app.models.workspace import Workspace
from app.schemas.auth import UserPublic


def _workspace_slug(name: str) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")[:48] or "workspace"
    return f"{base}-{uuid.uuid4().hex[:8]}"


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email.lower().strip()))
    return result.scalar_one_or_none()


async def register_user(
    db: AsyncSession,
    *,
    email: str,
    password: str,
    display_name: str | None,
) -> tuple[str, UserPublic]:
    email_norm = email.lower().strip()
    if await get_user_by_email(db, email_norm):
        from fastapi import HTTPException, status

        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    user = User(
        email=email_norm,
        hashed_password=hash_password(password),
        display_name=display_name.strip() if display_name else None,
    )
    db.add(user)
    await db.flush()

    workspace = Workspace(name="Personal", slug=_workspace_slug("personal"))
    db.add(workspace)
    await db.flush()

    membership = WorkspaceMembership(
        workspace_id=workspace.id,
        user_id=user.id,
        role="owner",
    )
    db.add(membership)
    await db.flush()

    await db.commit()
    await db.refresh(user)

    token = create_access_token(subject=str(user.id))
    public = UserPublic.model_validate(user)
    return token, public


async def authenticate(
    db: AsyncSession, *, email: str, password: str
) -> tuple[str, UserPublic]:
    from fastapi import HTTPException, status

    user = await get_user_by_email(db, email)
    if user is None or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    token = create_access_token(subject=str(user.id))
    return token, UserPublic.model_validate(user)
