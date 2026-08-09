"""
CardioAI Backend — FastAPI Application Entry Point
Initializes the app, loads the ML model, registers all routers,
and configures middleware.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database.engine import init_db
from app.services.ml_service import MLService
from app.utils.logger import get_logger

from app.api.v1 import auth, analysis, user, doctor, admin, chat

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle manager."""
    # ── Startup ──
    logger.info("Initializing CardioAI Backend...")

    # Create database tables
    init_db()
    logger.info("Database initialized")

    # Load ML model (or enter demo mode)
    ml_service = MLService(
        model_path=settings.MODEL_PATH,
        demo_mode=settings.DEMO_MODE,
    )
    app.state.ml_service = ml_service
    logger.info(
        f"ML service ready (demo_mode={ml_service.demo_mode}, "
        f"model_version={settings.MODEL_VERSION})"
    )

    logger.info(
        f"CardioAI Backend v{settings.APP_VERSION} started on "
        f"http://0.0.0.0:8000"
    )

    yield

    # ── Shutdown ──
    logger.info("Shutting down CardioAI Backend...")
    try:
        import torch
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
    except ImportError:
        pass


# ── Create app ──
app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "Backend API service providing signal processing, "
        "AI cardiac screening inference, Explainable AI overlay, "
        "and doctor review workflows."
    ),
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

# ── Middleware ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS + ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──
# Routes use /api/ prefix (no /v1/) to match existing frontend
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(analysis.router, prefix="/api/analysis", tags=["Analysis"])
app.include_router(user.router, prefix="/api/users", tags=["Users"])
app.include_router(doctor.router, prefix="/api/doctor", tags=["Doctor"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(chat.router, prefix="/api", tags=["Chat"])


# ── Root / health endpoints ──
@app.get("/")
def root():
    return {
        "message": "CardioAI Backend API Service is running.",
        "status": "ONLINE",
        "version": settings.APP_VERSION,
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "version": settings.APP_VERSION,
        "demo_mode": settings.DEMO_MODE,
    }


# ── Direct run ──
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
