from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

class RegressionMetrics(BaseModel):
    mae: float = Field(..., description="Mean Absolute Error")
    rmse: float = Field(..., description="Root Mean Squared Error")
    r2: float = Field(..., description="R-Squared Coefficient of Determination")
    mape: Optional[float] = Field(default=None, description="Mean Absolute Percentage Error")

class ClassificationMetrics(BaseModel):
    accuracy: float = Field(..., description="Accuracy score (0-1)")
    precision: float = Field(..., description="Precision score (0-1)")
    recall: float = Field(..., description="Recall score (0-1)")
    f1: float = Field(..., description="F1 score (0-1)")
    roc_auc: Optional[float] = Field(default=None, description="ROC AUC score (0-1)")
    confusion_matrix: Optional[List[List[int]]] = Field(default=None, description="Confusion matrix")

class ModelEvaluationReport(BaseModel):
    model_name: str
    version: str
    algorithm: str
    status: str = "evaluated"  # evaluated | not_evaluated | benchmark_only
    task_type: str = "regression"  # regression | classification | heuristic
    dataset_version: Optional[str] = None
    sample_size: int = 0
    metrics: Optional[Dict[str, Any]] = None
    evaluation_notes: Optional[str] = None

class GlobalEvaluationResponse(BaseModel):
    success: bool = True
    total_models: int
    evaluated_models: int
    timestamp: str
    models: List[ModelEvaluationReport]
