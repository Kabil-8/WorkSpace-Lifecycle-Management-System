import numpy as np
from typing import Dict, Any, List, Optional
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix
)

class MetricsCalculator:
    """
    Computes rigorous statistical evaluation metrics for regression and classification models.
    """
    @staticmethod
    def calculate_regression_metrics(y_true: List[float], y_pred: List[float]) -> Dict[str, float]:
        y_t = np.array(y_true, dtype=float)
        y_p = np.array(y_pred, dtype=float)

        mae = float(mean_absolute_error(y_t, y_p))
        rmse = float(np.sqrt(mean_squared_error(y_t, y_p)))
        r2 = float(r2_score(y_t, y_p)) if len(y_t) > 1 else 0.0

        # Mean Absolute Percentage Error (avoid division by zero)
        non_zero_mask = y_t != 0
        if np.any(non_zero_mask):
            mape = float(np.mean(np.abs((y_t[non_zero_mask] - y_p[non_zero_mask]) / y_t[non_zero_mask])) * 100.0)
        else:
            mape = 0.0

        return {
            "mae": round(mae, 4),
            "rmse": round(rmse, 4),
            "r2": round(r2, 4),
            "mape": round(mape, 2)
        }

    @staticmethod
    def calculate_classification_metrics(
        y_true: List[int],
        y_pred: List[int],
        y_prob: Optional[List[float]] = None
    ) -> Dict[str, Any]:
        y_t = np.array(y_true, dtype=int)
        y_p = np.array(y_pred, dtype=int)

        acc = float(accuracy_score(y_t, y_p))
        prec = float(precision_score(y_t, y_p, zero_division=0, average="weighted"))
        rec = float(recall_score(y_t, y_p, zero_division=0, average="weighted"))
        f1 = float(f1_score(y_t, y_p, zero_division=0, average="weighted"))
        cm = confusion_matrix(y_t, y_p).tolist()

        res: Dict[str, Any] = {
            "accuracy": round(acc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1": round(f1, 4),
            "confusion_matrix": cm
        }

        if y_prob is not None and len(np.unique(y_t)) > 1:
            try:
                auc = float(roc_auc_score(y_t, y_prob))
                res["roc_auc"] = round(auc, 4)
            except Exception:
                res["roc_auc"] = None

        return res
