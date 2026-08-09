"""
CardioAI Backend — User API Endpoints
GET /api/users/me
PUT /api/users/me
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.engine import get_db
from app.database.models import User
from app.database.schemas import UserOut, UserUpdateRequest
from app.api.dependencies import get_current_user

router = APIRouter()


@router.get("/me")
def get_profile(current_user: User = Depends(get_current_user)):
    """Get current user profile."""
    return {
        "success": True,
        "data": UserOut.model_validate(current_user).model_dump(),
    }


@router.put("/me")
def update_profile(
    updates: UserUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update current user profile."""
    if updates.name is not None:
        current_user.name = updates.name
    if updates.age is not None:
        current_user.age = updates.age
    if updates.gender is not None:
        current_user.gender = updates.gender
    if updates.height is not None:
        current_user.height = updates.height
    if updates.weight is not None:
        current_user.weight = updates.weight

    db.commit()
    db.refresh(current_user)

    return {
        "success": True,
        "data": UserOut.model_validate(current_user).model_dump(),
    }
