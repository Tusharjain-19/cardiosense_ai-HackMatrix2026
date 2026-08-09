"""
CardioAI Backend — API Dependencies
Shared FastAPI dependencies: database session, current user extraction.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.database.engine import get_db
from app.database.models import User
from app.utils.security import verify_token

# Bearer token security scheme
security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """
    Extract and validate the JWT bearer token from the request,
    then return the corresponding User record.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    token = credentials.credentials
    user_id = verify_token(token)

    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return user


async def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
) -> User | None:
    """
    Same as get_current_user but returns None instead of raising
    when no token is provided. Useful for endpoints that work both
    authenticated and unauthenticated.
    """
    if credentials is None:
        return None

    token = credentials.credentials
    user_id = verify_token(token)
    if user_id is None:
        return None

    return db.query(User).filter(User.id == user_id, User.is_active == True).first()
