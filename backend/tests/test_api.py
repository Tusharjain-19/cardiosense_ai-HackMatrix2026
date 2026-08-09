"""
Tests for the FastAPI API endpoints.
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.database.engine import Base, engine


@pytest.fixture(autouse=True)
def setup_db():
    """Create fresh tables for each test."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


client = TestClient(app)


class TestHealthEndpoint:
    """Test health check."""

    def test_health(self):
        res = client.get("/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "ok"

    def test_root(self):
        res = client.get("/")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "ONLINE"


class TestAuthEndpoints:
    """Test authentication flow."""

    def test_register(self):
        res = client.post("/api/auth/register", json={
            "email": "test@cardioai.com",
            "password": "testpass123",
            "name": "Test User",
            "age": 30,
            "gender": "male",
        })
        assert res.status_code == 200
        data = res.json()
        assert "token" in data
        assert data["user"]["email"] == "test@cardioai.com"

    def test_login(self):
        # Register first
        client.post("/api/auth/register", json={
            "email": "login@cardioai.com",
            "password": "testpass123",
            "name": "Login User",
        })
        # Login
        res = client.post("/api/auth/login", json={
            "email": "login@cardioai.com",
            "password": "testpass123",
        })
        assert res.status_code == 200
        data = res.json()
        assert "token" in data

    def test_logout(self):
        res = client.post("/api/auth/logout")
        assert res.status_code == 200
        assert res.json()["success"] is True

    def test_auto_create_on_login(self):
        """Demo feature: auto-creates user on first login."""
        res = client.post("/api/auth/login", json={
            "email": "newuser@demo.com",
            "password": "anypassword",
        })
        assert res.status_code == 200
        assert "token" in res.json()


class TestAnalysisEndpoints:
    """Test analysis endpoints."""

    def test_history_unauthenticated(self):
        """History should work without auth (returns all)."""
        res = client.get("/api/analysis/history")
        assert res.status_code == 200
        assert res.json()["success"] is True

    def test_upload_no_file(self):
        """Upload with no file should still work (demo mode)."""
        res = client.post(
            "/api/analysis/upload",
            data={"type": "ECG"},
        )
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert "data" in data
        assert data["data"]["status"] == "COMPLETED"

    def test_upload_with_file(self):
        """Upload with a CSV file."""
        import io
        # Create a simple CSV with numeric values
        csv_content = "\n".join([str(i * 0.01) for i in range(500)])
        file = io.BytesIO(csv_content.encode())

        res = client.post(
            "/api/analysis/upload",
            data={"type": "ECG", "patientName": "Test Patient"},
            files={"file": ("test.csv", file, "text/csv")},
        )
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert data["data"]["fileType"] == "ECG"

    def test_get_analysis(self):
        """Get a specific analysis by ID."""
        # Upload first
        res = client.post("/api/analysis/upload", data={"type": "ECG"})
        analysis_id = res.json()["data"]["id"]

        # Get it
        res = client.get(f"/api/analysis/{analysis_id}")
        assert res.status_code == 200
        assert res.json()["data"]["id"] == analysis_id

    def test_delete_analysis(self):
        """Delete an analysis (soft delete)."""
        # Upload first
        res = client.post("/api/analysis/upload", data={"type": "ECG"})
        analysis_id = res.json()["data"]["id"]

        # Delete
        res = client.delete(f"/api/analysis/{analysis_id}")
        assert res.status_code == 200

        # Should be gone from listing
        res = client.get(f"/api/analysis/{analysis_id}")
        assert res.status_code == 404

    def test_analysis_not_found(self):
        res = client.get("/api/analysis/nonexistent-id")
        assert res.status_code == 404


class TestDoctorEndpoints:
    """Test doctor endpoints."""

    def test_get_patients(self):
        res = client.get("/api/doctor/patients")
        assert res.status_code == 200
        assert res.json()["success"] is True


class TestAdminEndpoints:
    """Test admin endpoints."""

    def test_stats(self):
        res = client.get("/api/admin/stats")
        assert res.status_code == 200
        data = res.json()["data"]
        assert "total_users" in data
        assert "total_analyses" in data

    def test_models(self):
        res = client.get("/api/admin/models")
        assert res.status_code == 200
        assert res.json()["success"] is True


class TestChatEndpoint:
    """Test chat endpoint."""

    def test_chat_fallback(self):
        """Chat should return fallback when no API key is set."""
        res = client.post("/api/chat", json={
            "userMessage": "What does my ECG show?",
            "analysisContext": {
                "aiPrediction": {"class": "Normal", "confidence": 0.95},
                "heartRate": {"average": 72},
                "signalQuality": {"score": 94, "status": "GOOD"},
            },
        })
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert len(data["reply"]) > 0
