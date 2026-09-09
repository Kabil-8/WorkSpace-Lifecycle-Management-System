# EduSphere ML Microservice

Production-Oriented AI/ML Microservice for the EduSphere Student Lifecycle Management Ecosystem.

## Classification
**PRODUCTION CANDIDATE** (with explicit institutional validation requirements).

---

## Implemented Architecture

- **6-Dimensional Cognitive Digital Twin**:
  1. Academic Twin (`current_cgpa`, `predicted_gpa`, `academic_risk_category`)
  2. Career Twin (`placement_readiness_score`, `target_company_tier`, `estimated_salary_range`)
  3. Skill Twin (`coding_proficiency_score`, `skill_radar`, `concept_mastery`)
  4. Attendance Twin (`current_attendance_pct`, `attendance_trajectory`, `exam_eligibility`)
  5. Learning Twin (`learning_pace_score`, `retention_rate_pct`, `sm2_spaced_repetition_items`)
  6. Behavior & Workload Twin (`workload_indicator`, `burnout_risk_score`, `study_consistency`)
- **Telemetry Feature Pipeline**: 22-dimensional feature extraction with strict zero-fabrication and `DataQualityResult` validation (`HIGH`, `MEDIUM`, `LOW`, `INSUFFICIENT`).
- **Explainable AI (XAI)**: Feature Contribution-Based mathematical attribution scoring feature directions and impact weights.
- **Model Governance & Registry**: Tracks model versioning, feature schema versions, lifecycle status (`staging`, `production`, `deprecated`), and empirical metrics.
- **Model Drift Monitoring**: Population Stability Index (PSI) distribution drift detection with minimum sample thresholding.
- **Service Security**: Service-to-service header authentication (`X-Service-Key` / Bearer token) with fail-closed production enforcement and strict CORS origin whitelisting.
- **Health & Readiness**: `/health/live`, `/health/ready`, and `/metrics` operational probes.
- **Asynchronous Task Manager**: In-process background job runner for non-blocking ML operations.
- **RAG / Embedding Abstraction**: Standardized `EmbeddingProvider` interface with active `lexical_statistical_fallback` (TF-IDF/cosine similarity) and pluggable dense embedding providers.

---

## Current Honest Limitations

1. **Synthetic Training Splits**: Base ML models (Ridge, RandomForestRegressor, GradientBoostingClassifier) are initialized on synthetic domain distributions. Real institutional historical student data is required before final production deployment.
2. **Lexical Retrieval Active**: The active RAG retrieval uses lexical TF-IDF matching. Dense semantic vector search via MongoDB Atlas `$vectorSearch` is architecturally supported and activates when external API credentials are provided.
3. **In-Process Job Runner**: Background retraining tasks run in-process via Python threads. Horizontal scaling across multi-container clusters requires an external task broker (e.g. Celery / Redis).

---

## API Endpoints

### Digital Twin
- `POST /api/ml/digital-twin/analyze`: Canonical 6D Digital Twin evaluation.
- `POST /api/ml/digital-twin/5-sub`: Backward-compatible alias for Node.js backend integration.
- `GET /api/ml/digital-twin/history/{student_id}`: Temporal progression snapshots.
- `POST /api/ml/digital-twin/sm2-eval`: SuperMemo SM-2 memory decay evaluation.

### Predictive Models & Analytics
- `POST /api/ml/placement/predict`: Placement readiness & salary estimation with XAI.
- `POST /api/ml/ats-score`: Resume ATS scoring against role benchmarks.
- `POST /api/ml/resume/upload`: Document upload & parsing (.pdf, .docx, .txt) with size limits.
- `POST /api/ml/interview/score-answer`: Voice transcript evaluation (STAR method + clarity).
- `POST /api/ml/proctor/evaluate-risk`: Exam integrity risk evaluation with anomaly timeline.
- `POST /api/ml/attendance/predict`: Attendance trajectory & exam eligibility.
- `POST /api/ml/recommendations`: Multi-source personalized learning recommendations with XAI reasons.
- `POST /api/ml/eden/chat`: EDEN AI telemetry copilot.
- `POST /api/ml/eden/rag-chat`: Knowledge base retrieval.

### Governance & Health
- `GET /health`, `GET /health/live`, `GET /health/ready`, `GET /metrics`
- `GET /api/ml/models/registry`, `GET /api/ml/models/drift`, `GET /api/ml/models/evaluation`
- `POST /api/ml/jobs/retrain`, `GET /api/ml/jobs/{job_id}`
