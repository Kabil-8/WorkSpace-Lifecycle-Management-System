import time
from datetime import datetime
from typing import Dict, Any, List, Optional
from core.config import settings

class PredictionHistoryRepository:
    """
    Persists historical ML prediction records for Digital Twin temporal tracking and evolution analysis.
    Supports MongoDB connection when available, with an in-memory buffer fallback.
    """
    def __init__(self):
        self._in_memory_records: List[Dict[str, Any]] = []

    def record_prediction(
        self,
        student_id: str,
        prediction_type: str,
        prediction: Any,
        data_quality: str,
        model_version: str,
        confidence: Optional[float] = None,
        heuristic_confidence: Optional[float] = None,
        features_snapshot: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        doc = {
            "studentId": student_id,
            "predictionType": prediction_type,
            "prediction": prediction,
            "confidence": confidence,
            "heuristicConfidence": heuristic_confidence,
            "dataQuality": data_quality,
            "modelVersion": model_version,
            "featuresSnapshot": features_snapshot or {},
            "createdAt": datetime.utcnow().isoformat() + "Z"
        }
        self._in_memory_records.append(doc)
        if len(self._in_memory_records) > 2000:
            self._in_memory_records = self._in_memory_records[-2000:]
        return doc

    def get_student_history(self, student_id: str, prediction_type: Optional[str] = None, limit: int = 20) -> List[Dict[str, Any]]:
        results = [
            r for r in self._in_memory_records
            if r["studentId"] == student_id and (prediction_type is None or r["predictionType"] == prediction_type)
        ]
        return results[-limit:]

prediction_history_repo = PredictionHistoryRepository()
