"""
CardioAI Backend — Doctor API Endpoints
GET  /api/doctor/patients
POST /api/doctor/review/{analysis_id}
"""

import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.database.engine import get_db
from app.database.models import Analysis, User
from app.database.schemas import DoctorReviewRequest
from app.api.dependencies import get_current_user_optional
from app.services.analysis_service import AnalysisService

router = APIRouter()


@router.get("/patients")
def get_patients(
    current_user: User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """Get patients with their latest analysis (for doctor dashboard)."""
    # Get all completed analyses
    analyses = (
        db.query(Analysis)
        .filter(Analysis.is_deleted == False, Analysis.status == "COMPLETED")
        .order_by(Analysis.uploaded_at.desc())
        .limit(50)
        .all()
    )

    # Group by user / patient
    seen_patients = set()
    patients = []
    for a in analyses:
        patient_key = a.patient_name or a.user_id
        if patient_key not in seen_patients:
            seen_patients.add(patient_key)
            patients.append({
                "id": a.user_id,
                "name": a.patient_name or "Unknown",
                "latestAnalysis": AnalysisService.analysis_to_response(a),
            })

    return {
        "success": True,
        "data": patients,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.post("/review/{analysis_id}")
def submit_review(
    analysis_id: str,
    review: DoctorReviewRequest,
    current_user: User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """Submit a doctor review for an analysis."""
    analysis = (
        db.query(Analysis)
        .filter(Analysis.id == analysis_id, Analysis.is_deleted == False)
        .first()
    )

    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis record not found.")

    now = datetime.now(timezone.utc)

    analysis.reviewed = True
    analysis.reviewer_id = review.doctor_id
    analysis.review_assessment = review.assessment
    analysis.review_notes = review.notes
    analysis.reviewed_at = now
    db.commit()

    review_out = {
        "id": f"rev_{uuid.uuid4().hex[:8]}",
        "analysisId": analysis_id,
        "doctorId": review.doctor_id,
        "doctorName": review.doctor_name,
        "assessment": review.assessment,
        "notes": review.notes,
        "reviewedAt": now.isoformat(),
    }

    return {
        "success": True,
        "data": review_out,
        "timestamp": now.isoformat(),
    }
