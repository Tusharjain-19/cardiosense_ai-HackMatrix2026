# CardioAI Backend — Product Requirements Document

**Product:** CardioAI Backend + ML Model  
**Version:** 1.0  
**Date:** August 2026  
**Status:** Hackathon Build  

---

## 📋 Document Overview

This PRD defines all backend requirements for CardioAI, including:
- ML model architecture and training pipeline
- FastAPI backend structure
- Database schema
- API endpoints
- Data processing pipeline
- Model serving & inference
- Production deployment

---

## 🎯 Product Vision

**CardioAI Backend** is a scalable, production-ready ML inference system that:
1. Trains and evaluates ECG classification models
2. Serves predictions through REST APIs
3. Provides explainability for model predictions
4. Maintains model versioning and performance tracking
5. Handles signal preprocessing and quality assessment
6. Returns comprehensive analysis data to frontend

**Key Principle:** Separate ML training pipeline from production API inference.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────┐
│     Frontend (React)        │
│     Next.js Application     │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│     FastAPI Backend         │
│  Production Inference API   │
└──────────────┬──────────────┘
               │
      ┌────────┼────────┐
      │        │        │
      ▼        ▼        ▼
   Signal    ML Model  Database
Processing  (Inference) (PostgreSQL)
      │        │        │
      └────────┼────────┘
               │
               ▼
      ┌──────────────────┐
      │  Model Registry  │
      │  (v1, v2, v3...) │
      └──────────────────┘

SEPARATE TRAINING PIPELINE:
   Dataset → Preprocessing → Training → Evaluation → Model Registry
