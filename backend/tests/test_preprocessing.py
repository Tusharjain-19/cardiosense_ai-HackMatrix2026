"""
Tests for ECG signal preprocessing pipeline.
"""

import numpy as np
import pytest
from app.ml.preprocessing import ECGPreprocessor
from app.ml.quality import SignalQualityAssessor


class TestECGPreprocessor:
    """Test ECG preprocessing pipeline."""

    def setup_method(self):
        self.preprocessor = ECGPreprocessor(sampling_rate=360)

    def test_output_shape(self):
        """Preprocessed signal should be exactly 3600 samples."""
        raw = np.random.randn(5000)
        result = self.preprocessor.preprocess(raw)
        assert result.shape == (3600,)

    def test_output_dtype(self):
        """Output should be float32."""
        raw = np.random.randn(3600)
        result = self.preprocessor.preprocess(raw)
        assert result.dtype == np.float32

    def test_short_signal_padding(self):
        """Short signals should be zero-padded."""
        raw = np.random.randn(1000)
        result = self.preprocessor.preprocess(raw)
        assert result.shape == (3600,)

    def test_long_signal_truncation(self):
        """Long signals should be truncated."""
        raw = np.random.randn(10000)
        result = self.preprocessor.preprocess(raw)
        assert result.shape == (3600,)

    def test_normalization(self):
        """Output should be approximately normalized."""
        raw = np.random.randn(3600) * 100 + 50
        result = self.preprocessor.preprocess(raw)
        assert abs(np.mean(result)) < 0.5  # Near zero mean
        assert 0.5 < np.std(result) < 2.0  # Reasonable std

    def test_resampling(self):
        """Different sampling rate should be handled."""
        raw = np.random.randn(5000)
        result = self.preprocessor.preprocess(raw, original_sampling_rate=500)
        assert result.shape == (3600,)


class TestSignalQualityAssessor:
    """Test signal quality assessment."""

    def setup_method(self):
        self.assessor = SignalQualityAssessor(sampling_rate=360)

    def test_quality_score_range(self):
        """Score should be 0-100."""
        signal = np.sin(2 * np.pi * 1 * np.linspace(0, 10, 3600))
        score, status, factors = self.assessor.calculate_quality_score(signal)
        assert 0 <= score <= 100

    def test_quality_status_values(self):
        """Status should be GOOD, MODERATE, or POOR."""
        signal = np.random.randn(3600)
        _, status, _ = self.assessor.calculate_quality_score(signal)
        assert status in ("GOOD", "MODERATE", "POOR")

    def test_quality_factors_keys(self):
        """Factors should have noise, baseline, saturation."""
        signal = np.random.randn(3600)
        _, _, factors = self.assessor.calculate_quality_score(signal)
        assert "noise" in factors
        assert "baseline" in factors
        assert "saturation" in factors

    def test_clean_signal_high_quality(self):
        """Clean sine wave should have high quality score."""
        t = np.linspace(0, 10, 3600)
        signal = np.sin(2 * np.pi * 1 * t)
        score, status, _ = self.assessor.calculate_quality_score(signal)
        assert score >= 70

    def test_noisy_signal_lower_quality(self):
        """Very noisy signal should have lower quality."""
        signal = np.random.randn(3600) * 10
        score, _, _ = self.assessor.calculate_quality_score(signal)
        assert score <= 90  # Should be penalized
