import time
from datetime import timedelta
from typing import Any

import bcrypt
import jwt

from app.core.config import settings


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(*, subject: str, extra: dict[str, Any] | None = None) -> str:
    now_ts = int(time.time())
    expire_ts = now_ts + settings.access_token_expire_minutes * 60
    payload: dict[str, Any] = {
        "sub": subject,
        "iat": now_ts,
        "exp": expire_ts,
        "type": "access",
    }
    if extra:
        payload.update(extra)
    return jwt.encode(
        payload, settings.jwt_secret, algorithm=settings.jwt_algorithm
    )


def decode_access_token(token: str) -> dict[str, Any]:
    return jwt.decode(
        token,
        settings.jwt_secret,
        algorithms=[settings.jwt_algorithm],
    )
