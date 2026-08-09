"""
CardioAI — Training Pipeline
PyTorch training loop with early stopping, class-weighted loss,
learning rate scheduling, and checkpointing.
"""

import torch
import torch.nn as nn
from torch.utils.data import DataLoader, Dataset
import numpy as np
from pathlib import Path
from tqdm import tqdm
import json
from datetime import datetime


class ECGDataset(Dataset):
    """PyTorch dataset wrapper for ECG signals."""

    def __init__(self, df, label_map=None):
        self.signals = [
            torch.from_numpy(s).unsqueeze(0).float()
            for s in df["signal"].values
        ]
        self.labels = df["label"].values

        if label_map is None:
            unique_labels = sorted(np.unique(self.labels))
            self.label_map = {label: idx for idx, label in enumerate(unique_labels)}
        else:
            self.label_map = label_map

        self.label_indices = np.array([
            self.label_map[label] for label in self.labels
        ])

    def __len__(self):
        return len(self.signals)

    def __getitem__(self, idx):
        return self.signals[idx], self.label_indices[idx]


class ECGTrainer:
    """Training orchestrator with early stopping."""

    def __init__(self, model, device=None):
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.model = model.to(self.device)
        self.history = {
            "train_loss": [],
            "val_loss": [],
            "train_acc": [],
            "val_acc": [],
        }
        self.best_val_loss = float("inf")
        self.patience_counter = 0

    def train_epoch(self, train_loader, optimizer, criterion):
        """Train one epoch."""
        self.model.train()
        total_loss = 0
        correct = 0
        total = 0

        pbar = tqdm(train_loader, desc="Training")
        for signals, labels in pbar:
            signals = signals.to(self.device)
            labels = labels.to(self.device).long()

            optimizer.zero_grad()
            logits = self.model(signals)
            loss = criterion(logits, labels)

            loss.backward()
            optimizer.step()

            total_loss += loss.item()
            _, predicted = torch.max(logits, 1)
            correct += (predicted == labels).sum().item()
            total += labels.size(0)
            pbar.set_postfix({"loss": f"{loss.item():.4f}"})

        return total_loss / len(train_loader), correct / total

    def validate(self, val_loader, criterion):
        """Validate on held-out data."""
        self.model.eval()
        total_loss = 0
        correct = 0
        total = 0

        with torch.no_grad():
            for signals, labels in val_loader:
                signals = signals.to(self.device)
                labels = labels.to(self.device).long()

                logits = self.model(signals)
                loss = criterion(logits, labels)

                total_loss += loss.item()
                _, predicted = torch.max(logits, 1)
                correct += (predicted == labels).sum().item()
                total += labels.size(0)

        return total_loss / len(val_loader), correct / total

    def fit(
        self,
        train_loader,
        val_loader,
        epochs: int = 50,
        learning_rate: float = 0.001,
        patience: int = 10,
        checkpoint_dir: str = "models/checkpoints",
    ):
        """Full training loop with early stopping."""

        Path(checkpoint_dir).mkdir(parents=True, exist_ok=True)

        # Class weights for imbalanced data
        all_labels = train_loader.dataset.label_indices
        unique, counts = np.unique(all_labels, return_counts=True)
        class_weights = torch.tensor(
            [len(all_labels) / (len(unique) * c) for c in counts],
            dtype=torch.float32,
            device=self.device,
        )

        optimizer = torch.optim.Adam(self.model.parameters(), lr=learning_rate)
        criterion = nn.CrossEntropyLoss(weight=class_weights)
        scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
            optimizer, mode="min", factor=0.5, patience=5
        )

        for epoch in range(epochs):
            print(f"\nEpoch {epoch + 1}/{epochs}")

            train_loss, train_acc = self.train_epoch(
                train_loader, optimizer, criterion
            )
            val_loss, val_acc = self.validate(val_loader, criterion)

            print(
                f"  Train Loss: {train_loss:.4f}  Acc: {train_acc:.4f}\n"
                f"  Val   Loss: {val_loss:.4f}  Acc: {val_acc:.4f}"
            )

            self.history["train_loss"].append(train_loss)
            self.history["val_loss"].append(val_loss)
            self.history["train_acc"].append(train_acc)
            self.history["val_acc"].append(val_acc)

            scheduler.step(val_loss)

            if val_loss < self.best_val_loss:
                self.best_val_loss = val_loss
                self.patience_counter = 0

                path = f"{checkpoint_dir}/best_model.pth"
                torch.save({
                    "epoch": epoch,
                    "model_state": self.model.state_dict(),
                    "optimizer_state": optimizer.state_dict(),
                    "val_loss": val_loss,
                    "val_acc": val_acc,
                    "label_map": train_loader.dataset.label_map,
                }, path)
                print(f"  ✓ Saved checkpoint: {path}")
            else:
                self.patience_counter += 1
                if self.patience_counter >= patience:
                    print(f"\nEarly stopping at epoch {epoch + 1}")
                    break

        # Save training history
        with open(f"{checkpoint_dir}/history.json", "w") as f:
            json.dump(self.history, f, indent=2)

        print("\nTraining complete!")
        return self.history
