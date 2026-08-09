# CardioAI Backend — Step-by-Step Implementation Guide

**Purpose:** Complete, detailed instructions for building CardioAI backend with ML model and FastAPI  
**Tech Stack:** Python 3.10+, PyTorch, FastAPI, PostgreSQL, Pandas, NumPy, Scikit-learn  
**Target:** Production-ready hackathon submission  

---

## 📐 Implementation Overview

```
PHASE A: ML TRAINING (Parallel work)
  ↓
Dataset Preparation → Model Training → Evaluation → Model Registry

PHASE B: BACKEND API (Parallel work)
  ↓
API Setup → Database → Auth → Analysis Endpoints → Inference

PHASE C: INTEGRATION
  ↓
Load Model → Create Inference Service → Connect to API

PHASE D: TESTING & DEPLOYMENT
  ↓
Unit Tests → Integration Tests → Docker → Deploy
```

---

## ⚡ PHASE A: ML TRAINING PIPELINE

### STEP A1: Environment Setup (20 minutes)

```bash
# Create project directory
mkdir cardioai-backend
cd cardioai-backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Create directory structure
mkdir -p app/{api/v1,services,ml,database,models,utils}
mkdir -p training/{data,models,pipeline,scripts}
mkdir -p models/{v1,v2,v3}
mkdir -p storage/uploads
mkdir -p tests
mkdir -p notebooks
```

**Create requirements files:**

`requirements.txt`:
```
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
pydantic==2.5.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
aiofiles==23.2.1
```

`requirements-ml.txt`:
```
torch==2.1.1
torchvision==0.16.1
torchaudio==2.1.1
numpy==1.26.2
pandas==2.1.3
scikit-learn==1.3.2
scipy==1.11.4
librosa==0.10.0
pywt==1.1.1
matplotlib==3.8.2
seaborn==0.13.0
tqdm==4.66.1
joblib==1.3.2
```

```bash
# Install dependencies
pip install -r requirements.txt
pip install -r requirements-ml.txt
```

---

### STEP A2: Dataset Preparation (45 minutes)

Create `training/data/loader.py`:

```python
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.model_selection import train_test_split
import pickle

class ECGDataLoader:
    """Load and prepare ECG dataset"""
    
    def __init__(self, data_path: str, sampling_rate: int = 360):
        self.data_path = Path(data_path)
        self.sampling_rate = sampling_rate
        self.ecg_length = sampling_rate * 10  # 10 seconds
        
    def load_dataset(self, csv_file: str) -> pd.DataFrame:
        """
        Load dataset from CSV
        Expected format: signal (CSV with one signal per row), label, patient_id
        """
        df = pd.read_csv(csv_file)
        print(f"Loaded {len(df)} records")
        
        # Validate
        required_cols = ['signal', 'label', 'patient_id']
        assert all(col in df.columns for col in required_cols), \
            f"Missing columns. Required: {required_cols}"
        
        return df
    
    def validate_signal(self, signal: np.ndarray) -> bool:
        """Validate signal quality"""
        # Check length
        if len(signal) < self.ecg_length:
            return False
        
        # Check for NaN
        if np.isnan(signal).any():
            return False
        
        # Check for extreme values (clipping)
        if np.abs(signal).max() > 10:
            return False
        
        return True
    
    def segment_signal(self, signal: np.ndarray, 
                      overlap: float = 0.5) -> list:
        """
        Segment long signal into 10-second windows
        
        overlap: 0.5 = 50% overlap
        """
        step = int(self.ecg_length * (1 - overlap))
        segments = []
        
        for i in range(0, len(signal) - self.ecg_length, step):
            segment = signal[i:i + self.ecg_length]
            if self.validate_signal(segment):
                segments.append(segment)
        
        return segments
    
    def parse_signal(self, signal_data: str) -> np.ndarray:
        """
        Parse signal from string/array format
        Could be comma-separated or numpy array representation
        """
        if isinstance(signal_data, str):
            signal = np.array([float(x) for x in signal_data.split(',')])
        else:
            signal = np.array(signal_data)
        
        return signal
    
    def patient_level_split(self, df: pd.DataFrame, 
                           train_ratio: float = 0.8,
                           val_ratio: float = 0.1) -> tuple:
        """
        Split dataset by PATIENT, not by signal segment
        This prevents data leakage
        """
        patients = df['patient_id'].unique()
        
        # Split patients
        train_patients, temp_patients = train_test_split(
            patients, 
            test_size=(1 - train_ratio),
            random_state=42
        )
        
        val_patients, test_patients = train_test_split(
            temp_patients,
            test_size=0.5,
            random_state=42
        )
        
        train_df = df[df['patient_id'].isin(train_patients)]
        val_df = df[df['patient_id'].isin(val_patients)]
        test_df = df[df['patient_id'].isin(test_patients)]
        
        print(f"Train: {len(train_df)} from {len(train_patients)} patients")
        print(f"Val: {len(val_df)} from {len(val_patients)} patients")
        print(f"Test: {len(test_df)} from {len(test_patients)} patients")
        
        return train_df, val_df, test_df
    
    def prepare_dataset(self, csv_file: str, 
                       output_dir: str = 'training/data/processed'):
        """
        Complete data preparation pipeline
        """
        # Load
        df = self.load_dataset(csv_file)
        
        # Parse signals
        df['signal_array'] = df['signal'].apply(self.parse_signal)
        
        # Remove invalid
        df = df[df['signal_array'].apply(self.validate_signal)]
        
        # Segment
        segments_list = []
        for idx, row in df.iterrows():
            segments = self.segment_signal(row['signal_array'])
            for segment in segments:
                segments_list.append({
                    'signal': segment,
                    'label': row['label'],
                    'patient_id': row['patient_id'],
                    'source_record': idx
                })
        
        segments_df = pd.DataFrame(segments_list)
        
        # Split by patient
        train_df, val_df, test_df = self.patient_level_split(segments_df)
        
        # Save
        Path(output_dir).mkdir(parents=True, exist_ok=True)
        
        train_df.to_pickle(f"{output_dir}/train.pkl")
        val_df.to_pickle(f"{output_dir}/val.pkl")
        test_df.to_pickle(f"{output_dir}/test.pkl")
        
        print(f"Saved splits to {output_dir}")
        
        return train_df, val_df, test_df

# Usage
# loader = ECGDataLoader()
# train_df, val_df, test_df = loader.prepare_dataset('your_dataset.csv')
```

