"""
CardioAI — Train Model Script
CLI entry point for training a new ECG classification model.

Usage:
    python training/scripts/train_model.py --data training/data/processed --epochs 50
"""

import argparse
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

import pandas as pd
from torch.utils.data import DataLoader

from training.models.cnn_1d import ECG_CNN_1D
from training.pipeline.train import ECGDataset, ECGTrainer


def main():
    parser = argparse.ArgumentParser(description="Train CardioAI ECG model")
    parser.add_argument("--data", default="training/data/processed", help="Path to processed data")
    parser.add_argument("--epochs", type=int, default=50, help="Number of epochs")
    parser.add_argument("--batch_size", type=int, default=32, help="Batch size")
    parser.add_argument("--lr", type=float, default=0.001, help="Learning rate")
    parser.add_argument("--patience", type=int, default=10, help="Early stopping patience")
    parser.add_argument("--output", default="models/v3", help="Output directory")
    args = parser.parse_args()

    data_dir = Path(args.data)

    # Load data
    print("Loading data...")
    train_df = pd.read_pickle(data_dir / "train.pkl")
    val_df = pd.read_pickle(data_dir / "val.pkl")

    print(f"Train samples: {len(train_df)}")
    print(f"Val samples:   {len(val_df)}")

    # Create datasets
    train_dataset = ECGDataset(train_df)
    val_dataset = ECGDataset(val_df, label_map=train_dataset.label_map)

    print(f"Label map: {train_dataset.label_map}")

    # Create dataloaders
    train_loader = DataLoader(
        train_dataset, batch_size=args.batch_size, shuffle=True, num_workers=0
    )
    val_loader = DataLoader(
        val_dataset, batch_size=args.batch_size, shuffle=False, num_workers=0
    )

    # Create model
    num_classes = len(train_dataset.label_map)
    model = ECG_CNN_1D(num_classes=num_classes)
    print(f"Model parameters: {sum(p.numel() for p in model.parameters()):,}")

    # Train
    trainer = ECGTrainer(model)
    history = trainer.fit(
        train_loader,
        val_loader,
        epochs=args.epochs,
        learning_rate=args.lr,
        patience=args.patience,
        checkpoint_dir=args.output,
    )

    print(f"\nBest model saved to: {args.output}/best_model.pth")
    print(f"Training history saved to: {args.output}/history.json")


if __name__ == "__main__":
    main()
