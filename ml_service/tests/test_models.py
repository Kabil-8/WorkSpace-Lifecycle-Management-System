import pytest
from evaluation.metrics import MetricsCalculator
from evaluation.model_evaluator import ModelEvaluator
from model_registry import model_registry

def test_regression_metrics_calculation():
    y_true = [8.0, 7.5, 9.0, 6.5, 8.5]
    y_pred = [8.1, 7.3, 8.8, 6.8, 8.4]
    metrics = MetricsCalculator.calculate_regression_metrics(y_true, y_pred)
    assert "mae" in metrics
    assert "rmse" in metrics
    assert "r2" in metrics
    assert metrics["r2"] > 0.80

def test_classification_metrics_calculation():
    y_true = [1, 0, 1, 1, 0, 0]
    y_pred = [1, 0, 1, 1, 0, 1]
    metrics = MetricsCalculator.calculate_classification_metrics(y_true, y_pred)
    assert "accuracy" in metrics
    assert "precision" in metrics
    assert "recall" in metrics
    assert "f1" in metrics
    assert metrics["accuracy"] >= 0.80
    assert "confusion_matrix" in metrics

def test_model_evaluator_uncalibrated_data_returns_not_evaluated():
    rep = ModelEvaluator.evaluate_model(
        model_name="test_model",
        version="v1.0",
        algorithm="Ridge",
        task_type="regression",
        y_true=None,
        y_pred=None
    )
    assert rep.status == "not_evaluated"
    assert rep.metrics is None

def test_model_registry_metadata():
    meta = model_registry.get_metadata()
    assert meta["placement_predictor"]["status"] in ["staging", "production"]
    assert meta["placement_predictor"]["featureSchemaVersion"] == "2.0"
    assert "metrics" in meta["placement_predictor"]