---

### STEP A3: Signal Preprocessing (45 minutes)

Create `app/ml/preprocessing.py` (shared between training & inference):

```python
import numpy as np
from scipy import signal
from scipy.signal import butter, filtfilt
from sklearn.preprocessing import StandardScaler

class ECGPreprocessor:
    """
    Signal preprocessing for ECG
    MUST be used identically in training and inference
    """
    
    def __init__(self, sampling_rate: int = 360):
        self.sampling_rate = sampling_rate
        self.target_length = sampling_rate * 10  # 10 seconds
        
    def bandpass_filter(self, signal_data: np.ndarray, 
                       low_freq: float = 0.5, 
                       high_freq: float = 100.0) -> np.ndarray:
        """
        Bandpass filter: remove DC component and high-frequency noise
        """
        nyquist = self.sampling_rate / 2
        low = low_freq / nyquist
        high = high_freq / nyquist
        
        # Butterworth filter (4th order)
        b, a = butter(4, [low, high], btype='band')
        filtered = filtfilt(b, a, signal_data)
        
        return filtered
    
    def remove_baseline_drift(self, signal_data: np.ndarray) -> np.ndarray:
        """
        Remove low-frequency baseline wander using high-pass filter
        """
        # High-pass at 0.5 Hz
        nyquist = self.sampling_rate / 2
        low = 0.5 / nyquist
        b, a = butter(4, low, btype='high')
        filtered = filtfilt(b, a, signal_data)
        
        return filtered
    
    def normalize(self, signal_data: np.ndarray) -> np.ndarray:
        """
        Normalize signal: zero mean, unit variance
        """
        mean = np.mean(signal_data)
        std = np.std(signal_data)
        
        if std == 0:
            std = 1
        
        normalized = (signal_data - mean) / std
        return normalized
    
    def resample_signal(self, signal_data: np.ndarray,
                       original_rate: int = 360,
                       target_rate: int = 360) -> np.ndarray:
        """
        Resample to target sampling rate
        """
        if original_rate == target_rate:
            return signal_data
        
        num_samples = int(len(signal_data) * target_rate / original_rate)
        resampled = signal.resample(signal_data, num_samples)
        
        return resampled
    
    def pad_or_truncate(self, signal_data: np.ndarray) -> np.ndarray:
        """
        Ensure signal is exactly target length (3600 samples for 10 sec @ 360Hz)
        """
        if len(signal_data) > self.target_length:
            # Take first segment
            return signal_data[:self.target_length]
        elif len(signal_data) < self.target_length:
            # Pad with zeros
            padding = self.target_length - len(signal_data)
            return np.pad(signal_data, (0, padding), mode='constant')
        else:
            return signal_data
    
    def preprocess(self, signal_data: np.ndarray,
                   original_sampling_rate: int = 360) -> np.ndarray:
        """
        Complete preprocessing pipeline
        Order matters! Don't change without retraining model
        
        1. Resample (if needed)
        2. Bandpass filter
        3. Remove baseline drift
        4. Normalize
        5. Pad/truncate to exact length
        """
        # Step 1: Resample
        signal_data = self.resample_signal(signal_data, original_sampling_rate, self.sampling_rate)
        
        # Step 2: Bandpass filter (0.5-100 Hz)
        signal_data = self.bandpass_filter(signal_data, low_freq=0.5, high_freq=100.0)
        
        # Step 3: Remove baseline drift
        signal_data = self.remove_baseline_drift(signal_data)
        
        # Step 4: Normalize
        signal_data = self.normalize(signal_data)
        
        # Step 5: Pad/truncate
        signal_data = self.pad_or_truncate(signal_data)
        
        return signal_data.astype(np.float32)

# Usage
# preprocessor = ECGPreprocessor(sampling_rate=360)
# processed = preprocessor.preprocess(raw_signal)
```

---

### STEP A4: Signal Quality Assessment (30 minutes)

Create `app/ml/quality.py`:

