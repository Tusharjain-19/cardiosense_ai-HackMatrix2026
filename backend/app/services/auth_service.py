"""
CardioAI Backend — Authentication Service
Handles user registration, login, and token management.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.database.models import User
from app.utils.security import hash_password, verify_password, create_access_token
from app.utils.logger import get_logger

logger = get_logger(__name__)


class AuthService:
    """Authentication business logic."""

    @staticmethod
    def register(
        db: Session,
        email: str,
        password: str,
        name: str,
        age: int | None = None,
        gender: str | None = None,
        height: float | None = None,
        weight: float | None = None,
        role: str = "patient",
    ) -> tuple[User, str]:
        """
        Register a new user.
        Returns (user, token) tuple.
        Raises ValueError if email already exists.
        """
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            raise ValueError("Email already registered")

        user = User(
            id=str(uuid.uuid4()),
            email=email,
            password_hash=hash_password(password),
            name=name,
            age=age,
            gender=gender,
            height=int(height) if height else None,
            weight=int(weight) if weight else None,
            role=role,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        token = create_access_token(user.id)
        logger.info(f"User registered: {user.email} (role={user.role})")
        return user, token

    @staticmethod
    def login(db: Session, email: str, password: str) -> tuple[User, str]:
        """
        Authenticate a user by email/password.
        Returns (user, token) tuple.
        Raises ValueError if credentials are invalid.
        """
        user = db.query(User).filter(User.email == email).first()

        if not user:
            # For hackathon demo: auto-create user on first login
            logger.info(f"Auto-creating demo user for: {email}")
            user = User(
                id=str(uuid.uuid4()),
                email=email,
                password_hash=hash_password(password),
                name=email.split("@")[0].replace(".", " ").title(),
                role="patient",
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        elif not verify_password(password, user.password_hash):
            raise ValueError("Invalid credentials")

        token = create_access_token(user.id)
        logger.info(f"User logged in: {user.email}")
        return user, token