```

---

## 📂 Project Structure

```
cardioai-backend/
│
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app initialization
│   ├── config.py               # Configuration & settings
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── analysis.py     # Analysis endpoints
│   │   │   ├── auth.py         # Auth endpoints
│   │   │   ├── user.py         # User endpoints
│   │   │   ├── doctor.py       # Doctor endpoints
│   │   │   └── admin.py        # Admin endpoints
│   │   └── dependencies.py     # Shared dependencies
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth_service.py     # Authentication logic
│   │   ├── analysis_service.py # Analysis orchestration
│   │   ├── user_service.py     # User management
│   │   └── ml_service.py       # ML inference
│   │
│   ├── ml/
│   │   ├── __init__.py
│   │   ├── preprocessing.py    # Signal processing
│   │   ├── quality.py          # Signal quality assessment
│   │   ├── inference.py        # Model inference
│   │   ├── explainability.py   # Feature importance
│   │   └── models/             # Trained models
│   │       ├── v1.pth
│   │       ├── v2.pth
│   │       └── v3.pth
│   │
│   ├── database/
│   │   ├── __init__.py
│   │   ├── models.py           # SQLAlchemy models
│   │   ├── schemas.py          # Pydantic schemas
│   │   └── crud.py             # Database queries
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py             # User model
│   │   ├── analysis.py         # Analysis model
│   │   └── model_registry.py   # Model version tracking
│   │
│   └── utils/
│       ├── __init__.py
│       ├── security.py         # JWT, hashing
│       ├── storage.py          # File storage
│       └── logger.py           # Logging
│
├── training/
│   ├── __init__.py
│   ├── config.py               # Training config
│   ├── data/
│   │   ├── __init__.py
│   │   ├── loader.py           # Dataset loading
│   │   ├── preprocessor.py     # Data preprocessing
│   │   └── augmentation.py     # Data augmentation
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── cnn_1d.py           # 1D CNN architecture
│   │   ├── cnn_lstm.py         # CNN-LSTM architecture
│   │   └── resnet_1d.py        # ResNet 1D architecture
│   │
│   ├── pipeline/
│   │   ├── __init__.py
│   │   ├── train.py            # Training loop
│   │   ├── evaluate.py         # Evaluation metrics
│   │   └── experiment.py       # Experiment tracking
│   │
│   └── scripts/
│       ├── train_model.py      # Train new model
│       └── evaluate_model.py   # Evaluate trained model
│
├── models/                     # Trained model weights
│   ├── v1/
│   │   └── model.pth
│   ├── v2/
│   │   └── model.pth
│   └── v3/
│       └── model.pth
│
├── data/                       # Dataset (if storing locally)
│   ├── raw/
│   ├── processed/
│   └── splits/
│
├── notebooks/
│   ├── 01_eda.ipynb
│   ├── 02_preprocessing.ipynb
│   └── 03_model_comparison.ipynb
│
├── tests/
│   ├── __init__.py
│   ├── test_api.py
│   ├── test_preprocessing.py
│   ├── test_model.py
│   └── test_inference.py
│
├── requirements.txt
├── requirements-ml.txt
├── .env.example
├── docker-compose.yml
├── Dockerfile
├── pytest.ini
└── README.md
```

---

## 🔬 ML Model Specifications

### 3.1 Dataset Requirements

**Input:**
- ECG signal (1D array)
- Sampling rate: 360 Hz (standard for ECG)
- Signal duration: 10-30 seconds
- Format: CSV/TXT/EDF

**Output:**
- Class: Normal, Bradycardia, Tachycardia, Irregular Rhythm, Abnormal
- Confidence: 0-1
- Additional: Anomaly score, focus region

**Dataset Characteristics:**
- Minimum: 5,000 labeled ECG segments
- Recommended: 10,000+ segments from diverse patients
- Patient-level split: Train/Val/Test split by patient, not by segment

### 3.2 Model Architecture

**Primary Model: 1D Convolutional Neural Network (1D CNN)**

```
Input: ECG signal (3600 samples for 10 sec @ 360Hz)
│
├─ Conv1D(64 filters, kernel=5) → BatchNorm → ReLU
├─ MaxPooling1D(2)
├─ Conv1D(128 filters, kernel=5) → BatchNorm → ReLU
├─ MaxPooling1D(2)
├─ Conv1D(256 filters, kernel=5) → BatchNorm → ReLU
├─ MaxPooling1D(2)
├─ GlobalAveragePooling1D()
├─ Dense(128) → ReLU → Dropout(0.5)
├─ Dense(5) → Softmax
│
Output: [P(Normal), P(Bradycardia), P(Tachycardia), P(Irregular), P(Abnormal)]
```

**Why 1D CNN?**
- ECG is time-series data
- Local patterns matter (QRS complexes, T waves)
- Efficient for sequential signals
- Proven in cardiac signal classification
- Reasonable training time

**Alternative Models (if time/accuracy permits):**
- CNN-LSTM: Better temporal dependencies
- 1D ResNet: Improved gradient flow
- Transformer: State-of-the-art but slower training

### 3.3 Training Pipeline

**Phase 1: Data Preparation**
```
Raw Dataset
    ↓
Remove corrupted/invalid records
    ↓
Verify labels
    ↓
Patient-level split (80/10/10)
    ↓
Create balanced subsets
    ↓
Saved splits
```

**Phase 2: Preprocessing (shared between training & inference)**
```
Raw ECG Signal
    ↓
Bandpass filter (0.5-100 Hz)
    ↓
Remove baseline drift
    ↓
Normalize (mean=0, std=1)
    ↓
Resample to 360 Hz (if needed)
    ↓
Segment into 10-sec windows
    ↓
Preprocessed signal
```

**Phase 3: Model Training**
```
Hyperparameters:
- Batch size: 32
- Learning rate: 0.001 (Adam optimizer)
- Epochs: 50-100 (with early stopping)
- Loss: Cross-entropy with class weights (for imbalance)
- Metrics: Accuracy, Precision, Recall, F1, AUC-ROC

Training Loop:
Epoch 1-50:
  Train batch → Backward → Update weights
  Validate every 5 epochs
  Early stop if val loss doesn't improve 10 epochs
  Save best checkpoint

Output: Best model (e.g., epoch_35.pth)
```

**Phase 4: Evaluation**
```
Test Set (completely unseen patients):
    ↓
Inference
    ↓