```python
import numpy as np
from scipy import signal as sp_signal

class SignalQualityAssessor:
    """Assess ECG signal quality"""
    
    def __init__(self, sampling_rate: int = 360):
        self.sampling_rate = sampling_rate
    
    def assess_noise_level(self, signal_data: np.ndarray) -> str:
        """
        Estimate noise level using signal-to-noise ratio
        """
        # Use high-frequency content as noise estimate
        nyquist = self.sampling_rate / 2
        high_freq_start = 50 / nyquist
        
        # Estimate SNR
        power_total = np.mean(signal_data ** 2)
        
        # High-pass filter for noise estimation
        b, a = sp_signal.butter(2, high_freq_start, btype='high')
        high_freq_content = sp_signal.filtfilt(b, a, signal_data)
        power_noise = np.mean(high_freq_content ** 2)
        
        snr = power_total / (power_noise + 1e-10)
        
        if snr > 20:
            return 'low'
        elif snr > 10:
            return 'moderate'
        else:
            return 'high'
    
    def assess_baseline_stability(self, signal_data: np.ndarray) -> str:
        """
        Check baseline stability by looking at low-frequency drift
        """
        # Low-pass filter for baseline
        nyquist = self.sampling_rate / 2
        low_freq_cutoff = 1 / nyquist
        
        b, a = sp_signal.butter(2, low_freq_cutoff, btype='low')
        baseline = sp_signal.filtfilt(b, a, signal_data)
        
        # Check drift rate
        drift = np.abs(baseline[-1] - baseline[0])
        signal_range = np.max(np.abs(signal_data))
        
        drift_ratio = drift / (signal_range + 1e-10)
        
        if drift_ratio < 0.1:
            return 'stable'
        elif drift_ratio < 0.3:
            return 'drift'
        else:
            return 'unstable'
    
    def assess_saturation(self, signal_data: np.ndarray) -> str:
        """
        Check for clipping/saturation at signal boundaries
        """
        max_val = np.abs(signal_data).max()
        
        # Count values at extreme levels
        threshold = max_val * 0.95
        saturated_count = np.sum(np.abs(signal_data) > threshold)
        saturation_ratio = saturated_count / len(signal_data)
        
        if saturation_ratio < 0.01:
            return 'none'
        elif saturation_ratio < 0.05:
            return 'partial'
        else:
            return 'full'
    
    def calculate_quality_score(self, signal_data: np.ndarray) -> tuple:
        """
        Calculate overall quality score (0-100)
        
        Returns: (score, status, factors_dict)
        """
        noise = self.assess_noise_level(signal_data)
        baseline = self.assess_baseline_stability(signal_data)
        saturation = self.assess_saturation(signal_data)
        
        # Scoring
        score = 100
        
        # Noise penalty
        noise_scores = {'low': 0, 'moderate': -15, 'high': -40}
        score += noise_scores[noise]
        
        # Baseline penalty
        baseline_scores = {'stable': 0, 'drift': -10, 'unstable': -30}
        score += baseline_scores[baseline]
        
        # Saturation penalty
        saturation_scores = {'none': 0, 'partial': -20, 'full': -50}
        score += saturation_scores[saturation]
        
        score = max(0, min(100, score))  # Clamp 0-100
        
        # Determine status
        if score >= 80:
            status = 'GOOD'
        elif score >= 50:
            status = 'MODERATE'
        else:
            status = 'POOR'
        
        factors = {
            'noise_level': noise,
            'baseline_stability': baseline,
            'saturation': saturation
        }
        
        return score, status, factors

# Usage
# assessor = SignalQualityAssessor()
# score, status, factors = assessor.calculate_quality_score(signal)
```

---

### STEP A5: 1D CNN Model Architecture (45 minutes)

