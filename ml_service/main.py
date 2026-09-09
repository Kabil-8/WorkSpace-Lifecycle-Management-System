import time
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

# Core Imports
from core.config import settings
from core.logging import StructuredLoggingMiddleware, logger
from core.security import verify_service_auth
from core.exceptions import (
    MLServiceException, InsufficientDataError, InvalidInputError,
    ModelUnavailableError, UnauthorizedError, format_error_response
)

# Schemas
from schemas.common import DataQualityResult, ModelMetadata, RequestMetadata
from schemas.digital_twin import DigitalTwinAnalyzeRequest, DigitalTwinAnalyzeResponse
from schemas.prediction import PlacementPredictionRequest, ProctorLiveEvaluationRequest
from schemas.evaluation import GlobalEvaluationResponse

# Services & Engines
from services.digital_twin_service import DigitalTwinService
from ats_engine import ATSEngine
from interview_engine import InterviewEngine
from file_parser import parse_resume_bytes
from ml_models import model_suite
from cognitive_twin import CognitiveTwinEngine
from eden_engine import EdenEvolutionEngine, AttendanceIntelligence, SmartStudyPlanner
from attendance_engine import AttendancePredictor
from proctor_engine import ProctorRiskEngine, CheatingPredictor
from learning_recommender import learning_recommender
from placement_engine import placement_engine
from rag_engine import rag_prompt_engine
from embeddings.embedding_engine import vector_search_engine
from evaluation.model_evaluator import ModelEvaluator
from monitoring.drift_detector import drift_detector
from model_registry import model_registry
from repositories.prediction_history import prediction_history_repo
from jobs.job_manager import job_manager
from pipeline.training_pipeline import safe_retraining_pipeline