Predictions + Confidences
    ↓
Compute metrics:
  - Accuracy
  - Per-class Precision
  - Per-class Recall
  - Per-class F1
  - AUC-ROC
  - Confusion Matrix
    ↓
Generate report
```

### 3.4 Expected Performance

**Baseline (Random Forest on hand-crafted features):**
- Accuracy: 65-72%
- F1: 0.62-0.68

**Target (1D CNN):**
- Accuracy: 75-85%
- F1: 0.73-0.83
- Per-class Recall: >75% for each class

**Stretch (CNN-LSTM + augmentation):**
- Accuracy: 80-90%
- F1: 0.78-0.88

**Important:** Don't report accuracy alone. Report confusion matrix + per-class metrics.

### 3.5 Explainability

**Goal:** Show which ECG regions influenced the prediction.

**Method 1: Attention-based**
- Add attention layer to model
- Output: attention weights over time steps
- Interpretation: regions with high weights influenced prediction

**Method 2: Gradient-based (Saliency)**
- Compute gradient of output w.r.t. input
- Interpretation: regions with high gradients influence prediction

**Method 3: Layer-wise Relevance Propagation (LRP)**
- Decompose prediction into contributions from each input region
- More rigorous than saliency

**For hackathon:** Method 1 (attention) or Method 2 (saliency) sufficient.

**Output format:**
```json
{
  "important_regions": [
    {
      "start_time": 3.2,
      "end_time": 4.1,
      "importance_score": 0.92,
      "description": "Elevated in tachycardia segment"
    }
  ]
}
```

---

## 🔌 API Specifications

### 4.1 Authentication Endpoints

**POST /api/v1/auth/register**

Request:
```json
{
  "email": "user@example.com",
  "password": "secure_password",
  "name": "John Doe",
  "age": 45,
  "gender": "male",
  "height": 180,
  "weight": 75
}
```

Response:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "usr_001",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "patient",
      "created_at": "2026-08-08T10:30:00Z"
    }
  }
}
```

**POST /api/v1/auth/login**

Request:
```json
{
  "email": "user@example.com",
  "password": "secure_password"
}
```

Response: Same as register

**POST /api/v1/auth/logout**

Response:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### 4.2 Analysis Endpoints

**POST /api/v1/analysis/upload**

Upload ECG/PPG file for analysis.

Request:
```
Content-Type: multipart/form-data

file: <binary ECG file>
type: "ECG" | "PPG"
```

Response:
```json
{
  "success": true,
  "data": {
    "analysis_id": "ana_001",
    "status": "PROCESSING",
    "file_name": "ecg_recording.csv",
    "uploaded_at": "2026-08-08T10:30:00Z"
  }
}
```

**GET /api/v1/analysis/{analysis_id}**

Get complete analysis results.

Response:
```json
{
  "success": true,
  "data": {
    "analysis_id": "ana_001",
    "user_id": "usr_001",
    "file_type": "ECG",
    "file_name": "ecg_recording.csv",
    "uploaded_at": "2026-08-08T10:30:00Z",
    
    "signal": {
      "duration": 30,
      "sampling_rate": 360,
      "num_samples": 10800
    },
    
    "quality": {
      "score": 93,
      "status": "GOOD",
      "factors": {
        "noise_level": "low",
        "baseline_stability": "stable",
        "saturation": "none"
      }
    },
    
    "heart_rate": {
      "average": 72,
      "minimum": 68,
      "maximum": 79,
      "variability": "low"
    },
    
    "prediction": {
      "class": "Normal",
      "confidence": 0.968,
      "class_distribution": {
        "Normal": 0.968,
        "Bradycardia": 0.014,
        "Tachycardia": 0.014,
        "Irregular": 0.002,
        "Abnormal": 0.002
      }
    },
    
    "anomaly": {
      "score": 0.23,
      "status": "NORMAL"
    },
    
    "explanation": {
      "important_regions": [
        {
          "start_time": 2.4,
          "end_time": 3.7,
          "importance": 0.91
        }
      ],
      "model_version": "v3"
    },
    
    "processing_time": 2.3,
    "status": "COMPLETED"
  }
}
```