Create `training/models/cnn_1d.py`:

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class ECG_CNN_1D(nn.Module):
    """
    1D Convolutional Neural Network for ECG Classification
    
    Architecture:
    - Input: (batch, 1, 3600) - 10 seconds @ 360Hz
    - Conv layers with batch norm and dropout
    - Global average pooling
    - Dense layers
    - Output: (batch, 5) - 5 classes
    """
    
    def __init__(self, num_classes: int = 5, dropout_rate: float = 0.5):
        super().__init__()
        
        # Input: (batch, 1, 3600)
        
        # Block 1
        self.conv1 = nn.Conv1d(1, 64, kernel_size=5, stride=1, padding=2)
        self.bn1 = nn.BatchNorm1d(64)
        self.pool1 = nn.MaxPool1d(2)
        # Output: (batch, 64, 1800)
        
        # Block 2
        self.conv2 = nn.Conv1d(64, 128, kernel_size=5, stride=1, padding=2)
        self.bn2 = nn.BatchNorm1d(128)
        self.pool2 = nn.MaxPool1d(2)
        # Output: (batch, 128, 900)
        
        # Block 3
        self.conv3 = nn.Conv1d(128, 256, kernel_size=5, stride=1, padding=2)
        self.bn3 = nn.BatchNorm1d(256)
        self.pool3 = nn.MaxPool1d(2)
        # Output: (batch, 256, 450)
        
        # Global average pooling
        # Output: (batch, 256)
        
        # Dense layers
        self.fc1 = nn.Linear(256, 128)
        self.dropout = nn.Dropout(dropout_rate)
        self.fc2 = nn.Linear(128, num_classes)
        
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Args:
            x: (batch, 1, 3600)
        
        Returns:
            logits: (batch, 5)
        """
        # Conv Block 1
        x = self.conv1(x)
        x = self.bn1(x)
        x = F.relu(x)
        x = self.pool1(x)
        
        # Conv Block 2
        x = self.conv2(x)
        x = self.bn2(x)
        x = F.relu(x)
        x = self.pool2(x)
        
        # Conv Block 3
        x = self.conv3(x)
        x = self.bn3(x)
        x = F.relu(x)
        x = self.pool3(x)
        
        # Global Average Pooling
        x = F.adaptive_avg_pool1d(x, 1)  # (batch, 256, 1)
        x = x.squeeze(-1)  # (batch, 256)
        
        # Dense layers
        x = self.fc1(x)
        x = F.relu(x)
        x = self.dropout(x)
        x = self.fc2(x)
        
        return x

# Test model
if __name__ == "__main__":
    model = ECG_CNN_1D(num_classes=5)
    x = torch.randn(2, 1, 3600)  # Batch of 2
    output = model(x)
    print(f"Output shape: {output.shape}")  # Should be (2, 5)
```

---

### STEP A6: Training Pipeline (1.5 hours)

Create `training/pipeline/train.py`:

```python
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, Dataset
import numpy as np
from pathlib import Path
from tqdm import tqdm
import json
from datetime import datetime

class ECGDataset(Dataset):
    """PyTorch dataset for ECG signals"""
    
    def __init__(self, df, label_map=None):
        self.signals = [torch.from_numpy(s).unsqueeze(0).float() 
                       for s in df['signal'].values]
        self.labels = df['label'].values
        
        if label_map is None:
            unique_labels = sorted(np.unique(self.labels))
            self.label_map = {label: idx for idx, label in enumerate(unique_labels)}
        else:
            self.label_map = label_map
        
        self.label_indices = np.array([self.label_map[label] 
                                      for label in self.labels])
    
    def __len__(self):
        return len(self.signals)
    
    def __getitem__(self, idx):
        signal = self.signals[idx]  # (1, 3600)
        label = self.label_indices[idx]
        return signal, label

class ECGTrainer:
    """Training orchestrator"""
    
    def __init__(self, model, device='cuda' if torch.cuda.is_available() else 'cpu'):
        self.model = model.to(device)
        self.device = device
        self.history = {
            'train_loss': [],
            'val_loss': [],
            'train_acc': [],
            'val_acc': []
        }
        self.best_val_loss = float('inf')
        self.patience_counter = 0
    
    def train_epoch(self, train_loader, optimizer, criterion):
        """Train one epoch"""
        self.model.train()
        total_loss = 0
        correct = 0
        total = 0
        
        pbar = tqdm(train_loader, desc="Training")
        for signals, labels in pbar:
            signals = signals.to(self.device)
            labels = labels.to(self.device)
            
            # Forward
            optimizer.zero_grad()
            logits = self.model(signals)
            loss = criterion(logits, labels)
            
            # Backward
            loss.backward()
            optimizer.step()
            
            # Metrics
            total_loss += loss.item()
            _, predicted = torch.max(logits, 1)
            correct += (predicted == labels).sum().item()
            total += labels.size(0)
            
            pbar.set_postfix({'loss': loss.item()})
        
        avg_loss = total_loss / len(train_loader)
        accuracy = correct / total
        
        return avg_loss, accuracy
    
    def validate(self, val_loader, criterion):
        """Validate"""
        self.model.eval()
        total_loss = 0
        correct = 0
        total = 0
        
        with torch.no_grad():
            for signals, labels in val_loader:
                signals = signals.to(self.device)
                labels = labels.to(self.device)
                
                logits = self.model(signals)
                loss = criterion(logits, labels)
                
                total_loss += loss.item()
                _, predicted = torch.max(logits, 1)
                correct += (predicted == labels).sum().item()
                total += labels.size(0)
        
        avg_loss = total_loss / len(val_loader)
        accuracy = correct / total
        
        return avg_loss, accuracy
    
    def fit(self, train_loader, val_loader, epochs=50, learning_rate=0.001,
            checkpoint_dir='models/checkpoints'):
        """Train model"""
        
        Path(checkpoint_dir).mkdir(parents=True, exist_ok=True)
        
        # Class weights for imbalanced data
        all_labels = train_loader.dataset.label_indices
        unique, counts = np.unique(all_labels, return_counts=True)
        class_weights = torch.tensor(
            [len(all_labels) / (len(unique) * count) for count in counts],
            dtype=torch.float32,
            device=self.device
        )
        
        optimizer = torch.optim.Adam(self.model.parameters(), lr=learning_rate)
        criterion = nn.CrossEntropyLoss(weight=class_weights)
        scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
            optimizer, mode='min', factor=0.5, patience=5, verbose=True
        )
        
        for epoch in range(epochs):
            print(f"\nEpoch {epoch+1}/{epochs}")
            
            # Train
            train_loss, train_acc = self.train_epoch(train_loader, optimizer, criterion)
            print(f"Train Loss: {train_loss:.4f}, Acc: {train_acc:.4f}")
            
            # Validate
            val_loss, val_acc = self.validate(val_loader, criterion)
            print(f"Val Loss: {val_loss:.4f}, Acc: {val_acc:.4f}")
            
            # History
            self.history['train_loss'].append(train_loss)
            self.history['val_loss'].append(val_loss)
            self.history['train_acc'].append(train_acc)
            self.history['val_acc'].append(val_acc)
            
            # Scheduler
            scheduler.step(val_loss)
            
            # Checkpoint
            if val_loss < self.best_val_loss:
                self.best_val_loss = val_loss
                self.patience_counter = 0
                
                checkpoint_path = f"{checkpoint_dir}/best_model.pth"
                torch.save({
                    'epoch': epoch,
                    'model_state': self.model.state_dict(),
                    'optimizer_state': optimizer.state_dict(),
                    'val_loss': val_loss,
                    'val_acc': val_acc
                }, checkpoint_path)
                print(f"✓ Saved checkpoint: {checkpoint_path}")
            else:
                self.patience_counter += 1
                if self.patience_counter >= 10:
                    print("Early stopping triggered")
                    break
        
        print("\nTraining complete!")

# Usage script
if __name__ == "__main__":
    import pandas as pd
    from training.models.cnn_1d import ECG_CNN_1D
    
    # Load data
    train_df = pd.read_pickle('training/data/processed/train.pkl')
    val_df = pd.read_pickle('training/data/processed/val.pkl')
    
    # Create datasets
    train_dataset = ECGDataset(train_df)
    val_dataset = ECGDataset(val_df, label_map=train_dataset.label_map)
    
    # Create dataloaders
    train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=32, shuffle=False)
    
    # Train
    model = ECG_CNN_1D(num_classes=5)
    trainer = ECGTrainer(model)
    trainer.fit(train_loader, val_loader, epochs=50)
```

---

### STEP A7: Model Evaluation (45 minutes)

Create `training/pipeline/evaluate.py`:

```python
import torch
import numpy as np
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, roc_auc_score, roc_curve
)
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
import json

class ModelEvaluator:
    """Evaluate trained model"""
    
    def __init__(self, model, device='cuda' if torch.cuda.is_available() else 'cpu'):
        self.model = model.to(device)
        self.device = device
        self.model.eval()
    
    def predict(self, test_loader, label_map):
        """Get predictions and probabilities"""
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
    
    def compute_metrics(self, y_true, y_pred, y_proba, class_names=None):
        """Compute comprehensive metrics"""
        
        metrics = {
            'accuracy': accuracy_score(y_true, y_pred),
            'precision_macro': precision_score(y_true, y_pred, average='macro', zero_division=0),
            'recall_macro': recall_score(y_true, y_pred, average='macro', zero_division=0),
            'f1_macro': f1_score(y_true, y_pred, average='macro', zero_division=0),
        }
        
        # Per-class metrics
        if class_names:
            metrics['per_class'] = {}
            for i, class_name in enumerate(class_names):
                metrics['per_class'][class_name] = {
                    'precision': precision_score(y_true, y_pred, labels=[i], zero_division=0)[0],
                    'recall': recall_score(y_true, y_pred, labels=[i], zero_division=0)[0],
                    'f1': f1_score(y_true, y_pred, labels=[i], zero_division=0)[0],
                }
        
        # Confusion matrix
        cm = confusion_matrix(y_true, y_pred)
        metrics['confusion_matrix'] = cm.tolist()
        
        return metrics
    
    def plot_confusion_matrix(self, y_true, y_pred, class_names, output_path='confusion_matrix.png'):
        """Plot confusion matrix"""
        cm = confusion_matrix(y_true, y_pred)
        
        plt.figure(figsize=(10, 8))
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
                   xticklabels=class_names, yticklabels=class_names)
        plt.title('Confusion Matrix')
        plt.ylabel('True Label')
        plt.xlabel('Predicted Label')
        plt.tight_layout()
        plt.savefig(output_path)
        plt.close()
        
        print(f"Saved confusion matrix: {output_path}")
    
    def evaluate(self, test_loader, label_map, class_names, output_dir='training/results'):
        """Complete evaluation"""
        
        Path(output_dir).mkdir(parents=True, exist_ok=True)
        
        # Predictions
        y_pred, y_proba, y_true = self.predict(test_loader, label_map)
        
        # Metrics
        metrics = self.compute_metrics(y_true, y_pred, y_proba, class_names)
        
        # Save metrics
        metrics_path = f"{output_dir}/metrics.json"
        with open(metrics_path, 'w') as f:
            json.dump(metrics, f, indent=2)
        
        # Plot
        self.plot_confusion_matrix(y_true, y_pred, class_names, 
                                  f"{output_dir}/confusion_matrix.png")
        
        # Print
        print("\n=== EVALUATION RESULTS ===")
        print(f"Accuracy: {metrics['accuracy']:.4f}")
        print(f"F1 (macro): {metrics['f1_macro']:.4f}")
        print(f"Precision (macro): {metrics['precision_macro']:.4f}")
        print(f"Recall (macro): {metrics['recall_macro']:.4f}")
        
        if 'per_class' in metrics:
            print("\nPer-class metrics:")
            for class_name, scores in metrics['per_class'].items():
                print(f"  {class_name}: Precision={scores['precision']:.4f}, "
                      f"Recall={scores['recall']:.4f}, F1={scores['f1']:.4f}")
        
        return metrics
```

---

## ⚡ PHASE B: FASTAPI BACKEND

### STEP B1: FastAPI Setup (30 minutes)

Create `app/config.py`:

```python
from pydantic_settings import BaseSettings
from pathlib import Path

class Settings(BaseSettings):
    # App
    APP_NAME: str = "CardioAI"
    APP_VERSION: str = "1.0"
    DEBUG: bool = False
    
    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost/cardioai"
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_HOURS: int = 24
    
    # Model
    MODEL_PATH: str = "models/v3/model.pth"
    MODEL_VERSION: str = "v3"
    
    # Storage
    UPLOAD_DIR: str = "storage/uploads"
    MAX_FILE_SIZE: int = 100 * 1024 * 1024  # 100MB
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
```

Create `app/main.py`:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager
import torch
import logging

from app.config import settings
from app.api.v1 import analysis, auth, user, doctor, admin
from app.services.ml_service import MLService

# Logging
logging.basicConfig(level=settings.LOG_LEVEL)
logger = logging.getLogger(__name__)

# Global ML service
ml_service: MLService = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global ml_service
    logger.info("Loading ML model...")
    ml_service = MLService(model_path=settings.MODEL_PATH)
    app.state.ml_service = ml_service
    logger.info("ML model loaded successfully")
    
    yield
    
    # Shutdown
    logger.info("Shutting down...")
    if torch.cuda.is_available():
        torch.cuda.empty_cache()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan
)

# Middleware
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["*"])
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(analysis.router, prefix="/api/v1/analysis", tags=["Analysis"])
app.include_router(user.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(doctor.router, prefix="/api/v1/doctor", tags=["Doctor"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["Admin"])

@app.get("/health")
async def health():
    """Health check"""
    return {"status": "ok", "version": settings.APP_VERSION}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
```

---

### STEP B2: Database Models (45 minutes)

Create `app/database/models.py`:

```python
from sqlalchemy import Column, String, Integer, Float, DateTime, Boolean, JSON, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import uuid

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    age = Column(Integer)
    gender = Column(String(50))
    height = Column(Integer)
    weight = Column(Integer)
    role = Column(String(50), default='patient')
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)

class Analysis(Base):
    __tablename__ = "analyses"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey('users.id'), nullable=False, index=True)
    file_name = Column(String(255))
    file_type = Column(String(50))
    file_path = Column(String(500))
    
    # Signal metadata
    duration = Column(Integer)
    sampling_rate = Column(Integer)
    num_samples = Column(Integer)
    
    # Quality
    quality_score = Column(Integer)
    quality_status = Column(String(50))
    
    # Heart rate
    hr_average = Column(Integer)
    hr_min = Column(Integer)
    hr_max = Column(Integer)
    
    # Prediction
    prediction_class = Column(String(100))
    prediction_confidence = Column(Float)
    class_distribution = Column(JSON)  # Store all probabilities
    
    # Anomaly
    anomaly_score = Column(Float)
    
    # Explanation
    focus_start = Column(Float)
    focus_end = Column(Float)
    importance_score = Column(Float)
    
    # Model
    model_version = Column(String(50))
    processing_time = Column(Float)
    
    # Status
    status = Column(String(50), default='PROCESSING', index=True)
    error_message = Column(Text)
    
    # Doctor review
    reviewed = Column(Boolean, default=False)
    reviewer_id = Column(String(36), ForeignKey('users.id'))
    review_assessment = Column(String(50))
    review_notes = Column(Text)
    reviewed_at = Column(DateTime)
    
    # Timestamps
    uploaded_at = Column(DateTime, default=datetime.utcnow, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ModelRegistry(Base):
    __tablename__ = "model_registry"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    version = Column(String(50), unique=True)
    model_path = Column(String(255))
    accuracy = Column(Float)
    precision = Column(Float)
    recall = Column(Float)
    f1_score = Column(Float)
    auc_roc = Column(Float)
    confusion_matrix = Column(JSON)
    class_metrics = Column(JSON)
    dataset_version = Column(String(50))
    training_date = Column(DateTime)
    hyperparameters = Column(JSON)
    status = Column(String(50), default='ARCHIVED')
    created_at = Column(DateTime, default=datetime.utcnow)
```

---

### STEP B3: Authentication Service (1 hour)

Create `app/services/auth_service.py`:

```python
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthCredentials

from app.config import settings
from app.database.models import User

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT
security = HTTPBearer()

class AuthService:
    """Authentication service"""
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash password"""
        return pwd_context.hash(password)
    
    @staticmethod
    def verify_password(plain_password: str, hashed: str) -> bool:
        """Verify password"""
        return pwd_context.verify(plain_password, hashed)
    
    @staticmethod
    def create_access_token(user_id: str, expires_delta: timedelta = None) -> str:
        """Create JWT token"""
        if expires_delta is None:
            expires_delta = timedelta(hours=settings.ACCESS_TOKEN_EXPIRE_HOURS)
        
        expire = datetime.utcnow() + expires_delta
        
        to_encode = {
            "sub": user_id,
            "exp": expire
        }
        
        encoded_jwt = jwt.encode(
            to_encode,
            settings.SECRET_KEY,
            algorithm=settings.ALGORITHM
        )
        
        return encoded_jwt
    
    @staticmethod
    def verify_token(token: str) -> str:
        """Verify and decode JWT token"""
        try:
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=[settings.ALGORITHM]
            )
            user_id: str = payload.get("sub")
            if user_id is None:
                raise HTTPException(status_code=401, detail="Invalid token")
            return user_id
        except JWTError:
            raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(
    credentials: HTTPAuthCredentials = Depends(security),
    db: Session = Depends(get_db)  # We'll define get_db later
) -> User:
    """Get current authenticated user"""
    token = credentials.credentials
    user_id = AuthService.verify_token(token)
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user
```

---

### STEP B4: Analysis Endpoints (2 hours)

Create `app/api/v1/analysis.py`:

```python
from fastapi import APIRouter, File, UploadFile, Depends, HTTPException, Query
from sqlalchemy.orm import Session
import uuid
from datetime import datetime
import numpy as np
from pathlib import Path

