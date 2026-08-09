"""
CardioAI — 1D Convolutional Neural Network for ECG Classification

Architecture:
  Input:  (batch, 1, 3600)  — 10 seconds @ 360 Hz
  Block1: Conv1d(1→64, k=5) → BN → ReLU → MaxPool(2)
  Block2: Conv1d(64→128, k=5) → BN → ReLU → MaxPool(2)
  Block3: Conv1d(128→256, k=5) → BN → ReLU → MaxPool(2)
  GAP:    AdaptiveAvgPool1d(1) → squeeze
  FC:     Linear(256→128) → ReLU → Dropout(0.5) → Linear(128→5)
  Output: (batch, 5)  — logits for 5 classes

Classes: Normal, Bradycardia, Tachycardia, Irregular Rhythm, Other
"""

import torch
import torch.nn as nn
import torch.nn.functional as F


class ECG_CNN_1D(nn.Module):
    """1D CNN for ECG rhythm classification."""

    def __init__(self, num_classes: int = 5, dropout_rate: float = 0.5):
        super().__init__()

        # ── Block 1: (batch, 1, 3600) → (batch, 64, 1800) ──
        self.conv1 = nn.Conv1d(1, 64, kernel_size=5, stride=1, padding=2)
        self.bn1 = nn.BatchNorm1d(64)
        self.pool1 = nn.MaxPool1d(2)

        # ── Block 2: (batch, 64, 1800) → (batch, 128, 900) ──
        self.conv2 = nn.Conv1d(64, 128, kernel_size=5, stride=1, padding=2)
        self.bn2 = nn.BatchNorm1d(128)
        self.pool2 = nn.MaxPool1d(2)

        # ── Block 3: (batch, 128, 900) → (batch, 256, 450) ──
        self.conv3 = nn.Conv1d(128, 256, kernel_size=5, stride=1, padding=2)
        self.bn3 = nn.BatchNorm1d(256)
        self.pool3 = nn.MaxPool1d(2)

        # ── Classifier ──
        self.fc1 = nn.Linear(256, 128)
        self.dropout = nn.Dropout(dropout_rate)
        self.fc2 = nn.Linear(128, num_classes)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Forward pass.

        Args:
            x: (batch, 1, 3600) raw or preprocessed ECG signal
        Returns:
            logits: (batch, num_classes)
        """
        # Block 1
        x = self.pool1(F.relu(self.bn1(self.conv1(x))))
        # Block 2
        x = self.pool2(F.relu(self.bn2(self.conv2(x))))
        # Block 3
        x = self.pool3(F.relu(self.bn3(self.conv3(x))))
        # Global Average Pooling → (batch, 256, 1) → (batch, 256)
        x = F.adaptive_avg_pool1d(x, 1).squeeze(-1)
        # Dense
        x = F.relu(self.fc1(x))
        x = self.dropout(x)
        x = self.fc2(x)

        return x


# Quick test
if __name__ == "__main__":
    model = ECG_CNN_1D(num_classes=5)
    dummy = torch.randn(2, 1, 3600)
    out = model(dummy)
    print(f"Input shape:  {dummy.shape}")
    print(f"Output shape: {out.shape}")     # (2, 5)
    print(f"Parameters:   {sum(p.numel() for p in model.parameters()):,}")
