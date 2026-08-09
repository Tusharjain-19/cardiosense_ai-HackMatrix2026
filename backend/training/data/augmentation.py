"""
CardioAI — Data Augmentation for ECG Signals
Augmentation strategies to increase dataset diversity and model robustness.
"""

import numpy as np


class ECGAugmentation:
    """Augmentation transforms for ECG signal data."""

    def __init__(self, sampling_rate: int = 360):
        self.sampling_rate = sampling_rate

    def add_noise(self, signal: np.ndarray, noise_factor: float = 0.05) -> np.ndarray:
        """Add Gaussian noise."""
        noise = np.random.randn(*signal.shape) * noise_factor
        return signal + noise

    def time_shift(self, signal: np.ndarray, shift_max: int = 100) -> np.ndarray:
        """Random circular time shift."""
        shift = np.random.randint(-shift_max, shift_max)
        return np.roll(signal, shift)

    def scale(self, signal: np.ndarray, factor_range: tuple = (0.8, 1.2)) -> np.ndarray:
        """Random amplitude scaling."""
        factor = np.random.uniform(*factor_range)
        return signal * factor

    def invert(self, signal: np.ndarray) -> np.ndarray:
        """Polarity inversion (flips signal upside down)."""
        return -signal

    def time_warp(self, signal: np.ndarray, sigma: float = 0.2) -> np.ndarray:
        """Simple time warping via resampling a slightly different length."""
        orig_len = len(signal)
        warp_factor = 1.0 + np.random.uniform(-sigma, sigma)
        new_len = int(orig_len * warp_factor)
        indices = np.linspace(0, orig_len - 1, new_len)
        warped = np.interp(indices, np.arange(orig_len), signal)
        # Resize back
        final_indices = np.linspace(0, len(warped) - 1, orig_len)
        return np.interp(final_indices, np.arange(len(warped)), warped)

    def random_augment(self, signal: np.ndarray) -> np.ndarray:
        """Apply a random combination of augmentations."""
        augmented = signal.copy()

        if np.random.random() > 0.5:
            augmented = self.add_noise(augmented)
        if np.random.random() > 0.5:
            augmented = self.time_shift(augmented)
        if np.random.random() > 0.7:
            augmented = self.scale(augmented)
        if np.random.random() > 0.9:
            augmented = self.invert(augmented)
        if np.random.random() > 0.7:
            augmented = self.time_warp(augmented)

        return augmented
