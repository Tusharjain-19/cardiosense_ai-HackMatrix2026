"""
CardioAI Backend — SQLAlchemy ORM Models
Defines User, Analysis, and ModelRegistry tables.
"""

from sqlalchemy import (
    Column, String, Integer, Float, DateTime, Boolean, Text, JSON, ForeignKey,
)
from datetime import datetime, timezone
import uuid

from app.database.engine import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    age = Column(Integer)
    gender = Column(String(50))
    height = Column(Integer)          # cm
    weight = Column(Integer)          # kg
    role = Column(String(50), default="patient")  # patient | doctor | admin
    created_at = Column(DateTime, default=_utcnow)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow)
    is_active = Column(Boolean, default=True)


class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(String(36), primary_key=True, default=_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)

    # Patient metadata (optional, submitted with upload)
    patient_name = Column(String(255))
    patient_age = Column(Integer)
    patient_gender = Column(String(50))
    patient_id_external = Column(String(100))
    clinical_notes = Column(Text)

    # File info
    file_name = Column(String(255))
    file_type = Column(String(50))   # ECG | PPG
    file_path = Column(String(500))

    # Signal metadata
    duration = Column(Integer)
    sampling_rate = Column(Integer)
    num_samples = Column(Integer)

    # Signal quality
    quality_score = Column(Integer)
    quality_status = Column(String(50))  # GOOD | MODERATE | POOR
    quality_factors = Column(JSON)       # {noise, baseline, saturation}

    # Heart rate
    hr_average = Column(Integer)
    hr_min = Column(Integer)
    hr_max = Column(Integer)
    hr_variability = Column(String(50))

    # AI prediction
    prediction_class = Column(String(100))
    prediction_confidence = Column(Float)
    class_distribution = Column(JSON)    # {Normal: 0.95, ...}

    # Anomaly
    anomaly_score = Column(Float)

    # Explainability / Focus area
    focus_start = Column(Float)
    focus_end = Column(Float)
    focus_description = Column(Text)
    importance_score = Column(Float)

    # Model info
    model_version = Column(String(50))
    processing_time = Column(Float)

    # Raw signal for display (stored as JSON array)
    raw_signal = Column(JSON)

    # Status
    status = Column(String(50), default="PROCESSING", index=True)
    error_message = Column(Text)

    # Doctor review
    reviewed = Column(Boolean, default=False)
    reviewer_id = Column(String(36), ForeignKey("users.id", use_alter=True))
    review_assessment = Column(String(50))
    review_notes = Column(Text)
    reviewed_at = Column(DateTime)

    # Timestamps
    uploaded_at = Column(DateTime, default=_utcnow, index=True)
    created_at = Column(DateTime, default=_utcnow)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow)
    is_deleted = Column(Boolean, default=False)


class ModelRegistry(Base):
    __tablename__ = "model_registry"

    id = Column(String(36), primary_key=True, default=_uuid)
    version = Column(String(50), unique=True)
    model_path = Column(String(255))
    accuracy = Column(Float)
    precision_score = Column(Float)
    recall = Column(Float)
    f1_score = Column(Float)
    auc_roc = Column(Float)
    confusion_matrix = Column(JSON)
    class_metrics = Column(JSON)
    dataset_version = Column(String(50))
    training_date = Column(DateTime)
    hyperparameters = Column(JSON)
    status = Column(String(50), default="ARCHIVED")  # ARCHIVED | PRODUCTION
    created_at = Column(DateTime, default=_utcnow)
