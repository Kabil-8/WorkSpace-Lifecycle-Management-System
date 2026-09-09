import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_6d_digital_twin_analyze_standard():
    payload = {
        "student_id": "std-test-101",
        "name": "Kabil Kumar",
        "department": "Computer Science",
        "cgpa": 8.6,
        "attendance": 88.0,
        "coding_score": 80,
        "coding_problems_solved": 45,
        "quiz_avg": 82.0,
        "assignment_rate": 90.0,
        "study_hours_weekly": 16.0,
        "ats_score": 85,
        "xp": 3200
    }
    res = client.post("/api/ml/digital-twin/analyze", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["dimension_count"] == 6
    assert len(data["dimensions"]) == 6
    assert "Academic Twin" in data["dimensions"]
    assert "Career Twin" in data["dimensions"]
    assert "Skill Twin" in data["dimensions"]
    assert "Attendance Twin" in data["dimensions"]
    assert "Learning Twin" in data["dimensions"]
    assert "Behavior & Workload Twin" in data["dimensions"]

    sub_twins = data["sub_twins"]
    assert sub_twins is not None
    assert "academic" in sub_twins
    assert "career" in sub_twins
    assert "skill" in sub_twins
    assert "attendance" in sub_twins
    assert "learning" in sub_twins
    assert "behavior" in sub_twins

    # Check data quality result
    assert data["dataQuality"]["hasSufficientData"] is True
    assert data["dataQuality"]["level"] == "HIGH"

def test_5sub_legacy_alias_backward_compatibility():
    payload = {
        "name": "Sivaani S K",
        "cgpa": 8.8,
        "attendance": 92.0,
        "coding_score": 85,
        "quiz_avg": 88.0
    }
    res = client.post("/api/ml/digital-twin/5-sub", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["dimension_count"] == 6
    assert data["sub_twins"] is not None

def test_digital_twin_insufficient_data():
    payload = {
        "student_id": "std-empty-00",
        "name": "Zero Activity User",
        "cgpa": 0.0,
        "attendance": 0.0,
        "coding_score": 0,
        "quiz_avg": 0.0
    }
    res = client.post("/api/ml/digital-twin/analyze", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["dataQuality"]["hasSufficientData"] is False
    assert data["dataQuality"]["level"] == "INSUFFICIENT"
    assert data["sub_twins"] is None
    assert "Start learning activity" in data["message"]