**POST /api/v1/analysis/{analysis_id}/report**

Generate PDF report.

Response:
```
Content-Type: application/pdf
<PDF file binary data>
```

**GET /api/v1/analysis/history**

Get all analyses for user.

Query params:
- `limit`: 10 (default)
- `offset`: 0
- `sort_by`: "date" | "result"

Response:
```json
{
  "success": true,
  "data": [
    { "analysis_id": "ana_001", ... },
    { "analysis_id": "ana_002", ... }
  ],
  "pagination": {
    "total": 42,
    "limit": 10,
    "offset": 0
  }
}
```

**DELETE /api/v1/analysis/{analysis_id}**

Delete analysis (soft delete).

Response:
```json
{
  "success": true,
  "message": "Analysis deleted"
}
```

---

### 4.3 User Endpoints

**GET /api/v1/users/me**

Get current user profile.

Response:
```json
{
  "success": true,
  "data": {
    "id": "usr_001",
    "email": "user@example.com",
    "name": "John Doe",
    "age": 45,
    "gender": "male",
    "height": 180,
    "weight": 75,
    "role": "patient",
    "created_at": "2026-08-08T10:30:00Z"
  }
}
```

**PUT /api/v1/users/me**

Update user profile.

Request:
```json
{
  "name": "John Doe",
  "age": 46,
  "height": 180,
  "weight": 76
}
```

Response: Updated user object

---

### 4.4 Doctor Endpoints

**GET /api/v1/doctor/patients**

Get assigned patients.

Response:
```json
{
  "success": true,
  "data": [
    {
      "patient_id": "usr_002",
      "name": "Jane Smith",
      "latest_analysis": {
        "analysis_id": "ana_005",
        "class": "Tachycardia",
        "confidence": 0.87,
        "uploaded_at": "2026-08-08T09:00:00Z"
      }
    }
  ]
}
```

**POST /api/v1/doctor/review/{analysis_id}**

Submit review of analysis.

Request:
```json
{
  "assessment": "CONFIRMED" | "NEEDS_REVIEW" | "NOT_RELIABLE",
  "notes": "Optional doctor notes",
  "reviewed_at": "2026-08-08T11:00:00Z"
}
```

Response:
```json
{
  "success": true,
  "message": "Review recorded"
}
```

---

### 4.5 Admin Endpoints

**GET /api/v1/admin/stats**

System statistics.

Response:
```json
{
  "success": true,
  "data": {
    "total_users": 1245,
    "total_analyses": 4832,
    "analyses_by_result": {
      "Normal": 3921,
      "Needs_Review": 642,
      "Poor_Quality": 269
    },
    "model_performance": {
      "version": "v3",
      "accuracy": 0.82,
      "precision": 0.80,
      "recall": 0.81,
      "f1": 0.81
    }
  }
}
```

**GET /api/v1/admin/models**

List all model versions.

Response:
```json
{
  "success": true,
  "data": [
    {
      "version": "v3",
      "accuracy": 0.82,
      "f1": 0.81,
      "status": "PRODUCTION",
      "created_at": "2026-08-01T00:00:00Z"
    },
    {
      "version": "v2",
      "accuracy": 0.78,
      "f1": 0.75,
      "status": "ARCHIVED",
      "created_at": "2026-07-20T00:00:00Z"
    }
  ]
}
```

**POST /api/v1/admin/models/{version}/promote**

Promote model to production.

Response:
```json
{
  "success": true,
  "message": "Model v3 promoted to production"
}
```

---

## 💾 Database Schema

### 5.1 Users Table

```sql
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  age INT,
  gender VARCHAR(50),
  height INT,
  weight INT,
  role VARCHAR(50) DEFAULT 'patient',  -- patient, doctor, admin
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);
```

### 5.2 Analyses Table

