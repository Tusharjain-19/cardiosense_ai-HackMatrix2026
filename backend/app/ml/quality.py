"""
CardioAI Backend — Signal Quality Assessment
Evaluates ECG signal quality using noise level, baseline stability,
and saturation metrics. Returns a composite score (0–100).
"""

import numpy as np
from scipy import signal as sp_signal


class SignalQualityAssessor:
    """Assess ECG signal quality and return a composite score."""

    def __init__(self, sampling_rate: int = 360):
        self.sampling_rate = sampling_rate

    def assess_noise_level(self, signal_data: np.ndarray) -> str:
        """
        Estimate noise via high-frequency power ratio (SNR proxy).
        Returns: 'low' | 'moderate' | 'high'
        """
        nyquist = self.sampling_rate / 2
        high_freq_start = min(50.0 / nyquist, 0.99)

        power_total = np.mean(signal_data ** 2) + 1e-10

        try:
            b, a = sp_signal.butter(2, high_freq_start, btype="high")
            high_freq = sp_signal.filtfilt(b, a, signal_data)
            power_noise = np.mean(high_freq ** 2)
        except Exception:
            return "moderate"

        snr = power_total / (power_noise + 1e-10)

        if snr > 20:
            return "low"
        elif snr > 10:
            return "moderate"
        return "high"

    def assess_baseline_stability(self, signal_data: np.ndarray) -> str:
        """
        Evaluate low-frequency drift magnitude (< 0.2 Hz).
        Returns: 'stable' | 'drift' | 'unstable'
        """
        nyquist = self.sampling_rate / 2
        low_freq_cutoff = 0.2 / nyquist

        if low_freq_cutoff >= 1.0 or len(signal_data) < 30:
            return "stable"

        try:
            b, a = sp_signal.butter(2, low_freq_cutoff, btype="low")
            baseline = sp_signal.filtfilt(b, a, signal_data)
        except Exception:
            return "stable"

        drift_range = float(np.max(baseline) - np.min(baseline))
        signal_range = float(np.max(signal_data) - np.min(signal_data)) + 1e-10
        drift_ratio = drift_range / signal_range

        if drift_ratio < 0.2:
            return "stable"
        elif drift_ratio < 0.5:
            return "drift"
        return "unstable"

    def assess_saturation(self, signal_data: np.ndarray) -> str:
        """
        Check for clipping/saturation (flat plateaus at signal extremes).
        Returns: 'none' | 'partial' | 'full'
        """
        max_val = float(np.abs(signal_data).max())
        if max_val == 0:
            return "none"

        near_max = np.abs(signal_data) >= 0.98 * max_val
        diff_zero = np.abs(np.diff(signal_data, prepend=signal_data[0])) < 1e-4
        flat_count = np.sum(near_max & diff_zero)
        ratio = flat_count / len(signal_data)

        if ratio < 0.01:
            return "none"
        elif ratio < 0.05:
            return "partial"
        return "full"

    def calculate_quality_score(
        self, signal_data: np.ndarray
    ) -> tuple[int, str, dict]:
        """
        Compute overall quality score (0–100) with status and factor breakdown.

        Returns: (score, status, factors_dict)
        """
        noise = self.assess_noise_level(signal_data)
        baseline = self.assess_baseline_stability(signal_data)
        saturation = self.assess_saturation(signal_data)

        # Start at 100 and subtract penalties
        score = 100

        noise_penalty = {"low": 0, "moderate": -15, "high": -40}
        baseline_penalty = {"stable": 0, "drift": -10, "unstable": -30}
        saturation_penalty = {"none": 0, "partial": -20, "full": -50}

        score += noise_penalty.get(noise, 0)
        score += baseline_penalty.get(baseline, 0)
        score += saturation_penalty.get(saturation, 0)

        score = max(0, min(100, score))

        if score >= 80:
            status = "GOOD"
        elif score >= 50:
            status = "MODERATE"
        else:
            status = "POOR"

        factors = {
            "noise": noise,
            "baseline": baseline,
            "saturation": saturation,
        }

        return score, status, factors
