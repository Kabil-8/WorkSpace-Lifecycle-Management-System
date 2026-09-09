import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_placement_prediction_endpoint():
    payload = {
        "cgpa": 8.5,
        "projects_count": 3,
        "skills": ["React", "TypeScript", "Node.js", "Python"],
        "ats_score": 85.0,
        "interview_score": 80.0,
        "attendance": 90.0,
        "coding_score": 80.0
    }
    res = client.post("/api/ml/placement/predict", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "placement_probability_pct" in data["data"]
    assert data["data"]["placement_probability_pct"] >= 70
    assert "company_tier" in data["data"]
    assert "estimated_salary_range" in data["data"]
    assert "xai_explainability" in data["data"]
    assert "feature_attributions" in data["data"]["xai_explainability"]

def test_ats_score_endpoint():
    payload = {
        "summary": "Fullstack Developer with expertise in React, Node.js, and TypeScript.",
        "skills": ["React", "Node.js", "TypeScript", "MongoDB", "Python"],
        "experience": [
            {
                "title": "Fullstack Intern",
                "description": "Architected RESTful APIs with Node.js and reduced query latency by 35%."
            }
        ],
        "projects": [
            {
                "name": "EduSphere",
                "description": "Built AI LMS ecosystem with 5000+ active users."
            }
        ],
        "targetRole": "Fullstack Developer"
    }
    res = client.post("/api/ml/ats-score", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "score" in data["data"]
    assert data["data"]["score"] > 50
    assert "breakdown" in data["data"]
    assert "matchedKeywords" in data["data"]

def test_resume_upload_valid_file():
    content = b"Fullstack Developer with 3 years experience in React, Node.js, TypeScript, and MongoDB. Architected scalable web services and reduced latency by 35%."
    files = {"file": ("resume.txt", content, "text/plain")}
    data = {"targetRole": "Fullstack Developer"}
    res = client.post("/api/ml/resume/upload", files=files, data=data)
    assert res.status_code == 200
    res_data = res.json()
    assert res_data["success"] is True
    assert "score" in res_data["data"]

def test_resume_upload_invalid_extension():
    content = b"malicious binary content"
    files = {"file": ("script.exe", content, "application/octet-stream")}
    res = client.post("/api/ml/resume/upload", files=files, data={"targetRole": "Fullstack Developer"})
    assert res.status_code == 400
    assert "Unsupported file format" in res.json()["detail"]

def test_resume_upload_empty_file():
    files = {"file": ("empty.pdf", b"", "application/pdf")}
    res = client.post("/api/ml/resume/upload", files=files, data={"targetRole": "Fullstack Developer"})
    assert res.status_code == 400
    assert "empty" in res.json()["detail"].lower()


def test_proctor_live_risk_evaluation():
    payload = {
        "eye_focus_score": 92.0,
        "head_yaw": 5.0,
        "head_pitch": 3.0,
        "face_count": 1,
        "browser_violations": 0,
        "audio_detected": False,
        "previous_warnings": 0
    }
    res = client.post("/api/ml/proctor/evaluate-risk", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["data"]["integrityScore"] >= 80
    assert data["data"]["riskCategory"] == "Safe"
    assert data["data"]["requiresProctorReview"] is False
    assert "eventTimeline" in data["data"]
    assert "scientificDisclaimer" in data["data"]

def test_proctor_anomaly_flagged_for_review():
    payload = {
        "eye_focus_score": 40.0,
        "head_yaw": 30.0,
        "head_pitch": 25.0,
        "face_count": 2,
        "browser_violations": 3,
        "audio_detected": True,
        "previous_warnings": 1
    }
    res = client.post("/api/ml/proctor/evaluate-risk", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["data"]["integrityScore"] < 50
    assert data["data"]["requiresProctorReview"] is True
    assert len(data["data"]["eventTimeline"]) >= 3

def test_mock_interview_voice_answer_scoring():
    payload = {
        "question": "How did you optimize rendering in React?",
        "voiceTranscript": "In our project situation, our team was facing high frontend rendering latency. My task was to optimize dashboard performance and responsiveness. I implemented React component memoization, isolated state with Redux, and refactored re-renders using custom hooks and database API caching. As a result, page load latency dropped by 45% and improved overall rendering performance significantly.",
        "targetRole": "Fullstack Developer",
        "category": "Technical HR"
    }
    res = client.post("/api/ml/interview/score-answer", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["totalScore"] >= 70
    assert data["grade"] in ["A", "B"]
    assert "star_components" in data
    assert data["star_components"]["situation"] is True
    assert data["star_components"]["action"] is True
    assert data["star_components"]["result"] is True

def test_learning_recommendations_endpoint():
    payload = {
        "cgpa": 8.2,
        "attendance": 85.0,
        "weak_topics": ["Algorithms & Data Structures"],
        "coding_score": 65
    }
    res = client.post("/api/ml/recommendations", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "recommendations" in data["data"]
    assert "courses" in data["data"]["recommendations"]
    assert len(data["data"]["recommendations"]["courses"]) > 0
    assert "xai_reason" in data["data"]["recommendations"]["courses"][0]

def test_sm2_decay_eval_endpoint():
    payload = {
        "topic": "Binary Search Trees",
        "subject": "Computer Science",
        "easeFactor": 2.5,
        "repetitions": 2,
        "intervalDays": 6,
        "rating": 4,
        "daysSinceLastReview": 3.0
    }
    res = client.post("/api/ml/digital-twin/sm2-eval", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "retentionProbability" in data["data"]
    assert "nextReviewIntervalDays" in data["data"]

def test_attendance_forecast_endpoint():
    payload = {
        "presentClasses": 85,
        "totalClasses": 100,
        "targetGoal": 90.0
    }
    res = client.post("/api/ml/attendance/predict", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["data"]["currentPercentage"] == 85.0
    assert data["data"]["isEligibleForExams"] is True
    assert data["data"]["requiredClassesForGoal"] > 0

def test_rag_chat_endpoint():
    payload = {
        "user_id": "std-test-101",
        "query": "What are the rules for exam attendance eligibility?",
        "role": "student",
        "name": "Faizan Gafoor"
    }
    res = client.post("/api/ml/eden/rag-chat", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "rag_context" in data["data"]
    assert "kb_sources" in data["data"]
