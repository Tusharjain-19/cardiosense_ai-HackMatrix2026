"""
CardioAI — ECG Dataset Loader
Handles loading, validation, segmentation, and patient-level splitting.
"""

import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.model_selection import train_test_split


class ECGDataLoader:
    """Load and prepare ECG dataset for training."""

    def __init__(self, data_path: str = "data", sampling_rate: int = 360):
        self.data_path = Path(data_path)
        self.sampling_rate = sampling_rate
        self.ecg_length = sampling_rate * 10  # 10 seconds

    def load_dataset(self, csv_file: str) -> pd.DataFrame:
        """
        Load dataset from CSV.
        Expected columns: signal (comma-separated values), label, patient_id
        """
        df = pd.read_csv(csv_file)
        print(f"Loaded {len(df)} records")

        required = ["signal", "label", "patient_id"]
        missing = [c for c in required if c not in df.columns]
        if missing:
            raise ValueError(f"Missing columns: {missing}")

        return df

    def validate_signal(self, signal: np.ndarray) -> bool:
        """Validate a single signal segment."""
        if len(signal) < self.ecg_length:
            return False
        if np.isnan(signal).any():
            return False
        if np.abs(signal).max() > 10:
            return False
        return True

    def parse_signal(self, signal_data) -> np.ndarray:
        """Parse signal from string or array."""
        if isinstance(signal_data, str):
            return np.array([float(x) for x in signal_data.split(",")])
        return np.array(signal_data)

    def segment_signal(
        self, signal: np.ndarray, overlap: float = 0.5
    ) -> list[np.ndarray]:
        """Segment long signal into 10-sec windows with overlap."""
        step = int(self.ecg_length * (1 - overlap))
        segments = []

        for i in range(0, len(signal) - self.ecg_length + 1, step):
            segment = signal[i : i + self.ecg_length]
            if self.validate_signal(segment):
                segments.append(segment)

        return segments

    def patient_level_split(
        self,
        df: pd.DataFrame,
        train_ratio: float = 0.8,
        val_ratio: float = 0.1,
    ) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
        """
        Split by PATIENT ID to prevent data leakage.
        """
        patients = df["patient_id"].unique()

        train_patients, temp_patients = train_test_split(
            patients, test_size=(1 - train_ratio), random_state=42
        )
        val_patients, test_patients = train_test_split(
            temp_patients, test_size=0.5, random_state=42
        )

        train_df = df[df["patient_id"].isin(train_patients)]
        val_df = df[df["patient_id"].isin(val_patients)]
        test_df = df[df["patient_id"].isin(test_patients)]

        print(f"Train: {len(train_df)} from {len(train_patients)} patients")
        print(f"Val:   {len(val_df)} from {len(val_patients)} patients")
        print(f"Test:  {len(test_df)} from {len(test_patients)} patients")

        return train_df, val_df, test_df

    def prepare_dataset(
        self, csv_file: str, output_dir: str = "training/data/processed"
    ):
        """Complete data preparation pipeline."""
        df = self.load_dataset(csv_file)

        # Parse signals
        df["signal_array"] = df["signal"].apply(self.parse_signal)

        # Remove invalid
        df = df[df["signal_array"].apply(self.validate_signal)]
        print(f"Valid records: {len(df)}")

        # Segment
        segments_list = []
        for _, row in df.iterrows():
            segments = self.segment_signal(row["signal_array"])
            for seg in segments:
                segments_list.append({
                    "signal": seg,
                    "label": row["label"],
                    "patient_id": row["patient_id"],
                })

        segments_df = pd.DataFrame(segments_list)
        print(f"Total segments: {len(segments_df)}")

        # Split by patient
        train_df, val_df, test_df = self.patient_level_split(segments_df)

        # Save
        Path(output_dir).mkdir(parents=True, exist_ok=True)
        train_df.to_pickle(f"{output_dir}/train.pkl")
        val_df.to_pickle(f"{output_dir}/val.pkl")
        test_df.to_pickle(f"{output_dir}/test.pkl")

        print(f"Saved splits to {output_dir}")
        return train_df, val_df, test_df
