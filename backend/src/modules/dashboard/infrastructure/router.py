from fastapi import APIRouter, Depends
from sqlmodel import Session

from src.shared.infrastructure.database import get_session
from src.modules.identity.infrastructure.auth_dependency import get_current_user
from src.modules.identity.domain.entities import User
from ..application.service import DashboardService

router = APIRouter(prefix="/api/v1/dashboard", tags=["Dashboard"])


@router.get("/summary")
async def dashboard_summary(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return DashboardService(session).summary(current_user)
