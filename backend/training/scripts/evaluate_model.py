"""
CardioAI — Evaluate Model Script
CLI entry point for evaluating a trained model on test data.

Usage:
    python training/scripts/evaluate_model.py --model models/v3/best_model.pth --data training/data/processed
"""

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

import torch
import pandas as pd
from torch.utils.data import DataLoader

from training.models.cnn_1d import ECG_CNN_1D
from training.pipeline.train import ECGDataset
from training.pipeline.evaluate import ModelEvaluator


CLASS_NAMES = ["Normal", "Bradycardia", "Tachycardia", "Irregular Rhythm", "Other"]


def main():
    parser = argparse.ArgumentParser(description="Evaluate CardioAI model")
    parser.add_argument("--model", default="models/v3/best_model.pth", help="Model path")
    parser.add_argument("--data", default="training/data/processed", help="Data dir")
    parser.add_argument("--batch_size", type=int, default=32, help="Batch size")
    parser.add_argument("--output", default="training/results", help="Output dir")
    args = parser.parse_args()

    # Load model
    print(f"Loading model: {args.model}")
    checkpoint = torch.load(args.model, map_location="cpu")

    num_classes = len(checkpoint.get("label_map", CLASS_NAMES))
    model = ECG_CNN_1D(num_classes=num_classes)
    model.load_state_dict(checkpoint["model_state"])

    label_map = checkpoint.get("label_map", {name: i for i, name in enumerate(CLASS_NAMES)})
    class_names = [k for k, v in sorted(label_map.items(), key=lambda x: x[1])]

    # Load test data
    data_dir = Path(args.data)
    test_df = pd.read_pickle(data_dir / "test.pkl")
    print(f"Test samples: {len(test_df)}")

    test_dataset = ECGDataset(test_df, label_map=label_map)
    test_loader = DataLoader(test_dataset, batch_size=args.batch_size, shuffle=False)

    # Evaluate
    evaluator = ModelEvaluator(model)
    metrics = evaluator.evaluate(test_loader, class_names=class_names, output_dir=args.output)

    print(f"\nResults saved to: {args.output}/metrics.json")


if __name__ == "__main__":
    main()
