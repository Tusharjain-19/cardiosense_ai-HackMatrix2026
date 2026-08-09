"""
CardioAI Backend — Analysis API Endpoints
POST /api/analysis/upload
GET  /api/analysis/history
GET  /api/analysis/{analysis_id}
DELETE /api/analysis/{analysis_id}
"""

from fastapi import APIRouter, File, UploadFile, Depends, HTTPException, Query, Form, Request
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import Optional

from app.database.engine import get_db
from app.database.models import Analysis, User
from app.api.dependencies import get_current_user, get_current_user_optional
from app.services.analysis_service import AnalysisService
from app.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter()


@router.post("/upload")
async def upload_analysis(
    request: Request,
    file: UploadFile = File(None),
    type: str = Form("ECG"),
    patientName: Optional[str] = Form(None),
    patientAge: Optional[str] = Form(None),
    patientGender: Optional[str] = Form(None),
    patientId: Optional[str] = Form(None),
    current_user: User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """
    Upload and process an ECG/PPG signal file.
    Returns the complete analysis result matching the frontend Analysis interface.
    """
    ml_service = getattr(request.app.state, "ml_service", None)
    if ml_service is None:
        from app.services.ml_service import MLService
        from app.config import settings
        ml_service = MLService(model_path=settings.MODEL_PATH, demo_mode=settings.DEMO_MODE)
        request.app.state.ml_service = ml_service
    analysis_service = AnalysisService(ml_service)

    # Determine user ID
    user_id = current_user.id if current_user else "demo_user"

    # Read file content
    if file and file.filename:
        file_content = await file.read()
        file_name = file.filename
    else:
        file_content = b""
        file_name = f"{type}_recording.csv"

    # Parse patient age
    p_age = None
    if patientAge:
        try:
            p_age = int(patientAge)
        except (ValueError, TypeError):
            pass

    # Process
    analysis = await analysis_service.process_upload(
        db=db,
        user_id=user_id,
        file_content=file_content,
        file_name=file_name,
        file_type=type,
        patient_name=patientName,
        patient_age=p_age,
        patient_gender=patientGender,
        patient_id=patientId,
    )

    return {
        "success": True,
        "data": AnalysisService.analysis_to_response(analysis),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/history")
def get_history(
    current_user: User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """Get analysis history for the current user."""
    query = db.query(Analysis).filter(Analysis.is_deleted == False)

    if current_user:
        # Doctors/admins see all; patients see own
        if current_user.role not in ("doctor", "admin"):
            query = query.filter(Analysis.user_id == current_user.id)

    total = query.count()
    analyses = (
        query.order_by(Analysis.uploaded_at.desc())
        .limit(limit)
        .offset(offset)
        .all()
    )

    return {
        "success": True,
        "data": [AnalysisService.analysis_to_response(a) for a in analyses],
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/{analysis_id}")
def get_analysis(
    analysis_id: str,
    current_user: User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """Get a single analysis by ID."""
    analysis = (
        db.query(Analysis)
        .filter(Analysis.id == analysis_id, Analysis.is_deleted == False)
        .first()
    )

    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis record not found.")

    return {
        "success": True,
        "data": AnalysisService.analysis_to_response(analysis),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.delete("/{analysis_id}")
def delete_analysis(
    analysis_id: str,
    current_user: User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """Soft-delete an analysis record."""
    analysis = (
        db.query(Analysis)
        .filter(Analysis.id == analysis_id, Analysis.is_deleted == False)
        .first()
    )

    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis record not found.")

    analysis.is_deleted = True
    db.commit()

    return {
        "success": True,
        "message": "Analysis deleted.",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
