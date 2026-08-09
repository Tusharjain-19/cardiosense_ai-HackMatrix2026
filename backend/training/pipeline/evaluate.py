"""
CardioAI — Model Evaluation
Comprehensive metrics: accuracy, precision, recall, F1, confusion matrix.
"""

import torch
import numpy as np
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report,
)
from pathlib import Path
import json


class ModelEvaluator:
    """Evaluate a trained ECG model on test data."""

    def __init__(self, model, device=None):
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.model = model.to(self.device)
        self.model.eval()

    def predict(self, test_loader):
        """Get predictions and probabilities."""
        all_preds = []
        all_probs = []
        all_labels = []

        with torch.no_grad():
            for signals, labels in test_loader:
                signals = signals.to(self.device)

                logits = self.model(signals)
                probs = torch.softmax(logits, dim=1)
                preds = torch.argmax(logits, dim=1)

                all_preds.extend(preds.cpu().numpy())
                all_probs.extend(probs.cpu().numpy())
                all_labels.extend(labels.numpy())

        return np.array(all_preds), np.array(all_probs), np.array(all_labels)

    def compute_metrics(self, y_true, y_pred, class_names=None):
        """Compute comprehensive evaluation metrics."""
        metrics = {
            "accuracy": float(accuracy_score(y_true, y_pred)),
            "precision_macro": float(
                precision_score(y_true, y_pred, average="macro", zero_division=0)
            ),
            "recall_macro": float(
                recall_score(y_true, y_pred, average="macro", zero_division=0)
            ),
            "f1_macro": float(
                f1_score(y_true, y_pred, average="macro", zero_division=0)
            ),
            "confusion_matrix": confusion_matrix(y_true, y_pred).tolist(),
        }

        if class_names:
            report = classification_report(
                y_true, y_pred, target_names=class_names,
                output_dict=True, zero_division=0,
            )
            metrics["per_class"] = {
                name: {
                    "precision": report[name]["precision"],
                    "recall": report[name]["recall"],
                    "f1": report[name]["f1-score"],
                    "support": report[name]["support"],
                }
                for name in class_names
                if name in report
            }

        return metrics

    def evaluate(self, test_loader, class_names=None, output_dir="training/results"):
        """Complete evaluation with metrics report."""
        Path(output_dir).mkdir(parents=True, exist_ok=True)

        y_pred, y_proba, y_true = self.predict(test_loader)
        metrics = self.compute_metrics(y_true, y_pred, class_names)

        # Save
        with open(f"{output_dir}/metrics.json", "w") as f:
            json.dump(metrics, f, indent=2)

        # Print report
        print("\n" + "=" * 50)
        print("EVALUATION RESULTS")
        print("=" * 50)
        print(f"Accuracy:  {metrics['accuracy']:.4f}")
        print(f"F1 Macro:  {metrics['f1_macro']:.4f}")
        print(f"Precision: {metrics['precision_macro']:.4f}")
        print(f"Recall:    {metrics['recall_macro']:.4f}")

        if "per_class" in metrics:
            print("\nPer-class:")
            for name, scores in metrics["per_class"].items():
                print(
                    f"  {name:20s}  P={scores['precision']:.3f}  "
                    f"R={scores['recall']:.3f}  F1={scores['f1']:.3f}"
                )

        return metrics