from app.database.models import Analysis, User
from app.services.auth_service import get_current_user
from app.services.analysis_service import AnalysisService

router = APIRouter()

@router.post("/upload")
async def upload_analysis(
    file: UploadFile = File(...),
    signal_type: str = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload ECG/PPG file for analysis"""
    
    # Validate
    if not file.filename.endswith(('.csv', '.txt', '.edf')):
        raise HTTPException(status_code=400, detail="Invalid file format")
    
    if file.size > 100 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large")
    
    # Create analysis record
    analysis_id = str(uuid.uuid4())
    upload_dir = Path("storage/uploads") / current_user.id / analysis_id
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    # Save file
    file_path = upload_dir / file.filename
    content = await file.read()
    with open(file_path, 'wb') as f:
        f.write(content)
    
    # Create DB record
    analysis = Analysis(
        id=analysis_id,
        user_id=current_user.id,
        file_name=file.filename,
        file_type=signal_type,
        file_path=str(file_path),
        status='PROCESSING'
    )
    db.add(analysis)
    db.commit()
    
    # Queue for processing (async)
    # TODO: Send to background task queue (Celery, RQ, etc.)
    
    return {
        "success": True,
        "data": {
            "analysis_id": analysis_id,
            "status": "PROCESSING",
            "file_name": file.filename,
            "uploaded_at": datetime.utcnow().isoformat()
        }
    }

@router.get("/{analysis_id}")
async def get_analysis(
    analysis_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get analysis results"""
    
    analysis = db.query(Analysis).filter(
        Analysis.id == analysis_id,
        Analysis.user_id == current_user.id
    ).first()
    
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    return {
        "success": True,
        "data": {
            "analysis_id": analysis.id,
            "user_id": analysis.user_id,
            "file_type": analysis.file_type,
            "file_name": analysis.file_name,
            "uploaded_at": analysis.uploaded_at.isoformat(),
            
            "signal": {
                "duration": analysis.duration,
                "sampling_rate": analysis.sampling_rate,
                "num_samples": analysis.num_samples
            },
            
            "quality": {
                "score": analysis.quality_score,
                "status": analysis.quality_status,
                "factors": {}
            },
            
            "heart_rate": {
                "average": analysis.hr_average,
                "minimum": analysis.hr_min,
                "maximum": analysis.hr_max,
                "variability": "low"  # TODO: Calculate
            },
            
            "prediction": {
                "class": analysis.prediction_class,
                "confidence": analysis.prediction_confidence,
                "class_distribution": analysis.class_distribution
            },
            
            "anomaly": {
                "score": analysis.anomaly_score,
                "status": "NORMAL" if analysis.anomaly_score < 0.5 else "UNUSUAL"
            },
            
            "explanation": {
                "important_regions": [{
                    "start_time": analysis.focus_start,
                    "end_time": analysis.focus_end,
                    "importance": analysis.importance_score
                }] if analysis.focus_start else [],
                "model_version": analysis.model_version
            },
            
            "processing_time": analysis.processing_time,
            "status": analysis.status
        }
    }

@router.get("/history")
async def get_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = Query(10),
    offset: int = Query(0)
):
    """Get analysis history"""
    
    total = db.query(Analysis).filter(
        Analysis.user_id == current_user.id
    ).count()
    
    analyses = db.query(Analysis).filter(
        Analysis.user_id == current_user.id
    ).order_by(Analysis.uploaded_at.desc()).limit(limit).offset(offset).all()
    
    return {
        "success": True,
        "data": [...],  # Format each analysis
        "pagination": {
            "total": total,
            "limit": limit,
            "offset": offset
        }
    }
