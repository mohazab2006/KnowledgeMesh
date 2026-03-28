from uuid import UUID

import jwt
from fastapi import Header, HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_access_token


async def get_current_user_id(
    authorization: str | None = Header(None, alias="Authorization"),
) -> UUID:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization")
    token = authorization.split(" ", 1)[1].strip()
    try:
        payload = decode_access_token(token)
        sub = payload.get("sub")
        if not sub:
            raise HTTPException(status_code=401, detail="Invalid token")
        return UUID(str(sub))
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def assert_workspace_member(
    db: AsyncSession, workspace_id: UUID, user_id: UUID
) -> None:
    result = await db.execute(
        text(
            "SELECT 1 FROM workspace_memberships "
            "WHERE workspace_id = CAST(:wid AS uuid) AND user_id = CAST(:uid AS uuid)"
        ),
        {"wid": str(workspace_id), "uid": str(user_id)},
    )
    if result.first() is None:
        raise HTTPException(status_code=403, detail="Not a member of this workspace")
