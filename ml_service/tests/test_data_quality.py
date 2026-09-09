import pytest
from pipeline.feature_pipeline import FeaturePipeline
from schemas.common import DataQualityLevel

def test_data_quality_high():
    raw = {
        "attendance": 90.0,
        "cgpa": 8.5,
        "quiz_avg": 80.0,
        "assignment_rate": 88.0,
        "coding_score": 60,
        "study_hours": 15.0,
        "ats_score": 80,
        "interview_score": 75.0
    }
    features, quality = FeaturePipeline.process_telemetry(raw)
    assert quality.hasSufficientData is True
    assert quality.level == DataQualityLevel.HIGH
    assert quality.score >= 0.6
    assert len(quality.missingFeatures) <= 4

def test_data_quality_insufficient_zero_fabrication():
    raw = {}
    features, quality = FeaturePipeline.process_telemetry(raw)
    assert quality.hasSufficientData is False
    assert quality.level == DataQualityLevel.INSUFFICIENT
    assert quality.score == 0.0
    assert len(quality.missingFeatures) == 10
    # Verify no silent fabrication of student GPA or attendance
    assert features["cgpa"] == 0.0
    assert features["attendance_rate"] == 0.0

def test_data_quality_medium():
    raw = {
        "attendance": 85.0,
        "cgpa": 7.5,
        "quiz_avg": 70.0,
        "coding_score": 30
    }
    features, quality = FeaturePipeline.process_telemetry(raw)
    assert quality.hasSufficientData is True
    assert quality.level == DataQualityLevel.MEDIUM
    assert quality.score >= 0.3
