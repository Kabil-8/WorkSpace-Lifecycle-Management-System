from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from schemas.common import DataQualityResult, ModelMetadata, RequestMetadata

class FactorAttribution(BaseModel):
    feature: str = Field(..., description="Telemetry factor name")
    impact: Any = Field(..., description="Impact value or percentage")
    direction: str = Field(default="positive", description="positive | negative | warning")

class AcademicTwin(BaseModel):
    title: str = "Academic Sub-Twin"
    current_cgpa: float = Field(..., description="Current verified cumulative GPA")
    predicted_gpa: float = Field(..., description="Forecasted semester end GPA")
    academic_risk_category: str = Field(..., description="Safe | Moderate Risk | High Risk")
    confidence: Optional[float] = None
    heuristicConfidence: Optional[float] = None
    factors: List[FactorAttribution] = []
    explanation: str = ""
    limitations: str = "Heuristic & regression projection based on course quiz and assignment telemetry."

class CareerTwin(BaseModel):
    title: str = "Career Sub-Twin"
    placement_likelihood_pct: float = Field(..., description="Placement probability estimate (0-100%)")
    target_company_tier: str = Field(..., description="Company tier classification")
    estimated_salary: str = Field(..., description="Estimated LPA compensation band")
    confidence: Optional[float] = None
    heuristicConfidence: Optional[float] = None
    factors: List[FactorAttribution] = []
    explanation: str = ""
    limitations: str = "Projection based on current skills, resume ATS score, and mock interview benchmarks."

class SkillRadarScore(BaseModel):
    metric: str
    score: int

class SkillTwin(BaseModel):
    title: str = "Skill Sub-Twin"
    coding_proficiency_score: int = Field(..., description="Coding proficiency (0-100)")
    radar_scores: List[SkillRadarScore] = []
    mastered_concepts: List[str] = []
    vulnerable_concepts: List[str] = []
    explanation: str = ""

class AttendanceTwin(BaseModel):
    title: str = "Attendance Sub-Twin"
    attendance_pct: float = Field(..., description="Current logged attendance rate")
    forecasted_attendance_pct: float = Field(..., description="Projected end-of-term attendance")
    is_eligible_for_exams: bool = Field(..., description="Whether >= 75% threshold is satisfied")
    required_classes_for_target: int = Field(..., description="Classes required to reach target percentage")
    risk_level: str = Field(..., description="Safe | Low Risk | High Risk (Shortage Alert)")
    explanation: str = ""

class LearningTwin(BaseModel):
    title: str = "Learning Sub-Twin"
    learning_pace_score: int = Field(..., description="Learning pace index (0-100)")
    active_recall_retention_pct: float = Field(..., description="Calculated memory retention estimate")
    sm2_decay_status: str = Field(..., description="Optimal Recall | Review Due | Overdue")
    next_review_interval_days: int = Field(default=1, description="SM-2 spaced repetition interval")
    explanation: str = ""

class BehaviorWorkloadTwin(BaseModel):
    title: str = "Behavior & Workload Sub-Twin"
    workload_indicator: str = Field(..., description="Normal Workload | Study Consistency Risk | High Workload")
    backlog_risk: str = Field(..., description="Safe | Moderate Risk | High Risk")
    burnout_risk_score: float = Field(..., description="Burnout indicator score (0-100)")
    dropout_risk_pct: float = Field(..., description="Retention risk percentage")
    explanation: str = ""

class SixSubTwins(BaseModel):
    academic: AcademicTwin
    career: CareerTwin
    skill: SkillTwin
    attendance: AttendanceTwin
    learning: LearningTwin
    behavior: BehaviorWorkloadTwin

class DigitalTwinAnalyzeRequest(BaseModel):
    student_id: Optional[str] = "std-default"
    name: Optional[str] = "Student Candidate"
    department: Optional[str] = "Computer Science"
    cgpa: Optional[float] = 0.0
    attendance: Optional[float] = 0.0
    coding_score: Optional[int] = 0
    coding_problems_solved: Optional[int] = 0
    quiz_avg: Optional[float] = 0.0
    assignment_rate: Optional[float] = 0.0
    study_hours_weekly: Optional[float] = 0.0
    ats_score: Optional[int] = 0
    xp: Optional[int] = 0
    sample_count: Optional[int] = 0
    completed_topics: Optional[List[str]] = None
    weak_topics: Optional[List[str]] = None

class DigitalTwinAnalyzeResponse(BaseModel):
    success: bool = True
    student_name: str
    dimension_count: int = 6
    dimensions: List[str] = [
        "Academic Twin", "Career Twin", "Skill Twin",
        "Attendance Twin", "Learning Twin", "Behavior & Workload Twin"
    ]
    dataQuality: DataQualityResult
    model: ModelMetadata
    metadata: RequestMetadata
    sub_twins: Optional[SixSubTwins] = None
    message: Optional[str] = None