```sql
CREATE TABLE analyses (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  file_name VARCHAR(255),
  file_type VARCHAR(50),  -- ECG, PPG
  file_path VARCHAR(500),
  
  -- Signal metadata
  duration INT,
  sampling_rate INT,
  num_samples INT,
  
  -- Signal quality
  quality_score INT,
  quality_status VARCHAR(50),  -- GOOD, MODERATE, POOR
  
  -- Heart rate
  hr_average INT,
  hr_min INT,
  hr_max INT,
  
  -- AI prediction
  prediction_class VARCHAR(100),
  prediction_confidence FLOAT,
  
  -- Anomaly
  anomaly_score FLOAT,
  
  -- Explainability
  focus_start FLOAT,
  focus_end FLOAT,
  importance_score FLOAT,
  
  -- Model info
  model_version VARCHAR(50),
  processing_time FLOAT,
  
  -- Status
  status VARCHAR(50) DEFAULT 'PROCESSING',  -- PROCESSING, COMPLETED, FAILED
  error_message TEXT,
  
  -- Doctor review
  reviewed BOOLEAN DEFAULT false,
  reviewer_id VARCHAR(36),
  review_assessment VARCHAR(50),
  review_notes TEXT,
  reviewed_at TIMESTAMP,
  
  -- Timestamps
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (reviewer_id) REFERENCES users(id),
  INDEX (user_id),
  INDEX (uploaded_at),
  INDEX (status)
);
```

### 5.3 Model Registry Table

```sql
CREATE TABLE model_registry (
  id VARCHAR(36) PRIMARY KEY,
  version VARCHAR(50) UNIQUE,
  model_path VARCHAR(255),
  accuracy FLOAT,
  precision FLOAT,
  recall FLOAT,
  f1_score FLOAT,
  auc_roc FLOAT,
  
  -- Confusion matrix (JSON)
  confusion_matrix JSON,
  
  -- Per-class metrics (JSON)
  class_metrics JSON,
  
  dataset_version VARCHAR(50),
  training_date TIMESTAMP,
  hyperparameters JSON,
  
  status VARCHAR(50) DEFAULT 'ARCHIVED',  -- ARCHIVED, PRODUCTION
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5.4 Class Distribution Table

```sql
CREATE TABLE class_distribution (
  id VARCHAR(36) PRIMARY KEY,
  analysis_id VARCHAR(36) NOT NULL,
  class_name VARCHAR(100),
  probability FLOAT,
  
  FOREIGN KEY (analysis_id) REFERENCES analyses(id),
  INDEX (analysis_id)
);
```

---

## 🔄 Data Flow

### Complete Analysis Flow

```
1. USER UPLOADS ECG
   └─→ File validation
       └─→ Store in /storage/uploads/
           └─→ Create analysis record (PROCESSING)
               └─→ Return analysis_id

2. BACKEND PROCESSES
   └─→ Read file
       └─→ Preprocessing (filter, normalize)
           └─→ Signal quality assessment
               └─→ Extract heart rate
                   └─→ Create model input tensor

3. ML INFERENCE
   └─→ Load model v3 (from memory)
       └─→ Forward pass
           └─→ Get logits
               └─→ Softmax → probabilities
                   └─→ Argmax → prediction class
                       └─→ Extract confidence

4. EXPLAINABILITY
   └─→ Compute attention weights / saliency
       └─→ Find important regions
           └─→ Create explanation JSON

5. SAVE RESULTS
   └─→ Update analysis record (COMPLETED)
       └─→ Store prediction, confidence, etc.
           └─→ Anomaly detection
               └─→ Return to frontend

6. FRONTEND DISPLAYS
   └─→ Waveform + quality
       └─→ Heart rate metrics
           └─→ Prediction + confidence
               └─→ Class distribution
                   └─→ Important regions highlighted
                       └─→ Anomaly score
