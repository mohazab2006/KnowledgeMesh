from __future__ import annotations

import hashlib
import logging
import secrets
from datetime import UTC, datetime, timedelta

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import hash_password
from app.models.password_reset_token import PasswordResetToken
from app.models.user import User
from app.services import email_outbound
from app.services.user_service import get_user_by_email

logger = logging.getLogger(__name__)


def _hash_token(plain: str) -> str:
    return hashlib.sha256(plain.encode("utf-8")).hexdigest()


async def request_password_reset(
    db: AsyncSession, *, email: str
) -> tuple[bool, str | None]:
    """
    If user exists, create token and optionally email. Returns (user_existed, plain_token_for_dev).
    plain_token is only for dev disclosure when configured; otherwise None.
    """
    user = await get_user_by_email(db, email)
    if user is None:
        return False, None

    await db.execute(
        delete(PasswordResetToken).where(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.used_at.is_(None),
        )
    )

    plain = secrets.token_urlsafe(32)
    th = _hash_token(plain)
    expires = datetime.now(UTC) + timedelta(
        minutes=settings.password_reset_token_ttl_minutes
    )
    row = PasswordResetToken(
        user_id=user.id,
        token_hash=th,
        expires_at=expires,
    )
    db.add(row)
    await db.commit()

    sent = email_outbound.send_password_reset_email(
        to_email=user.email,
        reset_token=plain,
    )
    if sent:
        return True, None
    if settings.password_reset_return_token:
        logger.info(
            "Password reset token returned in API (dev mode) for user id=%s",
            user.id,
        )
        return True, plain

    logger.warning(
        "Password reset created for %s but email is not configured and "
        "PASSWORD_RESET_RETURN_TOKEN is false — user cannot receive token",
        user.email,
    )
    return True, None


async def reset_password_with_token(
    db: AsyncSession, *, token: str, new_password: str
) -> bool:
    """Returns True if password was updated."""
    th = _hash_token(token.strip())
    result = await db.execute(
        select(PasswordResetToken).where(
            PasswordResetToken.token_hash == th,
            PasswordResetToken.used_at.is_(None),
            PasswordResetToken.expires_at > datetime.now(UTC),
        )
    )
    row = result.scalar_one_or_none()
    if row is None:
        return False

    user_result = await db.execute(select(User).where(User.id == row.user_id))
    user = user_result.scalar_one_or_none()
    if user is None:
        return False

    user.hashed_password = hash_password(new_password)
    row.used_at = datetime.now(UTC)
    await db.commit()
    return True
