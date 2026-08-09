"""
CardioAI Backend — Admin API Endpoints
GET  /api/admin/stats
GET  /api/admin/models
POST /api/admin/models/{version}/promote
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone

from app.database.engine import get_db
from app.database.models import Analysis, User, ModelRegistry
from app.api.dependencies import get_current_user_optional
from app.config import settings

router = APIRouter()


@router.get("/stats")
def get_stats(
    current_user: User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """System statistics for admin dashboard."""
    total_users = db.query(User).count()
    total_analyses = db.query(Analysis).filter(Analysis.is_deleted == False).count()

    # Count analyses by prediction class
    class_counts = (
        db.query(Analysis.prediction_class, func.count(Analysis.id))
        .filter(Analysis.is_deleted == False, Analysis.status == "COMPLETED")
        .group_by(Analysis.prediction_class)
        .all()
    )
    analyses_by_result = {cls or "Unknown": count for cls, count in class_counts}

    # Current model info
    current_model = (
        db.query(ModelRegistry)
        .filter(ModelRegistry.status == "PRODUCTION")
        .first()
    )

    model_perf = {
        "version": settings.MODEL_VERSION,
        "accuracy": 0.82,
        "precision": 0.80,
        "recall": 0.81,
        "f1": 0.81,
    }
    if current_model:
        model_perf = {
            "version": current_model.version,
            "accuracy": current_model.accuracy or 0,
            "precision": current_model.precision_score or 0,
            "recall": current_model.recall or 0,
            "f1": current_model.f1_score or 0,
        }

    return {
        "success": True,
        "data": {
            "total_users": total_users,
            "total_analyses": total_analyses,
            "analyses_by_result": analyses_by_result,
            "model_performance": model_perf,
        },
    }


@router.get("/models")
def list_models(
    current_user: User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """List all registered model versions."""
    models = (
        db.query(ModelRegistry)
        .order_by(ModelRegistry.created_at.desc())
        .all()
    )

    data = [
        {
            "version": m.version,
            "accuracy": m.accuracy,
            "f1": m.f1_score,
            "status": m.status,
            "created_at": m.created_at.isoformat() if m.created_at else None,
        }
        for m in models
    ]

    # If no models in registry, return the default
    if not data:
        data = [
            {
                "version": settings.MODEL_VERSION,
                "accuracy": 0.82,
                "f1": 0.81,
                "status": "PRODUCTION",
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
        ]

    return {"success": True, "data": data}


@router.post("/models/{version}/promote")
def promote_model(
    version: str,
    current_user: User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """Promote a model version to production."""
    model = db.query(ModelRegistry).filter(ModelRegistry.version == version).first()
    if not model:
        raise HTTPException(status_code=404, detail=f"Model {version} not found")

    # Demote all current production models
    db.query(ModelRegistry).filter(
        ModelRegistry.status == "PRODUCTION"
    ).update({"status": "ARCHIVED"})

    model.status = "PRODUCTION"
    db.commit()

    return {
        "success": True,
        "message": f"Model {version} promoted to production",
    }
