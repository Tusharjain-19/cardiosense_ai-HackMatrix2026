"""
Tests for the 1D CNN model architecture.
"""

import pytest

try:
    import torch
    from training.models.cnn_1d import ECG_CNN_1D
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False


@pytest.mark.skipif(not TORCH_AVAILABLE, reason="PyTorch not installed")
class TestECGCNN:
    """Test 1D CNN model."""

    def test_output_shape(self):
        """Output should be (batch, 5)."""
        model = ECG_CNN_1D(num_classes=5)
        model.eval()
        x = torch.randn(2, 1, 3600)
        with torch.no_grad():
            out = model(x)
        assert out.shape == (2, 5)

    def test_single_sample(self):
        """Single sample inference should work."""
        model = ECG_CNN_1D(num_classes=5)
        model.eval()
        x = torch.randn(1, 1, 3600)
        with torch.no_grad():
            out = model(x)
        assert out.shape == (1, 5)

    def test_softmax_sums_to_one(self):
        """Softmax of output should sum to 1."""
        model = ECG_CNN_1D(num_classes=5)
        model.eval()
        x = torch.randn(1, 1, 3600)
        with torch.no_grad():
            out = model(x)
            probs = torch.softmax(out, dim=1)
        assert torch.allclose(probs.sum(), torch.tensor(1.0), atol=1e-5)

    def test_custom_num_classes(self):
        """Model should support variable number of classes."""
        model = ECG_CNN_1D(num_classes=3)
        model.eval()
        x = torch.randn(1, 1, 3600)
        with torch.no_grad():
            out = model(x)
        assert out.shape == (1, 3)

    def test_gradient_flow(self):
        """Gradients should flow through the model."""
        model = ECG_CNN_1D(num_classes=5)
        x = torch.randn(1, 1, 3600, requires_grad=True)
        out = model(x)
        loss = out.sum()
        loss.backward()
        assert x.grad is not None
        assert x.grad.shape == (1, 1, 3600)
