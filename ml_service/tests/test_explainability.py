import pytest
from explainability.explainable_ai import ExplainableAIEngine

def test_explain_placement_prediction():
    feature_vec = {
        "attendance_rate": 88.0,
        "cgpa": 8.4,
        "coding_solved": 50,
        "ats_score": 85.0,
        "interview_score": 80.0
    }
    exp = ExplainableAIEngine.explain_prediction("placement", 86.5, feature_vec)
    assert exp["predictionType"] == "placement"
    assert exp["score"] == 86.5
    assert len(exp["topFactors"]) >= 3
    assert any(f["feature"] == "Cumulative GPA" for f in exp["topFactors"])
    assert "reasoning" in exp
    assert exp["explanationMethod"] == "feature_contribution_weighted_attribution"

def test_explain_academic_gpa_prediction():
    feature_vec = {
        "cgpa": 7.8,
        "quiz_average": 82.0,
        "assignment_rate": 85.0
    }
    exp = ExplainableAIEngine.explain_prediction("academic_gpa", 8.0, feature_vec)
    assert exp["predictionType"] == "academic_gpa"
    assert len(exp["topFactors"]) >= 2
    assert "reasoning" in exp

def test_explain_burnout_prediction():
    feature_vec = {
        "study_hours": 32.0,
        "attendance_rate": 65.0
    }
    exp = ExplainableAIEngine.explain_prediction("burnout", 72.0, feature_vec)
    assert exp["predictionType"] == "burnout"
    assert any(f["direction"] == "negative" for f in exp["topFactors"])
