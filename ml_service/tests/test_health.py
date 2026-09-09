import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_root_endpoint():
    res = client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "online"
    assert "EduSphere" in data["service"]

def test_health_endpoint():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["service"] == "ml_service"

def test_liveness_probe():
    res = client.get("/health/live")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "alive"
    assert "timestamp" in data

def test_readiness_probe():
    res = client.get("/health/ready")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] in ["ready", "degraded"]
    assert "components" in data

def test_operational_metrics():
    res = client.get("/metrics")
    assert res.status_code == 200
    data = res.json()
    assert "modelsRegistered" in data
    assert data["modelsRegistered"] > 0