```

---

### STEP B5: ML Service (1.5 hours)

Create `app/services/ml_service.py`:

```python
import torch
import numpy as np
from pathlib import Path
import logging

from training.models.cnn_1d import ECG_CNN_1D
from app.ml.preprocessing import ECGPreprocessor
from app.ml.quality import SignalQualityAssessor
from app.ml.explainability import ExplainabilityModule

logger = logging.getLogger(__name__)

class MLService:
    """ML inference service"""
    
    def __init__(self, model_path: str, device: str = None):
        self.device = device or ('cuda' if torch.cuda.is_available() else 'cpu')
        
        # Load model
        logger.info(f"Loading model from {model_path}")
        self.model = ECG_CNN_1D(num_classes=5)
        
        checkpoint = torch.load(model_path, map_location=self.device)
        self.model.load_state_dict(checkpoint['model_state'])
        self.model.to(self.device)
        self.model.eval()
        
        self.class_names = ['Normal', 'Bradycardia', 'Tachycardia', 'Irregular', 'Abnormal']
        self.label_map = {i: name for i, name in enumerate(self.class_names)}
        
        # Initialize components
        self.preprocessor = ECGPreprocessor(sampling_rate=360)
        self.quality_assessor = SignalQualityAssessor(sampling_rate=360)
        self.explainability = ExplainabilityModule(self.model, self.device)
        
        logger.info("ML service initialized")
    
    def analyze(self, raw_signal: np.ndarray, sampling_rate: int = 360) -> dict:
        """
        Complete analysis pipeline
        """
        
        # 1. Signal quality
        quality_score, quality_status, quality_factors = self.quality_assessor.calculate_quality_score(raw_signal)
        
        if quality_status == 'POOR':
            return {
                'quality': {
                    'score': quality_score,
                    'status': quality_status,
                    'factors': quality_factors
                },
                'error': 'Signal quality too poor for analysis'
            }
        
        # 2. Preprocessing
        processed_signal = self.preprocessor.preprocess(raw_signal, sampling_rate)
        
        # 3. Heart rate extraction
        heart_rate = self._extract_heart_rate(processed_signal)
        
        # 4. Prepare tensor
        signal_tensor = torch.from_numpy(processed_signal).unsqueeze(0).unsqueeze(0).to(self.device)
        # (1, 1, 3600)
        
        # 5. Inference
        with torch.no_grad():
            logits = self.model(signal_tensor)
            probs = torch.softmax(logits, dim=1)
        
        probs_np = probs[0].cpu().numpy()
        pred_idx = np.argmax(probs_np)
        confidence = float(probs_np[pred_idx])
        
        # 6. Explainability
        important_regions = self.explainability.explain(signal_tensor)
        
        # 7. Anomaly detection
        anomaly_score = self._calculate_anomaly_score(probs_np)
        
        return {
            'quality': {
                'score': quality_score,
                'status': quality_status,
                'factors': quality_factors
            },
            'heart_rate': heart_rate,
            'prediction': {
                'class': self.class_names[pred_idx],
                'confidence': confidence,
                'class_distribution': {
                    self.class_names[i]: float(probs_np[i])
                    for i in range(len(self.class_names))
                }
            },
            'anomaly_score': anomaly_score,
            'important_regions': important_regions
        }
    
    def _extract_heart_rate(self, processed_signal: np.ndarray) -> dict:
        """Extract heart rate from ECG"""
        # Simplified: detect peaks
        from scipy.signal import find_peaks
        
        peaks, _ = find_peaks(processed_signal, distance=36)  # ~0.1 sec minimum
        
        if len(peaks) < 2:
            return {'average': 0, 'minimum': 0, 'maximum': 0}
        
        intervals = np.diff(peaks) / 360  # Convert to seconds
        hr_values = 60 / intervals  # Convert to BPM
        
        return {
            'average': int(np.mean(hr_values)),
            'minimum': int(np.min(hr_values)),
            'maximum': int(np.max(hr_values))
        }
    
    def _calculate_anomaly_score(self, class_probs: np.ndarray) -> float:
        """
        Calculate anomaly score based on prediction uncertainty
        """
        # Entropy-based anomaly
        entropy = -np.sum(class_probs * np.log(class_probs + 1e-10))
        max_entropy = np.log(len(class_probs))
        normalized_entropy = entropy / max_entropy
        
        return float(normalized_entropy)
