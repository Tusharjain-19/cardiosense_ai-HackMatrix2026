"""
CardioAI Backend — Configuration & Settings
Loads from environment variables / .env file
"""

from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    # ── App ──
    APP_NAME: str = "CardioAI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # ── Database ──
    DATABASE_URL: str = "sqlite:///./cardioai.db"

    # ── Security / JWT ──
    SECRET_KEY: str = "cardioai-dev-secret-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_HOURS: int = 24

    # ── ML Model ──
    MODEL_PATH: str = "models/v3/model.pth"
    MODEL_VERSION: str = "v3"
    DEMO_MODE: bool = True  # Use heuristic predictions when no trained model

    # ── Storage ──
    UPLOAD_DIR: str = "storage/uploads"
    MAX_FILE_SIZE: int = 100 * 1024 * 1024  # 100 MB

    # ── CORS ──
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
    ]

    # ── External APIs ──
    ANTHROPIC_API_KEY: str = ""

    # ── Logging ──
    LOG_LEVEL: str = "INFO"

    PORT: int = 8000

    model_config = {
        "env_file": ".env",
        "case_sensitive": True,
        "extra": "ignore",
    }


settings = Settings()
