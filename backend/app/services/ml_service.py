"""
CardioAI Backend — ML Inference Service
Dual-mode: real model inference when a trained .pth exists,
or heuristic demo mode for hackathon presentations.
"""

import math
import random
import numpy as np
from pathlib import Path

from app.ml.preprocessing import ECGPreprocessor
from app.ml.quality import SignalQualityAssessor
from app.ml.explainability import ExplainabilityModule
from app.utils.logger import get_logger

logger = get_logger(__name__)

# Optional torch import — demo mode works without it
try:
    import torch
    from scipy.signal import find_peaks
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False


class MLService:
    """
    ML inference service.

    When a trained model file exists:  loads the 1D-CNN and runs real inference.
    When DEMO_MODE is True or no model: generates realistic heuristic predictions
    using signal analysis (heart rate, noise, etc.).
    """

    CLASS_NAMES = ["Normal", "Bradycardia", "Tachycardia", "Irregular Rhythm", "Other"]

    def __init__(self, model_path: str = "", demo_mode: bool = True):
        self.preprocessor = ECGPreprocessor(sampling_rate=360)
        self.quality_assessor = SignalQualityAssessor(sampling_rate=360)
        self.model = None
        self.device = "cpu"
        self.demo_mode = demo_mode

        # Try loading a real model
        if TORCH_AVAILABLE and model_path and Path(model_path).exists():
            try:
                self.device = "cuda" if torch.cuda.is_available() else "cpu"
                from training.models.cnn_1d import ECG_CNN_1D

                self.model = ECG_CNN_1D(num_classes=5)
                checkpoint = torch.load(model_path, map_location=self.device)
                self.model.load_state_dict(checkpoint["model_state"])
                self.model.to(self.device)
                self.model.eval()
                self.demo_mode = False
                logger.info(f"Loaded trained model from {model_path}")
            except Exception as e:
                logger.warning(f"Failed to load model: {e}. Using demo mode.")
                self.model = None
                self.demo_mode = True
        else:
            logger.info("Demo mode active — using heuristic predictions")

        self.explainability = ExplainabilityModule(
            model=self.model, device=self.device
        )

    def analyze(
        self,
        raw_signal: np.ndarray,
        sampling_rate: int = 360,
        file_type: str = "ECG",
    ) -> dict:
        """
        Complete analysis pipeline.

        Returns a dict with: quality, heart_rate, prediction,
        anomaly_score, important_regions, processed_signal.
        """
        # 1. Quality assessment (on raw signal)
        quality_score, quality_status, quality_factors = (
            self.quality_assessor.calculate_quality_score(raw_signal)
        )

        # 2. Preprocessing
        processed = self.preprocessor.preprocess(raw_signal, sampling_rate)

        # 3. Heart rate extraction
        heart_rate = self._extract_heart_rate(processed)

        # 4. Prediction (real or demo)
        if self.demo_mode or self.model is None:
            prediction = self._demo_predict(
                processed, heart_rate, quality_status, file_type
            )
            important_regions = self.explainability._demo_regions()
        else:
            prediction, important_regions = self._model_predict(processed)

        # 5. Anomaly score
        anomaly_score = self._calculate_anomaly_score(prediction["class_distribution"])

        return {
            "quality": {
                "score": quality_score,
                "status": quality_status,
                "factors": quality_factors,
            },
            "heart_rate": heart_rate,
            "prediction": prediction,
            "anomaly_score": anomaly_score,
            "important_regions": important_regions,
            "processed_signal": processed.tolist(),
        }

    def _extract_heart_rate(self, processed_signal: np.ndarray) -> dict:
        """Extract heart rate from preprocessed ECG using R-peak detection."""
        try:
            if TORCH_AVAILABLE:
                peaks, _ = find_peaks(
                    processed_signal,
                    distance=int(0.4 * 360),  # minimum 0.4 sec between beats
                    height=0.3,
                )
            else:
                # Simple peak detection fallback
                peaks = self._simple_peak_detect(processed_signal)

            if len(peaks) < 2:
                return {"average": 72, "min": 68, "max": 79}

            intervals = np.diff(peaks) / 360.0  # seconds between beats
            hr_values = 60.0 / intervals          # BPM

            # Filter physiologically plausible HR (30–220 BPM)
            hr_values = hr_values[(hr_values > 30) & (hr_values < 220)]
            if len(hr_values) == 0:
                return {"average": 72, "min": 68, "max": 79}

            return {
                "average": int(np.mean(hr_values)),
                "min": int(np.min(hr_values)),
                "max": int(np.max(hr_values)),
            }
        except Exception:
            return {"average": 72, "min": 68, "max": 79}

    def _simple_peak_detect(self, signal_data: np.ndarray) -> np.ndarray:
        """Fallback peak detection without scipy."""
        peaks = []
        min_dist = int(0.4 * 360)
        for i in range(1, len(signal_data) - 1):
            if (
                signal_data[i] > signal_data[i - 1]
                and signal_data[i] > signal_data[i + 1]
                and signal_data[i] > 0.3
            ):
                if not peaks or (i - peaks[-1]) >= min_dist:
                    peaks.append(i)
        return np.array(peaks)

    def _model_predict(self, processed_signal: np.ndarray) -> tuple[dict, list]:
        """Run actual model inference."""
        signal_tensor = (
            torch.from_numpy(processed_signal)
            .unsqueeze(0)
            .unsqueeze(0)
            .to(self.device)
        )

        with torch.no_grad():
            logits = self.model(signal_tensor)
            probs = torch.softmax(logits, dim=1)

        probs_np = probs[0].cpu().numpy()
        pred_idx = int(np.argmax(probs_np))
        confidence = float(probs_np[pred_idx])

        class_dist = {
            self.CLASS_NAMES[i]: round(float(probs_np[i]), 4)
            for i in range(len(self.CLASS_NAMES))
        }

        # Explainability (needs grad, so separate call)
        signal_tensor_grad = (
            torch.from_numpy(processed_signal)
            .unsqueeze(0)
            .unsqueeze(0)
            .to(self.device)
        )
        important_regions = self.explainability.explain(signal_tensor_grad)

        return {
            "class": self.CLASS_NAMES[pred_idx],
            "confidence": round(confidence, 4),
            "class_distribution": class_dist,
        }, important_regions

    def _demo_predict(
        self,
        processed_signal: np.ndarray,
        heart_rate: dict,
        quality_status: str,
        file_type: str,
    ) -> dict:
        """
        Heuristic prediction based on signal features.
        Produces realistic-looking results for demo/hackathon.
        """
        avg_hr = heart_rate.get("average", 72)

        # Determine class from heart rate
        if avg_hr > 100:
            pred_class = "Tachycardia"
            confidence = 0.88 + random.uniform(0, 0.08)
        elif avg_hr < 55:
            pred_class = "Bradycardia"
            confidence = 0.82 + random.uniform(0, 0.10)
        elif quality_status == "POOR":
            pred_class = "Normal"
            confidence = 0.50 + random.uniform(0, 0.10)
        else:
            pred_class = "Normal"
            confidence = 0.92 + random.uniform(0, 0.06)

        # Reduce confidence for poor quality
        if quality_status == "POOR":
            confidence = min(confidence, 0.60)

        confidence = round(confidence, 3)
        remaining = round(1.0 - confidence, 4)

        class_dist = {}
        for cls in self.CLASS_NAMES:
            if cls == pred_class:
                class_dist[cls] = confidence
            else:
                class_dist[cls] = round(remaining / (len(self.CLASS_NAMES) - 1), 3)

        return {
            "class": pred_class,
            "confidence": confidence,
            "class_distribution": class_dist,
        }

    def _calculate_anomaly_score(self, class_distribution: dict) -> float:
        """Entropy-based anomaly score — higher = more uncertain."""
        probs = np.array(list(class_distribution.values()), dtype=np.float64)
        probs = probs + 1e-10  # avoid log(0)
        entropy = -np.sum(probs * np.log(probs))
        max_entropy = np.log(len(probs))
        return round(float(entropy / max_entropy), 3) if max_entropy > 0 else 0.0

    def generate_demo_signal(
        self,
        bpm: int = 72,
        duration_sec: int = 15,
        sampling_rate: int = 100,
        is_ppg: bool = False,
        noise_level: float = 0.04,
    ) -> list[float]:
        """
        Generate a synthetic ECG/PPG waveform for demo purposes.
        Used when processing uploaded files that can't be parsed as signal data.
        """
        total_pts = duration_sec * sampling_rate
        period = (60.0 / bpm) * sampling_rate
        signal_data = []

        for i in range(total_pts):
            phase = (i % period) / period
            val = 0.0

            if is_ppg:
                val = (
                    0.8 * math.exp(-((phase - 0.25) / 0.1) ** 2)
                    + 0.4 * math.exp(-((phase - 0.55) / 0.08) ** 2)
                )
            else:
                # P wave
                val += 0.15 * math.exp(-((phase - 0.15) / 0.03) ** 2)
                # Q wave
                val -= 0.15 * math.exp(-((phase - 0.35) / 0.01) ** 2)
                # R wave (main QRS peak)
                val += 1.2 * math.exp(-((phase - 0.40) / 0.015) ** 2)
                # S wave
                val -= 0.35 * math.exp(-((phase - 0.45) / 0.015) ** 2)
                # T wave
                val += 0.3 * math.exp(-((phase - 0.70) / 0.05) ** 2)

            noise = (random.random() - 0.5) * noise_level
            signal_data.append(round(val + noise, 4))

        return signal_data