```

---

### STEP B6: Create Explainability Module (45 minutes)

Create `app/ml/explainability.py`:

```python
import torch
import numpy as np

class ExplainabilityModule:
    """Generate explanations for model predictions"""
    
    def __init__(self, model, device):
        self.model = model
        self.device = device
    
    def explain(self, signal_tensor: torch.Tensor, sampling_rate: int = 360) -> list:
        """
        Generate saliency-based explanation
        """
        signal_tensor.requires_grad = True
        
        # Forward pass
        logits = self.model(signal_tensor)
        pred_class = torch.argmax(logits, dim=1)
        
        # Compute gradient
        loss = logits[0, pred_class]
        loss.backward()
        
        # Get gradients
        gradients = signal_tensor.grad[0, 0].cpu().numpy()
        
        # Smooth gradients
        from scipy.ndimage import gaussian_filter1d
        smooth_gradients = gaussian_filter1d(np.abs(gradients), sigma=10)
        
        # Find important regions
        threshold = np.percentile(smooth_gradients, 75)
        important_mask = smooth_gradients > threshold
        
        regions = []
        in_region = False
        start = 0
        
        for i, is_important in enumerate(important_mask):
            if is_important and not in_region:
                start = i
                in_region = True
            elif not is_important and in_region:
                regions.append({
                    'start_time': start / sampling_rate,
                    'end_time': i / sampling_rate,
                    'importance': float(np.mean(smooth_gradients[start:i]))
                })
                in_region = False
        
        # Sort by importance
        regions.sort(key=lambda x: x['importance'], reverse=True)
        
        return regions[:3]  # Top 3 regions
