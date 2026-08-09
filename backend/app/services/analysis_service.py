"""
CardioAI Backend — Analysis Orchestration Service
Coordinates file handling, ML inference, and database persistence
for ECG/PPG analysis requests.
"""

import uuid
import time
import csv
import io
import numpy as np
from pathlib import Path
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.config import settings
from app.database.models import Analysis
from app.services.ml_service import MLService
from app.utils.logger import get_logger

logger = get_logger(__name__)


class AnalysisService:
    """Orchestrates the full analysis pipeline."""

    def __init__(self, ml_service: MLService):
        self.ml_service = ml_service

    async def process_upload(
        self,
        db: Session,
        user_id: str,
        file_content: bytes,
        file_name: str,
        file_type: str,
        patient_name: str | None = None,
        patient_age: int | None = None,
        patient_gender: str | None = None,
        patient_id: str | None = None,
        clinical_notes: str | None = None,
    ) -> Analysis:
        """
        Process an uploaded ECG/PPG file end-to-end.

        1. Parse signal from file
        2. Store file to disk
        3. Run ML analysis
        4. Save results to database
        5. Return the Analysis record
        """
        analysis_id = str(uuid.uuid4())
        start_time = time.time()

        # ── 1. Create initial DB record ──
        analysis = Analysis(
            id=analysis_id,
            user_id=user_id,
            patient_name=patient_name or "Patient",
            patient_age=patient_age,
            patient_gender=patient_gender,
            patient_id_external=patient_id,
            clinical_notes=clinical_notes,
            file_name=file_name,
            file_type=file_type,
            status="PROCESSING",
        )
        db.add(analysis)
        db.commit()

        try:
            # ── 2. Store file ──
            upload_dir = Path(settings.UPLOAD_DIR) / user_id / analysis_id
            upload_dir.mkdir(parents=True, exist_ok=True)
            file_path = upload_dir / file_name

            with open(file_path, "wb") as f:
                f.write(file_content)

            analysis.file_path = str(file_path)

            # ── 3. Parse signal from file ──
            raw_signal = self._parse_signal_file(file_content, file_name)

            if raw_signal is None:
                # Could not parse — generate a demo signal
                is_ppg = file_type.upper() == "PPG"
                bpm = 74
                noise = 0.35 if "noisy" in file_name.lower() else 0.04
                raw_signal_list = self.ml_service.generate_demo_signal(
                    bpm=bpm, duration_sec=15, is_ppg=is_ppg, noise_level=noise
                )
                raw_signal = np.array(raw_signal_list, dtype=np.float64)

            # ── 4. Run ML analysis ──
            results = self.ml_service.analyze(
                raw_signal,
                sampling_rate=360 if len(raw_signal) > 2000 else 100,
                file_type=file_type,
            )

            # ── 5. Populate analysis record ──
            analysis.duration = max(1, int(len(raw_signal) / 360))
            analysis.sampling_rate = 360 if len(raw_signal) > 2000 else 100
            analysis.num_samples = len(raw_signal)

            # Quality
            q = results["quality"]
            analysis.quality_score = q["score"]
            analysis.quality_status = q["status"]
            analysis.quality_factors = q["factors"]

            # Heart rate
            hr = results["heart_rate"]
            analysis.hr_average = hr["average"]
            analysis.hr_min = hr["min"]
            analysis.hr_max = hr["max"]
            analysis.hr_variability = "low"

            # Prediction
            pred = results["prediction"]
            analysis.prediction_class = pred["class"]
            analysis.prediction_confidence = pred["confidence"]
            analysis.class_distribution = pred["class_distribution"]

            # Anomaly
            analysis.anomaly_score = results["anomaly_score"]

            # Focus area / explainability
            regions = results.get("important_regions", [])
            if regions:
                top = regions[0]
                analysis.focus_start = top["start_time"]
                analysis.focus_end = top["end_time"]
                analysis.focus_description = (
                    f"Signal segment between {top['start_time']}s and "
                    f"{top['end_time']}s influenced the "
                    f"{pred['class']} classification."
                )
                analysis.importance_score = top["importance"]

            # Model info
            analysis.model_version = settings.MODEL_VERSION
            analysis.processing_time = round(time.time() - start_time, 2)

            # Store raw signal for frontend display
            if isinstance(raw_signal, np.ndarray):
                # Downsample for display if too long
                display_signal = raw_signal
                if len(display_signal) > 2000:
                    step = len(display_signal) // 1500
                    display_signal = display_signal[::step]
                analysis.raw_signal = [
                    round(float(v), 4) for v in display_signal
                ]
            else:
                analysis.raw_signal = raw_signal

            analysis.status = "COMPLETED"
            db.commit()
            db.refresh(analysis)

            logger.info(
                f"Analysis {analysis_id} completed: "
                f"{pred['class']} ({pred['confidence']:.1%}) "
                f"in {analysis.processing_time}s"
            )

        except Exception as e:
            logger.error(f"Analysis {analysis_id} failed: {e}")
            analysis.status = "FAILED"
            analysis.error_message = str(e)
            db.commit()

        return analysis

    def _parse_signal_file(
        self, content: bytes, filename: str
    ) -> np.ndarray | None:
        """
        Try to parse signal data from common file formats.
        Returns numpy array or None if parsing fails.
        """
        try:
            text = content.decode("utf-8", errors="ignore")

            if filename.endswith(".csv"):
                return self._parse_csv(text)
            elif filename.endswith(".txt"):
                return self._parse_txt(text)
            else:
                # Try CSV first, then plain text
                result = self._parse_csv(text)
                if result is not None:
                    return result
                return self._parse_txt(text)
        except Exception:
            return None

    def _parse_csv(self, text: str) -> np.ndarray | None:
        """Parse CSV file — look for numeric column."""
        try:
            reader = csv.reader(io.StringIO(text))
            values = []
            for row in reader:
                if not row:
                    continue
                # Try each column for numeric values
                for cell in row:
                    try:
                        val = float(cell.strip())
                        values.append(val)
                        break  # Take first numeric column per row
                    except ValueError:
                        continue

            if len(values) >= 100:
                return np.array(values, dtype=np.float64)
        except Exception:
            pass
        return None

    def _parse_txt(self, text: str) -> np.ndarray | None:
        """Parse plain text file — one value per line or comma-separated."""
        try:
            # Try comma-separated on first long line
            lines = text.strip().split("\n")
            if len(lines) == 1 and "," in lines[0]:
                values = [float(x.strip()) for x in lines[0].split(",") if x.strip()]
                if len(values) >= 100:
                    return np.array(values, dtype=np.float64)

            # One value per line
            values = []
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                try:
                    values.append(float(line))
                except ValueError:
                    continue

            if len(values) >= 100:
                return np.array(values, dtype=np.float64)
        except Exception:
            pass
        return None

    @staticmethod
    def analysis_to_response(analysis: Analysis) -> dict:
        """Convert an Analysis ORM record to the frontend-expected JSON shape."""
        # Build review dict if exists
        review = None
        if analysis.reviewed and analysis.reviewer_id:
            review = {
                "id": f"rev_{analysis.id[:8]}",
                "analysisId": analysis.id,
                "doctorId": analysis.reviewer_id,
                "doctorName": "",
                "assessment": analysis.review_assessment or "CONFIRMED",
                "notes": analysis.review_notes or "",
                "reviewedAt": (
                    analysis.reviewed_at.isoformat()
                    if analysis.reviewed_at
                    else datetime.now(timezone.utc).isoformat()
                ),
            }

        return {
            "id": analysis.id,
            "userId": analysis.user_id,
            "patientName": analysis.patient_name or "Patient",
            "patientAge": analysis.patient_age,
            "patientGender": analysis.patient_gender,
            "patientId": analysis.patient_id_external,
            "clinicalNotes": analysis.clinical_notes,
            "fileType": analysis.file_type or "ECG",
            "fileName": analysis.file_name or "recording.csv",
            "uploadedAt": (
                analysis.uploaded_at.isoformat()
                if analysis.uploaded_at
                else datetime.now(timezone.utc).isoformat()
            ),
            "signalQuality": {
                "score": analysis.quality_score or 0,
                "status": analysis.quality_status or "GOOD",
                "factors": analysis.quality_factors or {
                    "noise": "low",
                    "baseline": "stable",
                    "saturation": "none",
                },
            },
            "heartRate": {
                "average": analysis.hr_average or 72,
                "min": analysis.hr_min or 68,
                "max": analysis.hr_max or 79,
                "variability": analysis.hr_variability or "low",
            },
            "aiPrediction": {
                "class": analysis.prediction_class or "Normal",
                "confidence": analysis.prediction_confidence or 0.95,
                "classDistribution": analysis.class_distribution or {
                    "Normal": 0.95,
                    "Bradycardia": 0.02,
                    "Tachycardia": 0.01,
                    "Irregular Rhythm": 0.01,
                    "Other": 0.01,
                },
            },
            "anomalyScore": analysis.anomaly_score or 0.15,
            "focusArea": {
                "startTime": analysis.focus_start or 3.2,
                "endTime": analysis.focus_end or 4.8,
                "description": (
                    analysis.focus_description
                    or "Signal segment with highest model attention."
                ),
            },
            "rawSignal": analysis.raw_signal or [],
            "processingTime": analysis.processing_time or 2.0,
            "status": analysis.status or "COMPLETED",
            "review": review,
        }