```

---

## 🔐 Security & Validation

### 6.1 File Upload Security

**Validation:**
- File size < 100 MB
- File type: CSV, TXT, EDF only
- Malware scan (optional, using ClamAV)
- No executable content

**Storage:**
- Store in `/storage/uploads/{user_id}/{analysis_id}/`
- Use secure random filenames
- Set proper file permissions

**Cleanup:**
- Delete files after 90 days
- Soft delete analysis records
- Archive old data to cold storage

### 6.2 Authentication

**JWT Tokens:**
- Algorithm: HS256
- Expiry: 24 hours
- Refresh token: 30 days
- Store in httpOnly cookies

**Password Security:**
- Hash: bcrypt + salt
- Min length: 8 characters
- No common patterns

### 6.3 Data Privacy

- Encrypt PII at rest (if storing)
- HTTPS only (TLS 1.2+)
- No logging of sensitive data
- GDPR-compliant deletion

---

## 🚀 Deployment

### 7.1 Docker Setup

**Dockerfile:**
```dockerfile
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Docker Compose:**
```yaml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db/cardioai
      - MODEL_PATH=/app/models/v3/model.pth
    depends_on:
      - db
    volumes:
      - ./models:/app/models
      - ./storage:/app/storage

  db:
    image: postgres:14
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=cardioai
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### 7.2 Performance Targets

- API response time: <3 seconds (including ML inference)
- Model loading: <2 seconds (at startup)
- Database query: <100ms
- File upload: handles 100MB files
- Concurrent users: 1,000+ (with horizontal scaling)

---

## 📊 Success Metrics

### 8.1 Model Metrics

- [ ] Accuracy: 75%+
- [ ] F1 Score: 0.73+
- [ ] Per-class Recall: >70% for each class
- [ ] AUC-ROC: 0.82+
- [ ] Confusion matrix: Clear, interpretable

### 8.2 API Metrics

- [ ] 99% uptime
- [ ] <3 second response time (p99)
- [ ] 0 critical errors
- [ ] <5% failed requests

### 8.3 Data Metrics

- [ ] >1,000 analyses processed
- [ ] >90% completion rate
- [ ] <1% file corruption
- [ ] <2% quality failures

---

## 🔄 Iteration Plan

### Phase 1: MVP (Week 1)
- [ ] Dataset preparation
- [ ] Basic 1D CNN model
- [ ] Simple FastAPI backend
- [ ] Login/upload/results endpoints
- [ ] Basic validation

### Phase 2: Polish (Week 2)
- [ ] Signal quality assessment
- [ ] Explainability module
- [ ] Heart rate extraction
- [ ] Anomaly detection
- [ ] PDF report generation
- [ ] History & filtering

### Phase 3: Healthcare (Week 3, if time)
- [ ] Doctor dashboard
- [ ] Doctor review interface
- [ ] Smart alerts
- [ ] Multi-patient management
- [ ] Admin panel

### Phase 4: Production
- [ ] Model optimization
- [ ] Performance tuning
- [ ] Horizontal scaling
- [ ] Monitoring & alerting
- [ ] HIPAA/compliance (post-hackathon)

---

## 🏆 Demo Sequence

**Judges should see:**

1. Upload ECG file (drag-drop UI)
2. Backend processing:
   - Signal quality: 93%
   - Preprocessing complete
   - ML inference running...
3. Results display:
   - **Tachycardia** (confidence: 91%)
   - Heart rate: 126 BPM
   - Signal quality: Good
   - Important regions highlighted
4. Metrics:
   - Confidence distribution
   - Historical comparison
5. Report:
   - Download PDF with all data
6. **Disclaimer:** "This is an AI screening prototype, not a medical diagnosis"

---

## 📞 Key Deliverables

- [ ] Trained ML model (v3)
- [ ] FastAPI backend (all endpoints)
- [ ] PostgreSQL database
- [ ] Signal preprocessing pipeline
- [ ] ML inference service
- [ ] Explainability module
- [ ] Docker deployment
- [ ] API documentation
- [ ] Test suite
- [ ] Training pipeline documentation

---

**END OF BACKEND PRD**

This document defines the complete backend specification. All endpoints, models, and architecture details are specified for immediate implementation.
