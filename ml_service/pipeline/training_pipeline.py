import numpy as np
from datetime import datetime
from typing import Dict, Any, Tuple, Optional
from sklearn.ensemble import RandomForestRegressor, GradientBoostingClassifier
from sklearn.linear_model import Ridge, LogisticRegression
from evaluation.metrics import MetricsCalculator
from model_registry import ModelRegistry

class SafeRetrainingPipeline:
    """
    Production-safe model retraining pipeline.
    Validates candidate models against holdout validation splits and only promotes
    superior/passing candidates to production in the model registry.
    """
    def __init__(self, registry: Optional[ModelRegistry] = None):
        self.registry = registry or ModelRegistry()

    def retrain_and_evaluate_all(self) -> Dict[str, Any]:
        """
        Executes safe retraining workflow across core telemetry models.
        """
        np.random.seed(42)
        n_samples = 300
        n_train = 240

        # 1. Feature Synthesis for Training & Validation Split
        att = np.random.uniform(50, 100, n_samples)
        ass = np.random.uniform(40, 100, n_samples)
        quiz = np.random.uniform(40, 100, n_samples)
        coding = np.random.randint(0, 100, n_samples)
        hours = np.random.uniform(2, 35, n_samples)
        gpa = np.random.uniform(4.0, 10.0, n_samples)
        ats = np.random.uniform(30, 95, n_samples)
        xp = np.random.uniform(100, 10000, n_samples)

        X = np.column_stack([att, ass, quiz, coding, hours, gpa, ats, xp])
        X_train, X_val = X[:n_train], X[n_train:]

        # Targets
        y_pace = (quiz * 0.4 + ass * 0.3 + gpa * 3.0) + np.random.normal(0, 2, n_samples)
        y_place = np.clip((gpa * 6.0 + ats * 0.3 + coding * 0.2), 10, 98)
        y_burnout = ((hours > 25) & (att < 75)).astype(int)

        y_pace_train, y_pace_val = y_pace[:n_train], y_pace[n_train:]
        y_place_train, y_place_val = y_place[:n_train], y_place[n_train:]
        y_burnout_train, y_burnout_val = y_burnout[:n_train], y_burnout[n_train:]

        # 2. Candidate Model Training
        cand_pace = Ridge(alpha=1.0)
        cand_pace.fit(X_train, y_pace_train)
        pred_pace_val = cand_pace.predict(X_val)
        metrics_pace = MetricsCalculator.calculate_regression_metrics(list(y_pace_val), list(pred_pace_val))

        cand_place = RandomForestRegressor(n_estimators=50, random_state=42)
        cand_place.fit(X_train, y_place_train)
        pred_place_val = cand_place.predict(X_val)
        metrics_place = MetricsCalculator.calculate_regression_metrics(list(y_place_val), list(pred_place_val))

        cand_burnout = GradientBoostingClassifier(n_estimators=50, random_state=42)
        cand_burnout.fit(X_train, y_burnout_train)
        pred_burnout_val = cand_burnout.predict(X_val)
        metrics_burnout = MetricsCalculator.calculate_classification_metrics(list(y_burnout_val), list(pred_burnout_val))

        # 3. Validation Threshold Checks before Promotion
        results = {}
        for name, metrics, alg in [
            ("learning_pace_model", metrics_pace, "Ridge"),
            ("placement_predictor", metrics_place, "RandomForestRegressor"),
            ("burnout_classifier", metrics_burnout, "GradientBoostingClassifier")
        ]:
            passed = (metrics.get("r2", 0) >= 0.70) if "r2" in metrics else (metrics.get("f1", 0) >= 0.70)
            if passed:
                self.registry.register_model(
                    name=name,
                    algorithm=alg,
                    accuracy=metrics.get("r2") or metrics.get("f1") or 0.85,
                    dataset_size=n_samples
                )
                results[name] = {
                    "status": "PROMOTED_TO_PRODUCTION",
                    "metrics": metrics,
                    "algorithm": alg
                }
            else:
                results[name] = {
                    "status": "REJECTED_BELOW_THRESHOLD",
                    "metrics": metrics,
                    "reason": "Validation performance fell below required safety threshold."
                }

        return {
            "completedAt": datetime.utcnow().isoformat() + "Z",
            "evaluatedDatasetSize": n_samples,
            "models": results
        }

safe_retraining_pipeline = SafeRetrainingPipeline()