```

---

## ⚡ PHASE C: INTEGRATION & DEPLOYMENT

### STEP C1: Docker Setup (20 minutes)

Create `Dockerfile`:

```dockerfile
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt requirements-ml.txt ./

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir -r requirements-ml.txt

# Copy application
COPY . .

# Create storage directory
RUN mkdir -p storage/uploads models

# Expose port
EXPOSE 8000

# Run app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://cardioai:password@db:5432/cardioai
      - MODEL_PATH=/app/models/v3/model.pth
      - SECRET_KEY=your-secret-key
    depends_on:
      - db
    volumes:
      - ./models:/app/models
      - ./storage:/app/storage
    networks:
      - cardioai

  db:
    image: postgres:14
    environment:
      - POSTGRES_USER=cardioai
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=cardioai
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - cardioai

  frontend:
    build: ../cardioai-frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000/api
    depends_on:
      - backend
    networks:
      - cardioai

volumes:
  postgres_data:

networks:
  cardioai:
    driver: bridge
```

---

### STEP C2: Testing (1 hour)

Create `tests/test_preprocessing.py`:

```python
import pytest
import numpy as np
from app.ml.preprocessing import ECGPreprocessor
from app.ml.quality import SignalQualityAssessor

class TestPreprocessing:
    
    def test_preprocessing_output_shape(self):
        """Test preprocessing output shape"""
        preprocessor = ECGPreprocessor(sampling_rate=360)
        
        # Create dummy signal
        raw_signal = np.random.randn(3600)
        
        processed = preprocessor.preprocess(raw_signal)
        
        assert processed.shape == (3600,)
        assert processed.dtype == np.float32
    
    def test_quality_assessment(self):
        """Test quality assessment"""
        assessor = SignalQualityAssessor(sampling_rate=360)
        
        # Create good signal
        t = np.linspace(0, 10, 3600)
        signal = np.sin(2 * np.pi * 1 * t)  # 1 Hz sine
        
        score, status, factors = assessor.calculate_quality_score(signal)
        
        assert 0 <= score <= 100
        assert status in ['GOOD', 'MODERATE', 'POOR']
        assert 'noise_level' in factors
```

Create `tests/test_model.py`:

```python
import pytest
import torch
import numpy as np
from training.models.cnn_1d import ECG_CNN_1D

class TestModel:
    
    def test_model_output_shape(self):
        """Test model output shape"""
        model = ECG_CNN_1D(num_classes=5)
        model.eval()
        
        # Create dummy input
        x = torch.randn(2, 1, 3600)  # Batch of 2
        
        with torch.no_grad():
            output = model(x)
        
        assert output.shape == (2, 5)
    
    def test_model_forward_pass(self):
        """Test model forward pass"""
        model = ECG_CNN_1D(num_classes=5)
        model.eval()
        
        x = torch.randn(1, 1, 3600)
        
        with torch.no_grad():
            output = model(x)
            probs = torch.softmax(output, dim=1)
        
        # Check probabilities sum to 1
        assert torch.allclose(probs.sum(), torch.tensor(1.0), atol=1e-6)
```

Run tests:

```bash
pytest tests/ -v
```

---

### STEP C3: Deployment to Production (20 minutes)

**Deploy to Render or Railway:**

```bash
# Login to Render
render login

# Deploy
render deploy \
  --name cardioai-backend \
  --environment python3.10 \
  --start-command "uvicorn app.main:app --host 0.0.0.0 --port $PORT"
```

**Deploy to AWS EC2:**

```bash
# SSH into instance
ssh -i key.pem ubuntu@your-instance.com

# Clone repo
git clone <your-repo>
cd cardioai-backend

# Setup
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt -r requirements-ml.txt

# Run with Gunicorn
gunicorn --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000 app.main:app
```

---

## 📋 Complete Implementation Checklist

### Phase A: ML Training
- [ ] Dataset prepared (train/val/test split)
- [ ] Preprocessing pipeline created
- [ ] Quality assessment module
- [ ] 1D CNN model defined
- [ ] Training pipeline complete
- [ ] Model evaluated (metrics computed)
- [ ] Best model saved
- [ ] Model v3 registered

### Phase B: FastAPI Backend
- [ ] Config setup
- [ ] FastAPI app initialized
- [ ] Database models defined
- [ ] Auth service implemented
- [ ] Upload endpoint working
- [ ] Analysis endpoint returning results
- [ ] User endpoints working
- [ ] Doctor endpoints working
- [ ] Admin endpoints working

### Phase C: Integration
- [ ] ML service loads model
- [ ] Inference working end-to-end
- [ ] Explainability module integrated
- [ ] Database saving results
- [ ] PDF generation working

### Phase D: Testing & Deployment
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Docker build successful
- [ ] Docker Compose working
- [ ] Deployed to production
- [ ] Endpoints tested against frontend

---

## 🚀 Quick Commands

```bash
# Development
python -m uvicorn app.main:app --reload

# Training
python training/scripts/train_model.py

# Evaluation
python training/scripts/evaluate_model.py

# Docker
docker-compose up

# Tests
pytest tests/ -v

# Deployment
docker push your-registry/cardioai-backend:latest
```

---

**END OF IMPLEMENTATION GUIDE**

Follow these steps in order, and you'll have a complete, production-ready backend with ML model serving and API infrastructure.
