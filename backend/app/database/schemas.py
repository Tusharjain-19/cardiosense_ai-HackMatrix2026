"""
CardioAI Backend — Pydantic Schemas
Request / response models for all API endpoints.
Field aliases use camelCase to match the frontend contract.
"""

from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, Dict, List
from datetime import datetime


# ── Auth ──────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: str
    password: str


class SignupRequest(BaseModel):
    email: str
    password: str
    name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    role: Optional[str] = "patient"


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    email: str
    name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    height: Optional[int] = None
    weight: Optional[int] = None
    role: str = "patient"
    created_at: Optional[datetime] = Field(None, alias="createdAt")
    updated_at: Optional[datetime] = Field(None, alias="updatedAt")

    def model_dump(self, **kwargs):
        kwargs.setdefault("by_alias", True)
        return super().model_dump(**kwargs)


class AuthResponse(BaseModel):
    token: str
    user: UserOut


class UserUpdateRequest(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    height: Optional[int] = None
    weight: Optional[int] = None


# ── Signal Quality ────────────────────────────────────────────────────────

class SignalQualityFactors(BaseModel):
    noise: str = "low"
    baseline: str = "stable"
    saturation: str = "none"


class SignalQualityOut(BaseModel):
    score: int
    status: str
    factors: SignalQualityFactors


# ── Heart Rate ────────────────────────────────────────────────────────────

class HeartRateOut(BaseModel):
    average: int
    min: int
    max: int
    variability: str = "low"


# ── AI Prediction ─────────────────────────────────────────────────────────

class AIPredictionOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    prediction_class: str = Field(alias="class")
    confidence: float
    class_distribution: Dict[str, float] = Field(alias="classDistribution")

    def model_dump(self, **kwargs):
        kwargs.setdefault("by_alias", True)
        return super().model_dump(**kwargs)


# ── Focus Area ────────────────────────────────────────────────────────────

class FocusAreaOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    start_time: float = Field(alias="startTime")
    end_time: float = Field(alias="endTime")
    description: str = ""

    def model_dump(self, **kwargs):
        kwargs.setdefault("by_alias", True)
        return super().model_dump(**kwargs)


# ── Doctor Review ─────────────────────────────────────────────────────────

class DoctorReviewRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    analysis_id: str = Field(alias="analysisId")
    doctor_id: str = Field(alias="doctorId")
    doctor_name: str = Field(alias="doctorName")
    assessment: str       # CONFIRMED | NEEDS_FURTHER_REVIEW | NOT_RELIABLE
    notes: str = ""


class DoctorReviewOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    analysis_id: str = Field(alias="analysisId")
    doctor_id: str = Field(alias="doctorId")
    doctor_name: str = Field(alias="doctorName")
    assessment: str
    notes: str = ""
    reviewed_at: str = Field(alias="reviewedAt")

    def model_dump(self, **kwargs):
        kwargs.setdefault("by_alias", True)
        return super().model_dump(**kwargs)


# ── Analysis ──────────────────────────────────────────────────────────────

class AnalysisOut(BaseModel):
    """
    Matches the frontend Analysis interface exactly (camelCase).
    """
    model_config = ConfigDict(populate_by_name=True)

    id: str
    user_id: str = Field(alias="userId")
    patient_name: Optional[str] = Field(None, alias="patientName")
    patient_age: Optional[int] = Field(None, alias="patientAge")
    patient_gender: Optional[str] = Field(None, alias="patientGender")
    patient_id_external: Optional[str] = Field(None, alias="patientId")
    clinical_notes: Optional[str] = Field(None, alias="clinicalNotes")
    file_type: str = Field(alias="fileType")
    file_name: str = Field(alias="fileName")
    uploaded_at: str = Field(alias="uploadedAt")
    signal_quality: SignalQualityOut = Field(alias="signalQuality")
    heart_rate: HeartRateOut = Field(alias="heartRate")
    ai_prediction: AIPredictionOut = Field(alias="aiPrediction")
    anomaly_score: float = Field(alias="anomalyScore")
    focus_area: FocusAreaOut = Field(alias="focusArea")
    raw_signal: List[float] = Field(alias="rawSignal")
    processing_time: float = Field(alias="processingTime")
    status: str
    review: Optional[DoctorReviewOut] = None

    def model_dump(self, **kwargs):
        kwargs.setdefault("by_alias", True)
        return super().model_dump(**kwargs)


# ── Chat ──────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    user_message: str = Field(alias="userMessage")
    analysis_context: Optional[Dict] = Field(None, alias="analysisContext")


class ChatResponse(BaseModel):
    success: bool
    reply: str
    model: str = "claude-3-5-sonnet"


# ── Generic ───────────────────────────────────────────────────────────────

class ApiResponse(BaseModel):
    success: bool = True
    data: Optional[object] = None
    error: Optional[str] = None
    timestamp: Optional[str] = None
    message: Optional[str] = None
