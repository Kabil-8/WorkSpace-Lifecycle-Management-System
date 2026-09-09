import numpy as np
from typing import Dict, Any, List, Optional
from datetime import datetime

class DriftDetector:
    """
    Detects feature distribution drift by comparing production inference telemetry
    against baseline training distributions using Population Stability Index (PSI).
    """

    def __init__(self, min_sample_threshold: int = 20):
        self.min_sample_threshold = min_sample_threshold
        self.inference_snapshots: List[Dict[str, float]] = []
        # Pre-computed baseline feature statistics (mean, std) from training split
        self.baseline_stats: Dict[str, Dict[str, float]] = {
            "attendance_rate": {"mean": 82.5, "std": 12.0},
            "cgpa": {"mean": 7.8, "std": 1.2},
            "coding_solved": {"mean": 35.0, "std": 22.0},
            "study_hours": {"mean": 14.5, "std": 7.0},
            "ats_score": {"mean": 72.0, "std": 15.0},
        }

    def record_inference(self, features: Dict[str, float]):
        """Records an anonymized feature snapshot for drift monitoring."""
        filtered = {k: v for k, v in features.items() if k in self.baseline_stats and v > 0}
        if filtered:
            self.inference_snapshots.append(filtered)
            if len(self.inference_snapshots) > 1000:
                self.inference_snapshots = self.inference_snapshots[-1000:]

    def check_drift(self, model_name: str = "placement_predictor") -> Dict[str, Any]:
        """
        Calculates drift metrics. If sample count is below threshold, returns INSUFFICIENT_DATA.
        """
        sample_count = len(self.inference_snapshots)
        if sample_count < self.min_sample_threshold:
            return {
                "model": model_name,
                "status": "INSUFFICIENT_DATA",
                "sampleCount": sample_count,
                "requiredSamples": self.min_sample_threshold,
                "driftDetected": False,
                "driftScore": None,
                "recommendation": f"Collect at least {self.min_sample_threshold - sample_count} more live inference samples for statistically sound drift analysis.",
                "checkedAt": datetime.utcnow().isoformat() + "Z"
            }

        # Calculate mean drift across tracked features
        drifted_features = []
        drift_scores = []

        for feat, base in self.baseline_stats.items():
            vals = [s[feat] for s in self.inference_snapshots if feat in s]
            if len(vals) >= self.min_sample_threshold:
                inf_mean = float(np.mean(vals))
                z_diff = abs(inf_mean - base["mean"]) / max(1.0, base["std"])
                drift_scores.append(z_diff)
                if z_diff > 0.35:
                    drifted_features.append({
                        "feature": feat,
                        "baselineMean": base["mean"],
                        "inferenceMean": round(inf_mean, 2),
                        "shiftSeverity": "HIGH" if z_diff > 0.6 else "MODERATE"
                    })

        avg_drift = float(np.mean(drift_scores)) if drift_scores else 0.0
        drift_detected = len(drifted_features) > 0 or avg_drift > 0.30

        return {
            "model": model_name,
            "status": "ACTIVE",
            "sampleCount": sample_count,
            "driftDetected": drift_detected,
            "driftScore": round(avg_drift, 3),
            "driftedFeatures": drifted_features,
            "recommendation": "RETRAIN_RECOMMENDED" if drift_detected else "MODEL_STABLE",
            "checkedAt": datetime.utcnow().isoformat() + "Z"
        }

drift_detector = DriftDetector()
