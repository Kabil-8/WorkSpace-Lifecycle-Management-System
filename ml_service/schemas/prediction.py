from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class PlacementPredictionRequest(BaseModel):
    student_id: Optional[str] = "std-default"
    cgpa: Optional[float] = Field(default=8.2, ge=0.0, le=10.0)
    projects_count: Optional[int] = Field(default=3, ge=0)
    skills: Optional[List[str]] = Field(default_factory=lambda: ["React", "TypeScript", "Python", "Node.js"])
    ats_score: Optional[float] = Field(default=82.0, ge=0.0, le=100.0)
    interview_score: Optional[float] = Field(default=78.0, ge=0.0, le=100.0)
    attendance: Optional[float] = Field(default=88.0, ge=0.0, le=100.0)
    coding_score: Optional[float] = Field(default=75.0, ge=0.0, le=100.0)

class PlacementPredictionResult(BaseModel):
    placement_probability_pct: float
    company_tier: str
    estimated_salary_range: str
    missing_skills: List[str]

class ProctorLiveEvaluationRequest(BaseModel):
    student_id: Optional[str] = "std-exam-01"
    exam_id: Optional[str] = "exam-101"
    eye_focus_score: Optional[float] = Field(default=95.0, ge=0.0, le=100.0)
    head_yaw: Optional[float] = Field(default=0.0)
    head_pitch: Optional[float] = Field(default=0.0)
    face_count: Optional[int] = Field(default=1, ge=0)
    browser_violations: Optional[int] = Field(default=0, ge=0)
    audio_detected: Optional[bool] = Field(default=False)
    previous_warnings: Optional[int] = Field(default=0, ge=0)

class ProctorEvent(BaseModel):
    timestamp: str
    event: str
    severity: str  # LOW | MEDIUM | HIGH
    description: str

class ProctorEvaluationResult(BaseModel):
    integrity_score: int
    risk_category: str
    requires_proctor_review: bool
    event_timeline: List[ProctorEvent]
    deductions: Dict[str, float]
    scientific_disclaimer: str = "Integrity scores reflect automated anomaly indicators and telemetry signals; they flag events for proctor review rather than serving as proof of academic dishonesty."
