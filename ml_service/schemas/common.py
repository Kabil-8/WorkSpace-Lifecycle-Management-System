from enum import Enum
from typing import Generic, TypeVar, Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

class DataQualityLevel(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    INSUFFICIENT = "INSUFFICIENT"

class DataQualityResult(BaseModel):
    level: DataQualityLevel = Field(..., description="Data completeness quality category")
    score: float = Field(..., ge=0.0, le=1.0, description="Completeness score (0.0 - 1.0)")
    hasSufficientData: bool = Field(..., description="Whether verified data meets threshold for inference")
    sampleCount: int = Field(default=0, description="Number of verified telemetry signals recorded")
    missingFeatures: List[str] = Field(default_factory=list, description="Missing telemetry signals required for high precision")

class ModelMetadata(BaseModel):
    name: str = Field(..., description="Model identifier")
    version: str = Field(..., description="Model version tag")
    algorithm: str = Field(default="Deterministic/ML", description="Underlying algorithm or technique")
    status: str = Field(default="production", description="Lifecycle status (production, staging, experimental)")
    isHeuristic: bool = Field(default=False, description="True if scoring uses a deterministic heuristic instead of statistical ML")

class RequestMetadata(BaseModel):
    requestId: str = Field(..., description="Unique request tracing ID")
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
    latencyMs: Optional[float] = Field(default=None, description="Inference execution duration in milliseconds")

T = TypeVar("T")

class StandardPredictionResponse(BaseModel, Generic[T]):
    success: bool = True
    prediction: Optional[T] = None
    confidence: Optional[float] = Field(default=None, ge=0.0, le=1.0, description="Statistically calibrated probability confidence (None if uncalibrated)")
    heuristicConfidence: Optional[float] = Field(default=None, ge=0.0, le=100.0, description="Domain heuristic confidence index (0-100%)")
    dataQuality: DataQualityResult
    model: ModelMetadata
    metadata: RequestMetadata
    factors: Optional[List[Dict[str, Any]]] = Field(default=None, description="Feature contribution-based factor attributions")
    limitations: Optional[str] = Field(default=None, description="Model boundary notes and assumptions")

class ErrorDetail(BaseModel):
    code: str
    message: str
    requestId: Optional[str] = None
    missingFeatures: Optional[List[str]] = None

class StandardErrorResponse(BaseModel):
    success: bool = False
    error: ErrorDetail
