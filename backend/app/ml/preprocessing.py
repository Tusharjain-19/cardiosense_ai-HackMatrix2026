"""
CardioAI Backend — ECG Signal Preprocessing
Bandpass filtering, baseline removal, normalization, and resampling.

IMPORTANT: This pipeline MUST be identical during training and inference.
Changing the order or parameters requires retraining the model.
"""

import numpy as np
from scipy import signal
from scipy.signal import butter, filtfilt


class ECGPreprocessor:
    """
    Signal preprocessing pipeline for ECG recordings.
    Input:  raw 1-D numpy array (any length, any sampling rate)
    Output: preprocessed array of exactly `target_length` samples (float32)
    """

    def __init__(self, sampling_rate: int = 360):
        self.sampling_rate = sampling_rate
        self.target_length = sampling_rate * 10  # 10 seconds → 3600 samples

    def bandpass_filter(
        self,
        signal_data: np.ndarray,
        low_freq: float = 0.5,
        high_freq: float = 100.0,
    ) -> np.ndarray:
        """
        Butterworth bandpass filter.
        Removes DC offset (< 0.5 Hz) and high-frequency noise (> 100 Hz).
        """
        nyquist = self.sampling_rate / 2

        # Clamp high_freq to just below Nyquist to avoid filter instability
        high_freq = min(high_freq, nyquist - 1)
        if low_freq >= high_freq:
            return signal_data

        low = low_freq / nyquist
        high = high_freq / nyquist

        b, a = butter(4, [low, high], btype="band")
        return filtfilt(b, a, signal_data)

    def remove_baseline_drift(self, signal_data: np.ndarray) -> np.ndarray:
        """
        High-pass filter at 0.5 Hz to remove low-frequency baseline wander.
        """
        nyquist = self.sampling_rate / 2
        low = 0.5 / nyquist

        if low >= 1.0:
            return signal_data

        b, a = butter(4, low, btype="high")
        return filtfilt(b, a, signal_data)

    def normalize(self, signal_data: np.ndarray) -> np.ndarray:
        """Zero mean, unit variance normalization."""
        mean = np.mean(signal_data)
        std = np.std(signal_data)
        if std == 0:
            std = 1.0
        return (signal_data - mean) / std

    def resample_signal(
        self,
        signal_data: np.ndarray,
        original_rate: int = 360,
        target_rate: int = 360,
    ) -> np.ndarray:
        """Resample to target sampling rate using scipy."""
        if original_rate == target_rate:
            return signal_data
        num_samples = int(len(signal_data) * target_rate / original_rate)
        return signal.resample(signal_data, num_samples)

    def pad_or_truncate(self, signal_data: np.ndarray) -> np.ndarray:
        """
        Ensure signal is exactly target_length samples.
        Truncates from the end or zero-pads as needed.
        """
        if len(signal_data) > self.target_length:
            return signal_data[: self.target_length]
        elif len(signal_data) < self.target_length:
            padding = self.target_length - len(signal_data)
            return np.pad(signal_data, (0, padding), mode="constant")
        return signal_data

    def preprocess(
        self,
        signal_data: np.ndarray,
        original_sampling_rate: int = 360,
    ) -> np.ndarray:
        """
        Complete preprocessing pipeline.

        Order:
          1. Resample → target sampling rate
          2. Bandpass filter (0.5–100 Hz)
          3. Remove baseline drift
          4. Normalize (z-score)
          5. Pad / truncate to exact length

        Returns: float32 array of shape (target_length,)
        """
        # Ensure float
        signal_data = np.asarray(signal_data, dtype=np.float64)

        # Step 1: Resample
        signal_data = self.resample_signal(
            signal_data, original_sampling_rate, self.sampling_rate
        )

        # Step 2: Bandpass (only if signal is long enough for the filter)
        if len(signal_data) > 30:
            signal_data = self.bandpass_filter(signal_data)

        # Step 3: Remove baseline drift
        if len(signal_data) > 30:
            signal_data = self.remove_baseline_drift(signal_data)

        # Step 4: Normalize
        signal_data = self.normalize(signal_data)

        # Step 5: Pad / truncate
        signal_data = self.pad_or_truncate(signal_data)

        return signal_data.astype(np.float32)
