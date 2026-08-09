"""
CardioAI Backend — Auth API Endpoints
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.database.engine import get_db
from app.database.schemas import LoginRequest, SignupRequest, UserOut
from app.services.auth_service import AuthService

router = APIRouter()


@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate user and return JWT token."""
    try:
        user, token = AuthService.login(db, req.email, req.password)
        return {
            "token": token,
            "user": UserOut.model_validate(user).model_dump(),
        }
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.post("/register")
def register(req: SignupRequest, db: Session = Depends(get_db)):
    """Register a new user and return JWT token."""
    try:
        user, token = AuthService.register(
            db=db,
            email=req.email,
            password=req.password,
            name=req.name,
            age=req.age,
            gender=req.gender,
            height=req.height,
            weight=req.weight,
            role=req.role or "patient",
        )
        return {
            "token": token,
            "user": UserOut.model_validate(user).model_dump(),
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/logout")
def logout():
    """Log out (client-side token invalidation)."""
    return {"success": True, "message": "Logged out successfully."}
