# CardioAI Backend

Production-grade FastAPI backend for AI-assisted cardiac screening.

## Quick Start

```bash
# Create virtual environment
python -m venv venv
venv\Scripts\activate     # Windows
# source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Run the server
python -m uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.
API docs at `http://localhost:8000/docs`.

## Architecture

```
app/
├── main.py              # FastAPI app entry point
├── config.py            # Settings (env vars)
├── api/v1/              # REST endpoints
├── services/            # Business logic
├── ml/                  # Signal processing & quality
├── database/            # ORM models & schemas
└── utils/               # Security, logging

training/
├── models/cnn_1d.py     # 1D CNN architecture
├── data/                # Dataset loading & augmentation
├── pipeline/            # Training & evaluation
└── scripts/             # CLI entry points
```

## API Endpoints

| Route | Method | Description |
|-------|--------|-------------|
| `/health` | GET | Health check |
| `/api/auth/login` | POST | Login |
| `/api/auth/register` | POST | Register |
| `/api/auth/logout` | POST | Logout |
| `/api/analysis/upload` | POST | Upload ECG/PPG file |
| `/api/analysis/history` | GET | Analysis history |
| `/api/analysis/{id}` | GET | Analysis detail |
| `/api/analysis/{id}` | DELETE | Delete analysis |
| `/api/doctor/patients` | GET | Doctor's patients |
| `/api/doctor/review/{id}` | POST | Submit review |
| `/api/admin/stats` | GET | System stats |
| `/api/admin/models` | GET | Model registry |
| `/api/chat` | POST | AI chat assistant |

## ML Model Training

```bash
# Install ML dependencies
pip install -r requirements-ml.txt

# Prepare dataset
python -c "from training.data.loader import ECGDataLoader; ECGDataLoader().prepare_dataset('your_data.csv')"

# Train model
python training/scripts/train_model.py --epochs 50

# Evaluate model
python training/scripts/evaluate_model.py --model models/v3/best_model.pth
```

## Testing

```bash
pip install pytest httpx
pytest tests/ -v
```

## Docker

```bash
docker-compose up --build
```

## Environment Variables

See `.env.example` for all available configuration options.
