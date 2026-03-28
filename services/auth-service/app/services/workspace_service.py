import re
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.membership import WorkspaceMembership
from app.models.user import User
from app.models.workspace import Workspace
from app.schemas.workspace import WorkspaceOut


def _workspace_slug(name: str) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")[:48] or "workspace"
    return f"{base}-{uuid.uuid4().hex[:8]}"


async def list_workspaces(db: AsyncSession, user: User) -> list[WorkspaceOut]:
    result = await db.execute(
        select(WorkspaceMembership, Workspace)
        .join(Workspace, Workspace.id == WorkspaceMembership.workspace_id)
        .where(WorkspaceMembership.user_id == user.id)
        .order_by(Workspace.created_at.asc())
    )
    rows = result.all()
    return [
        WorkspaceOut(
            id=ws.id,
            name=ws.name,
            slug=ws.slug,
            role=m.role,
            created_at=ws.created_at,
        )
        for m, ws in rows
    ]


async def create_workspace(
    db: AsyncSession, user: User, name: str
) -> WorkspaceOut:
    ws = Workspace(name=name.strip(), slug=_workspace_slug(name))
    db.add(ws)
    await db.flush()
    m = WorkspaceMembership(
        workspace_id=ws.id, user_id=user.id, role="owner"
    )
    db.add(m)
    await db.flush()
    await db.commit()
    await db.refresh(ws)
    return WorkspaceOut(
        id=ws.id,
        name=ws.name,
        slug=ws.slug,
        role="owner",
        created_at=ws.created_at,
    )


async def get_workspace_for_user(
    db: AsyncSession, user: User, workspace_id: uuid.UUID
) -> WorkspaceOut:
    from fastapi import HTTPException, status

    result = await db.execute(
        select(WorkspaceMembership, Workspace)
        .join(Workspace, Workspace.id == WorkspaceMembership.workspace_id)
        .where(
            WorkspaceMembership.user_id == user.id,
            Workspace.id == workspace_id,
        )
    )
    row = result.one_or_none()
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Workspace not found")
    m, ws = row
    return WorkspaceOut(
        id=ws.id,
        name=ws.name,
        slug=ws.slug,
        role=m.role,
        created_at=ws.created_at,
    )
