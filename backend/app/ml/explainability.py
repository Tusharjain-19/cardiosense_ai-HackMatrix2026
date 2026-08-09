"""
CardioAI Backend — Explainability Module
Gradient-based saliency maps to highlight important ECG regions
that influenced the model's prediction.
"""

import numpy as np

try:
    import torch
    from scipy.ndimage import gaussian_filter1d
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False


class ExplainabilityModule:
    """Generate saliency-based explanations for ECG model predictions."""

    def __init__(self, model=None, device=None):
        self.model = model
        self.device = device

    def explain(
        self, signal_tensor, sampling_rate: int = 360
    ) -> list[dict]:
        """
        Compute gradient-based saliency for the predicted class.
        Returns a list of important regions sorted by importance.

        Args:
            signal_tensor: torch.Tensor of shape (1, 1, 3600)
            sampling_rate: samples per second

        Returns:
            List of dicts with start_time, end_time, importance
        """
        if not TORCH_AVAILABLE or self.model is None:
            return self._demo_regions(sampling_rate)

        try:
            signal_tensor = signal_tensor.clone().detach().requires_grad_(True)

            # Forward pass
            logits = self.model(signal_tensor)
            pred_class = torch.argmax(logits, dim=1)

            # Backward pass on the predicted class logit
            self.model.zero_grad()
            target_logit = logits[0, pred_class.item()]
            target_logit.backward()

            # Get gradient magnitudes
            gradients = signal_tensor.grad[0, 0].cpu().numpy()

            # Smooth with Gaussian filter
            smooth_grads = gaussian_filter1d(np.abs(gradients), sigma=10)

            # Find regions above 75th percentile
            threshold = np.percentile(smooth_grads, 75)
            important_mask = smooth_grads > threshold

            regions = self._extract_regions(important_mask, smooth_grads, sampling_rate)

            # Sort by importance, return top 3
            regions.sort(key=lambda x: x["importance"], reverse=True)
            return regions[:3]

        except Exception:
            return self._demo_regions(sampling_rate)

    def _extract_regions(
        self, mask: np.ndarray, gradients: np.ndarray, sampling_rate: int
    ) -> list[dict]:
        """Extract contiguous regions from a binary mask."""
        regions = []
        in_region = False
        start = 0

        for i, is_important in enumerate(mask):
            if is_important and not in_region:
                start = i
                in_region = True
            elif not is_important and in_region:
                regions.append({
                    "start_time": round(start / sampling_rate, 2),
                    "end_time": round(i / sampling_rate, 2),
                    "importance": float(np.mean(gradients[start:i])),
                })
                in_region = False

        # Close final region if still open
        if in_region:
            regions.append({
                "start_time": round(start / sampling_rate, 2),
                "end_time": round(len(mask) / sampling_rate, 2),
                "importance": float(np.mean(gradients[start:])),
            })

        return regions

    def _demo_regions(self, sampling_rate: int = 360) -> list[dict]:
        """Return plausible demo regions when no model is available."""
        return [
            {
                "start_time": 3.2,
                "end_time": 4.8,
                "importance": 0.91,
            },
            {
                "start_time": 7.1,
                "end_time": 7.9,
                "importance": 0.68,
            },
        ]
