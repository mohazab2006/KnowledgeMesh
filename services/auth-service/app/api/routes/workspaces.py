import uuid
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.workspace import WorkspaceCreate, WorkspaceOut
from app.services.workspace_service import (
    create_workspace as create_workspace_svc,
    get_workspace_for_user,
    list_workspaces as list_workspaces_svc,
)

router = APIRouter()

DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]


@router.get("", response_model=list[WorkspaceOut])
async def list_workspaces(
    db: DbSession,
    user: CurrentUser,
) -> list[WorkspaceOut]:
    return await list_workspaces_svc(db, user)


@router.post("", response_model=WorkspaceOut)
async def create_workspace(
    body: WorkspaceCreate,
    db: DbSession,
    user: CurrentUser,
) -> WorkspaceOut:
    return await create_workspace_svc(db, user, body.name)


@router.get("/{workspace_id}", response_model=WorkspaceOut)
async def get_workspace(
    workspace_id: uuid.UUID,
    db: DbSession,
    user: CurrentUser,
) -> WorkspaceOut:
    return await get_workspace_for_user(db, user, workspace_id)
