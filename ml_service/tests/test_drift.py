import pytest
from monitoring.drift_detector import DriftDetector

def test_drift_insufficient_samples():
    detector = DriftDetector(min_sample_threshold=20)
    # Record only 5 samples
    for _ in range(5):
        detector.record_inference({"attendance_rate": 80.0, "cgpa": 7.5})
    res = detector.check_drift("placement_predictor")
    assert res["status"] == "INSUFFICIENT_DATA"
    assert res["driftDetected"] is False
    assert res["sampleCount"] == 5
    assert "Collect at least" in res["recommendation"]

def test_drift_sufficient_stable_samples():
    detector = DriftDetector(min_sample_threshold=20)
    for _ in range(25):
        detector.record_inference({
            "attendance_rate": 82.0,
            "cgpa": 7.8,
            "coding_solved": 35.0,
            "study_hours": 14.5,
            "ats_score": 72.0
        })
    res = detector.check_drift("placement_predictor")
    assert res["status"] == "ACTIVE"
    assert res["sampleCount"] == 25
    assert res["driftDetected"] is False
    assert res["recommendation"] == "MODEL_STABLE"

def test_drift_detected_on_distribution_shift():
    detector = DriftDetector(min_sample_threshold=20)
    # Simulate significant distribution shift (e.g. CGPA dropped to 4.0, study hours 35.0)
    for _ in range(25):
        detector.record_inference({
            "attendance_rate": 45.0,
            "cgpa": 4.2,
            "coding_solved": 5.0,
            "study_hours": 35.0,
            "ats_score": 30.0
        })
    res = detector.check_drift("placement_predictor")
    assert res["status"] == "ACTIVE"
    assert res["driftDetected"] is True
    assert res["recommendation"] == "RETRAIN_RECOMMENDED"
    assert len(res["driftedFeatures"]) > 0