app = FastAPI(
    title="EduSphere ML Service Engine",
    description="Production-grade AI/ML microservice for 6-Dimensional Cognitive Digital Twin, ATS Resume Analytics, Voice Mock Interviews, Exam Proctoring Integrity, and RAG Knowledge Retrieval.",
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── Middleware ──────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(StructuredLoggingMiddleware)

# ── Global Exception Handler ───────────────────────────────────────────────
@app.exception_handler(MLServiceException)
async def ml_exception_handler(request: Request, exc: MLServiceException):
    req_id = getattr(request.state, "request_id", "req-unknown")
    return format_error_response(
        code=exc.code,
        message=exc.message,
        request_id=req_id,
        missing_features=exc.missing_features,
        status_code=exc.status_code
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    req_id = getattr(request.state, "request_id", "req-unknown")
    logger.error(f"Unhandled exception [req={req_id}]: {str(exc)}")
    return format_error_response(
        code="INTERNAL_ERROR",
        message="An unexpected error occurred during model inference.",
        request_id=req_id,
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
    )

# ── Health & Readiness Probes (Requirement #19) ─────────────────────────────

@app.get("/", tags=["Health"])
def read_root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "architecture": "6-Dimensional Cognitive Digital Twin + XAI + RAG"
    }

@app.get("/health", tags=["Health"])
def health_check():
    """Lightweight operational health probe."""
    return {"status": "healthy", "service": "ml_service", "version": settings.VERSION}

@app.get("/health/live", tags=["Health"])
def liveness_probe():
    """Liveness probe verifying HTTP process availability."""
    return {"status": "alive", "timestamp": time.time()}

@app.get("/health/ready", tags=["Health"])
def readiness_probe():
    """Readiness probe checking model loading and dependent engine status."""
    models_ready = bool(model_suite and hasattr(model_suite, "models") and len(model_suite.models) > 0)
    embedding_ready = bool(vector_search_engine is not None)
    return {
        "status": "ready" if (models_ready and embedding_ready) else "degraded",
        "version": settings.VERSION,
        "components": {
            "scikit_learn_models": "loaded" if models_ready else "uninitialized",
            "embedding_provider": vector_search_engine.provider.provider_type if embedding_ready else "unavailable",
            "prediction_history_repo": "active",
            "model_registry": "active"
        }
    }

@app.get("/metrics", tags=["Observability"])
def get_operational_metrics():
    """Exposes runtime operational telemetry metrics."""
    return {
        "service": "ml_service",
        "version": settings.VERSION,
        "modelsRegistered": len(model_registry.get_metadata()),
        "driftMonitoredSamples": len(drift_detector.inference_snapshots),
        "historyRecordsCount": len(prediction_history_repo._in_memory_records)
    }

# ── 6-Dimensional Cognitive Digital Twin Endpoints (Requirement #3) ─────────

@app.post(
    "/api/ml/digital-twin/analyze",
    response_model=DigitalTwinAnalyzeResponse,
    tags=["Digital Twin"],
    summary="Analyze 6-Dimensional Cognitive Digital Twin"
)
@app.post(
    "/api/ml/digital-twin/5-sub",
    response_model=DigitalTwinAnalyzeResponse,
    tags=["Digital Twin"],
    summary="Legacy Alias for 6D Digital Twin Analysis (Backward Compatibility)"
)
def analyze_6d_digital_twin(req: DigitalTwinAnalyzeRequest, request: Request):
    """
    Standardized 6-Dimensional Cognitive Digital Twin:
    1. Academic Twin
    2. Career Twin
    3. Skill Twin
    4. Attendance Twin
    5. Learning Twin
    6. Behavior & Workload Twin
    """
    req_id = getattr(request.state, "request_id", "req-twin")
    drift_detector.record_inference({
        "attendance_rate": req.attendance or 0.0,
        "cgpa": req.cgpa or 0.0,
        "coding_solved": req.coding_problems_solved or req.coding_score or 0.0,
        "study_hours": req.study_hours_weekly or 0.0,
        "ats_score": req.ats_score or 0.0,
    })
    return DigitalTwinService.analyze_student(req, request_id=req_id)

@app.get("/api/ml/digital-twin/history/{student_id}", tags=["Digital Twin"])
def get_student_prediction_history(student_id: str, limit: int = 15):
    """Retrieves temporal prediction trajectory snapshots for a student."""
    history = prediction_history_repo.get_student_history(student_id=student_id, limit=limit)
    return {"success": True, "studentId": student_id, "count": len(history), "history": history}

# ── Model Governance, Evaluation & Drift (Requirements #9, #10, #14) ────────

@app.get("/api/ml/models/evaluation", response_model=GlobalEvaluationResponse, tags=["Model Governance"])
def get_model_evaluations():
    """Returns empirical evaluation benchmark metrics for all production ML models."""
    return ModelEvaluator.get_global_evaluation_report(model_suite=model_suite)

@app.get("/api/ml/models/registry", tags=["Model Governance"])
def get_model_registry_metadata():
    """Returns versioning, lifecycle status, and schema versions of all registered models."""
    return {"success": True, "registry": model_registry.get_metadata()}

@app.get("/api/ml/models/drift", tags=["Model Governance"])
def check_feature_drift(model_name: str = "placement_predictor"):
    """Checks feature distribution drift between active inference snapshots and training baseline."""
    return drift_detector.check_drift(model_name=model_name)

# ── Safe Retraining & Asynchronous Background Jobs (Requirements #13, #17) ──

@app.post("/api/ml/digital-twin/retrain", tags=["Model Governance"])
def retrain_digital_twin_models():
    """Executes safe retraining pipeline with validation gating before production promotion."""
    try:
        res = safe_retraining_pipeline.retrain_and_evaluate_all()
        return {"success": True, "message": "Safe retraining pipeline completed with validation gating.", "data": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ml/jobs/retrain", status_code=status.HTTP_202_ACCEPTED, tags=["Background Jobs"])
def dispatch_async_retraining_job():
    """Dispatches asynchronous retraining job returning 202 Accepted and tracking Job ID."""
    job_id = job_manager.create_job(job_type="MODEL_RETRAINING")
    job_manager.run_async_task(job_id, safe_retraining_pipeline.retrain_and_evaluate_all)
    return {"success": True, "jobId": job_id, "status": "PENDING", "message": "Retraining task dispatched to background worker."}

@app.get("/api/ml/jobs/{job_id}", tags=["Background Jobs"])
def get_job_status(job_id: str):
    """Polls status of an asynchronous background job."""
    job = job_manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found.")
    return {"success": True, "job": job}

# ── ATS Resume Scoring & Document Parsing ────────────────────────────────────

class ResumeEvaluateRequest(BaseModel):
    summary: Optional[str] = ""
    skills: List[str] = []
    experience: List[Dict[str, Any]] = []
    projects: List[Dict[str, Any]] = []
    targetRole: Optional[str] = "Fullstack Developer"
    rawText: Optional[str] = None

@app.post("/api/ml/resume/upload", tags=["ATS Resume"])
async def upload_and_score_resume(
    file: UploadFile = File(...),
    targetRole: str = Form("Fullstack Developer")
):
    """Parses PDF, DOCX, or TXT binary file and evaluates ATS compatibility for target role."""
    allowed_exts = [".pdf", ".docx", ".doc", ".txt"]
    fname = file.filename or "resume.pdf"
    if not any(fname.lower().endswith(ext) for ext in allowed_exts):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{fname}'. Allowed formats: {', '.join(allowed_exts)}."
        )

    try:
        contents = await file.read()
        if not contents or len(contents) == 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty.")
        if len(contents) > settings.MAX_UPLOAD_SIZE_BYTES:
            raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="File exceeds maximum allowed size (10 MB).")

        extracted_text = parse_resume_bytes(contents, fname)
        if not extracted_text or len(extracted_text.strip()) < 10:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Could not extract readable text from uploaded document. Ensure document is not an unsearchable image scan.")

        result = ATSEngine.evaluate_resume_raw(extracted_text, target_role=targetRole)
        return {
            "success": True,
            "extractedText": extracted_text[:500] + ("..." if len(extracted_text) > 500 else ""),
            "filename": fname,
            "data": result
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to parse resume file: {str(e)}")

@app.post("/api/ml/ats-score", tags=["ATS Resume"])
def calculate_ats_score(req: ResumeEvaluateRequest):
    try:
        if req.rawText and req.rawText.strip():
            result = ATSEngine.evaluate_resume_raw(req.rawText, target_role=req.targetRole or "Fullstack Developer")
        else:
            exp_descs = [e.get("description", "") for e in req.experience]
            proj_descs = [f"{p.get('name', '')} {p.get('description', '')}" for p in req.projects]
            result = ATSEngine.evaluate_resume(
                summary=req.summary or "",
                skills=req.skills,
                experience_desc=exp_descs,
                projects_desc=proj_descs,
                target_role=req.targetRole or "Fullstack Developer"
            )
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── Mock Interview & Real-Time Voice Scorer ──────────────────────────────────

class ProctoredInterviewQuestionRequest(BaseModel):
    resumeText: Optional[str] = ""
    targetRole: Optional[str] = "Fullstack Developer"
    company: Optional[str] = "Google"

class EvaluateAnswerRequest(BaseModel):
    question: Optional[Dict[str, Any]] = None
    answer: str
    expectedKeywords: Optional[List[str]] = None
    modelAnswer: Optional[str] = None

class ScoreAnswerRequest(BaseModel):
    question: Optional[str] = ""
    voiceTranscript: Optional[str] = ""
    targetRole: Optional[str] = "Fullstack Developer"
    category: Optional[str] = "Technical HR"

ROLE_KEYWORDS: Dict[str, List[str]] = {
    "Fullstack Developer": ["react", "node", "api", "database", "frontend", "backend", "rest", "mongodb", "sql", "docker", "typescript", "git", "microservices", "authentication", "redux", "express"],
    "Frontend Developer": ["react", "css", "html", "javascript", "typescript", "responsive", "ui", "ux", "animation", "tailwind", "webpack", "performance", "accessibility", "component", "hooks"],
    "Backend Developer": ["api", "server", "database", "authentication", "node", "express", "python", "fastapi", "docker", "kubernetes", "sql", "nosql", "rest", "graphql", "microservices"],
    "AI / ML Engineer": ["model", "training", "neural", "python", "tensorflow", "pytorch", "dataset", "accuracy", "feature", "classification", "regression", "nlp", "computer vision", "gradient", "overfitting"],
    "Data Engineer": ["pipeline", "etl", "spark", "hadoop", "airflow", "sql", "database", "data warehouse", "kafka", "bigquery", "dbt", "pandas", "partitioning", "schema", "transformation"],
    "DevOps / Cloud Engineer": ["docker", "kubernetes", "ci/cd", "aws", "azure", "gcp", "terraform", "ansible", "jenkins", "monitoring", "logging", "deployment", "scaling", "infrastructure", "pipeline"],
}

STAR_SITUATION = ["situation", "context", "background", "problem", "challenge", "when i", "while working", "during", "we were", "our team"]
STAR_TASK = ["task", "responsible", "assigned", "role", "needed to", "had to", "requirement", "objective", "goal", "my job"]
STAR_ACTION = ["action", "implemented", "developed", "created", "solved", "designed", "built", "introduced", "refactored", "optimized", "i did", "we decided", "i wrote", "we used"]
STAR_RESULT = ["result", "outcome", "achieved", "improved", "reduced", "increased", "led to", "resulted in", "succeeded", "delivered", "impact", "performance went", "latency dropped", "reduced by", "improved by", "%"]
FILLER_WORDS = ["um", "uh", "like", "you know", "basically", "literally", "kind of", "sort of", "i mean", "honestly"]

@app.post("/api/ml/interview/proctored-questions", tags=["Mock Interview"])
def get_proctored_interview_questions(req: ProctoredInterviewQuestionRequest):
    try:
        questions = InterviewEngine.get_resume_questions(
            resume_text=req.resumeText or "",
            target_role=req.targetRole or "Fullstack Developer"
        )
        return {"success": True, "data": questions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ml/interview/evaluate", tags=["Mock Interview"])
def evaluate_interview_answer(req: EvaluateAnswerRequest):
    try:
        if not req.answer or not req.answer.strip():
            raise HTTPException(status_code=400, detail="Answer text is required for evaluation.")
        
        q_dict = req.question or {
            "expected_keywords": req.expectedKeywords or [],
            "model_answer": req.modelAnswer or ""
        }
        result = InterviewEngine.evaluate_answer(q_dict, req.answer)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ml/interview/score-answer", tags=["Mock Interview"])
def score_voice_answer(req: ScoreAnswerRequest):
    """Real-time voice transcript scoring evaluating keyword relevance, STAR structure, and filler words."""
    transcript = (req.voiceTranscript or "").lower().strip()
    role = req.targetRole or "Fullstack Developer"
    category = req.category or "Technical HR"

    if not transcript or len(transcript.split()) < 3:
        return {
            "success": True,
            "totalScore": 0,
            "grade": "F",
            "breakdown": {"keyword_relevance": 0, "star_structure": 0, "completeness": 0, "confidence": 0},
            "keywords_found": [],
            "feedback": "No sufficient response detected. Please speak clearly and provide a detailed answer."
        }

    words = transcript.split()
    word_count = len(words)

    # 1. Keyword Relevance Score (0-40)
    role_kws = ROLE_KEYWORDS.get(role, ROLE_KEYWORDS["Fullstack Developer"])
    general_kws = ["performance", "scalable", "architecture", "team", "collaboration", "testing", "debug", "review", "deploy", "agile", "sprint", "requirement", "analysis"]
    all_kws = list(set(role_kws + general_kws))
    found_keywords = [kw for kw in all_kws if kw in transcript]
    kw_ratio = min(len(found_keywords) / 8, 1.0)
    keyword_score = round(kw_ratio * 40)

    # 2. STAR Structure Score (0-30)
    has_situation = any(s in transcript for s in STAR_SITUATION)
    has_task = any(t in transcript for t in STAR_TASK)
    has_action = any(a in transcript for a in STAR_ACTION)
    has_result = any(r in transcript for r in STAR_RESULT)
    star_count = sum([has_situation, has_task, has_action, has_result])
    star_score = round((star_count / 4) * 30)
    if category == "Technical HR":
        star_score = round(((has_action * 2 + has_result * 2 + has_situation + has_task) / 6) * 30)

    # 3. Completeness Score (0-20)
    completeness_score = 20 if word_count >= 100 else (15 if word_count >= 60 else (10 if word_count >= 30 else 5))

    # 4. Confidence Score (0-10): penalize filler words
    filler_count = sum(transcript.count(fw) for fw in FILLER_WORDS)
    filler_ratio = filler_count / max(word_count / 10, 1)
    confidence_score = max(0, round(10 - (filler_ratio * 5)))

    total_score = min(100, keyword_score + star_score + completeness_score + confidence_score)
    grade = "A" if total_score >= 85 else ("B" if total_score >= 70 else ("C" if total_score >= 55 else ("D" if total_score >= 40 else "F")))

    feedback_parts = []
    if keyword_score < 20:
        feedback_parts.append(f"Add more {role}-specific technical terms.")
    if star_score < 20:
        feedback_parts.append("Structure response with Situation, Task, Action, and Result (STAR).")
    if completeness_score < 10:
        feedback_parts.append("Expand answer with deeper technical details (aim for 60+ words).")
    if confidence_score < 6:
        feedback_parts.append("Reduce filler words (um, uh, like) to enhance delivery clarity.")
    if not feedback_parts:
        feedback_parts.append("Excellent answer! Strong technical depth and STAR-structured response.")

    return {
        "success": True,
        "totalScore": total_score,
        "grade": grade,
        "breakdown": {
            "keyword_relevance": keyword_score,
            "star_structure": star_score,
            "completeness": completeness_score,
            "confidence": confidence_score,
        },
        "keywords_found": found_keywords[:10],
        "star_components": {
            "situation": has_situation,
            "task": has_task,
            "action": has_action,
            "result": has_result,
        },
        "word_count": word_count,
        "feedback": " ".join(feedback_parts)
    }

# ── EDEN AI & Telemetry Endpoints ───────────────────────────────────────────

class EdenChatRequest(BaseModel):
    message: str
    userName: Optional[str] = "Student"
    userRole: Optional[str] = "student"
    targetRole: Optional[str] = "Fullstack Developer"
    atsScore: Optional[int] = 78
    gpa: Optional[float] = 8.4
    attendanceRate: Optional[int] = 87
    xp: Optional[int] = 2450

class SM2EvalRequest(BaseModel):
    topic: str
    subject: Optional[str] = "Computer Science"
    easeFactor: Optional[float] = 2.5
    repetitions: Optional[int] = 0
    intervalDays: Optional[int] = 1
    rating: int = 3
    daysSinceLastReview: Optional[float] = 1.0
    mistakeCount: Optional[int] = 0
    practiceCount: Optional[int] = 0

class AttendanceMathRequest(BaseModel):
    presentClasses: int = 103
    totalClasses: int = 120
    upcomingMissCount: Optional[int] = 1

class StudyPlanRequest(BaseModel):
    targetRole: Optional[str] = "Fullstack Developer"
    weakSubjects: Optional[List[str]] = ["Data Structures & Algorithms"]
    gpa: Optional[float] = 8.4

@app.post("/api/ml/eden/chat", tags=["EDEN AI Core"])
def eden_chat_copilot(req: EdenChatRequest):
    msg_lower = req.message.lower()
    stage_info = EdenEvolutionEngine.get_stage(req.xp or 2450)
    
    if "prime" in msg_lower and "array" in msg_lower and "python" in msg_lower:
        reply = """Here is the Python code to find the count of prime numbers in an array:
```python
def is_prime(n):
    if n <= 1: return False
    if n <= 3: return True
    if n % 2 == 0 or n % 3 == 0: return False
    i = 5
    while i * i <= n:
        if n % i == 0 or n % (i + 2) == 0: return False
        i += 6
    return True

def count_primes(arr):
    return sum(1 for num in arr if is_prime(num))

arr = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
print(f"Count of primes: {count_primes(arr)}")
```"""
    elif "prime" in msg_lower and "array" in msg_lower and "java" in msg_lower:
        reply = """Here is the Java code to find the count of prime numbers in an array:
```java
public class PrimeCounter {
    public static boolean isPrime(int n) {
        if (n <= 1) return false;
        if (n <= 3) return true;
        if (n % 2 == 0 || n % 3 == 0) return false;
        for (int i = 5; i * i <= n; i += 6) {
            if (n % i == 0 || n % (i + 2) == 0) return false;
        }
        return true;
    }

    public static int countPrimes(int[] arr) {
        int count = 0;
        for (int num : arr) {
            if (isPrime(num)) count++;
        }
        return count;
    }

    public static void main(String[] args) {
        int[] arr = {2, 3, 4, 5, 6, 7, 8, 9, 10, 11};
        System.out.println("Count of primes: " + countPrimes(arr));
    }
}
```"""
    elif "ats" in msg_lower or "resume" in msg_lower or "score" in msg_lower:
        reply = f"📊 EDEN Career Intelligence ({stage_info['icon']} {stage_info['stage']} Stage): Your resume ATS score for {req.targetRole} is {req.atsScore}/100. Target role benchmarks recommend adding Docker, Kubernetes, and System Design to reach 90+."
    elif "attendance" in msg_lower or "miss" in msg_lower or "absent" in msg_lower:
        math_res = AttendanceIntelligence.calculate_attendance_math(103, 120, 1)
        reply = f"📅 EDEN Attendance Math ({stage_info['icon']} {stage_info['stage']} Stage): {math_res['insightMessage']}"
    elif "gpa" in msg_lower or "grade" in msg_lower:
        reply = f"🎓 EDEN Academic Track: Your current cumulative GPA is {req.gpa}/10.0. Predicted semester outcome: {min(10.0, round((req.gpa or 8.4) + 0.2, 2))}."
    else:
        reply = f"Hello {req.userName}! I am your custom rule-based EDEN AI. I can write code (e.g., 'find prime numbers in an array in python'), check your ATS score, and predict attendance."
        
    return {"success": True, "reply": reply, "evolution": stage_info}

@app.post("/api/ml/eden/digital-twin", tags=["Digital Twin"])
@app.post("/api/ml/digital-twin/predict", tags=["Digital Twin"])
def get_digital_twin_ml(req: Dict[str, Any]):
    try:
        ml_predictions = model_suite.predict_digital_twin(req)
        evolution = EdenEvolutionEngine.get_stage(req.get("xp") or 0)
        data = {
            "scores": {
                "learningScore": round(ml_predictions["learningPace"]),
                "productivityScore": round(ml_predictions["learningPace"] * 0.9),
                "focusScore": round(float(req.get("attendanceRate", 0.0))),
                "growthScore": round(min(100.0, float(req.get("xp", 0)) / 50.0)),
                "skillScore": round(ml_predictions["codingScore"]),
            },
            "predictions": {
                "predictedSemesterGpa": ml_predictions["predictedCGPA"],
                "placementReadinessPct": round(ml_predictions["placementProbability"]),
                "backlogRisk": ml_predictions["backlogRisk"],
                "burnoutRisk": ml_predictions["burnoutRisk"],
                "dropoutRisk": ml_predictions["dropoutRisk"],
                "interviewReadinessScore": round(ml_predictions["interviewReadinessScore"]),
                "estimatedSalaryRange": ml_predictions["estimatedSalaryRange"],
                "predictionConfidence": ml_predictions["predictionConfidence"],
            },
            "mlModelOutputs": ml_predictions,
            "evolution": evolution,
        }
        return {"success": True, "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ml/digital-twin/sm2-eval", tags=["Digital Twin"])
def eval_sm2_decay(req: SM2EvalRequest):
    try:
        decay_res = CognitiveTwinEngine.calculate_sm2_decay(
            topic=req.topic,
            subject=req.subject or "Computer Science",
            ease_factor=req.easeFactor or 2.5,
            repetitions=req.repetitions or 0,
            interval_days=req.intervalDays or 1,
            rating=req.rating,
            days_since_last_review=req.daysSinceLastReview or 1.0,
            mistake_count=req.mistakeCount or 0,
            practice_count=req.practiceCount or 0
        )
        return {"success": True, "data": decay_res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ml/eden/attendance-math", tags=["EDEN AI Core"])
def calculate_attendance_math_ml(req: AttendanceMathRequest):
    try:
        data = AttendanceIntelligence.calculate_attendance_math(
            present_classes=req.presentClasses,
            total_classes=req.totalClasses,
            upcoming_classes_to_miss=req.upcomingMissCount or 1
        )
        return {"success": True, "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ml/eden/study-plan", tags=["EDEN AI Core"])
def generate_study_plan_ml(req: StudyPlanRequest):
    try:
        data = SmartStudyPlanner.generate_timetable(
            target_role=req.targetRole or "Fullstack Developer",
            weak_subjects=req.weakSubjects or ["Data Structures & Algorithms"],
            gpa=req.gpa or 8.4
        )
        return {"success": True, "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── Attendance Forecasting ──────────────────────────────────────────────────

class AttendancePredictionRequest(BaseModel):
    presentClasses: Optional[int] = 0
    totalClasses: Optional[int] = 0
    targetGoal: Optional[float] = 90.0

@app.post("/api/ml/attendance/predict", tags=["Attendance"])
def predict_attendance_ml(req: AttendancePredictionRequest):
    try:
        result = AttendancePredictor.predict_attendance(
            present_classes=req.presentClasses if req.presentClasses is not None else 0,
            total_classes=req.totalClasses if req.totalClasses is not None else 0,
            target_goal=req.targetGoal or 90.0
        )
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class AttendanceQueryRequest(BaseModel):
    query: str
    presentClasses: Optional[int] = 0
    totalClasses: Optional[int] = 0
    targetGoal: Optional[float] = 90.0

@app.post("/api/ml/attendance/query", tags=["Attendance"])
def query_eden_attendance(req: AttendanceQueryRequest):
    try:
        result = AttendancePredictor.answer_eden_attendance_query(
            query=req.query,
            present_classes=req.presentClasses if req.presentClasses is not None else 0,
            total_classes=req.totalClasses if req.totalClasses is not None else 0,
            target_goal=req.targetGoal or 90.0
        )
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── Exam Proctoring & Integrity ─────────────────────────────────────────────

@app.post("/api/ml/proctor/evaluate-risk", tags=["Proctoring"])
def evaluate_proctor_risk(req: ProctorLiveEvaluationRequest):
    try:
        result = ProctorRiskEngine.evaluate_live_risk(
            eye_focus_score=req.eye_focus_score or 95.0,
            head_yaw=req.head_yaw or 0.0,
            head_pitch=req.head_pitch or 0.0,
            face_count=req.face_count if req.face_count is not None else 1,
            browser_violations=req.browser_violations or 0,
            audio_detected=req.audio_detected or False,
            previous_warnings=req.previous_warnings or 0
        )
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class CheatingPredictionRequest(BaseModel):
    pastViolationsCount: Optional[int] = 0
    avgEyeFocus: Optional[float] = 90.0
    tabSwitchesPerExam: Optional[float] = 0.5
    pastWarningHistory: Optional[int] = 0

@app.post("/api/ml/proctor/predict-cheating", tags=["Proctoring"])
def predict_cheating(req: CheatingPredictionRequest):
    try:
        result = CheatingPredictor.predict_future_cheating(
            past_violations_count=req.pastViolationsCount or 0,
            avg_eye_focus=req.avgEyeFocus or 90.0,
            tab_switches_per_exam=req.tabSwitchesPerExam or 0.5,
            past_warning_history=req.pastWarningHistory or 0
        )
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── Learning Recommendations & Placement ────────────────────────────────────

@app.post("/api/ml/recommendations", tags=["Recommendations"])
def get_learning_recommendations(profile: Dict[str, Any]):
    """Multi-input recommendation model with XAI justifications."""
    try:
        recs = learning_recommender.generate_recommendations(profile)
        return {"success": True, "data": recs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ml/placement/predict", tags=["Placement"])
def predict_placement_readiness(data: Dict[str, Any]):
    """Placement Readiness & Company Tier Classifier with feature attribution XAI."""
    try:
        prediction = placement_engine.predict_placement(data)
        return {"success": True, "data": prediction}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── RAG Knowledge Retrieval ─────────────────────────────────────────────────

class RAGChatRequest(BaseModel):
    user_id: Optional[str] = "std-101"
    query: str
    role: Optional[str] = "student"
    name: Optional[str] = "Alex Johnson"

@app.post("/api/ml/eden/rag-chat", tags=["RAG Retrieval"])
def eden_rag_chat(req: RAGChatRequest):
    """RAG Chat endpoint returning retrieved knowledge base snippets and user context."""
    try:
        context = rag_prompt_engine.generate_rag_context(
            user_id=req.user_id or "std-101",
            query=req.query,
            role=req.role or "student",
            name=req.name or "Alex Johnson"
        )
        return {"success": True, "data": context}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)
