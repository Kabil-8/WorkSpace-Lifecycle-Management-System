import os
import math
import joblib
import numpy as np
from typing import Dict, Any, List, Tuple
from sklearn.ensemble import RandomForestRegressor, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression, Ridge

MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
MODEL_FILE = os.path.join(MODEL_DIR, "twin_models.joblib")

os.makedirs(MODEL_DIR, exist_ok=True)

class FeatureExtractor:
    """
    Transforms raw student telemetry inputs into 22 engineered ML features.
    """
    @staticmethod
    def extract_features(raw: Dict[str, Any]) -> Dict[str, float]:
        attendance_rate = float(raw.get("attendanceRate", 0.0))
        assignment_completion_rate = float(raw.get("assignmentCompletionRate", 0.0))
        quiz_avg_score = float(raw.get("quizAvgScore", 0.0))
        coding_problems_solved = float(raw.get("codingProblemsSolved", 0))
        study_hours_weekly = float(raw.get("studyHoursWeekly", 0.0))
        gpa = float(raw.get("gpa", 0.0))
        ats_score = float(raw.get("atsScore", 0))
        xp = float(raw.get("xp", 0))
        interview_score = float(raw.get("interviewScore", 0.0))
        project_completion_rate = float(raw.get("projectCompletionRate", 0.0))

        # Derived engineered features
        coding_accuracy = min(100.0, coding_problems_solved * 2.5) if coding_problems_solved > 0 else 0.0
        coding_consistency = min(100.0, (coding_problems_solved / 30.0) * 100) if coding_problems_solved > 0 else 0.0
        difficulty_score = min(100.0, coding_problems_solved * 1.8 + quiz_avg_score * 0.4)
        daily_learning_minutes = round((study_hours_weekly * 60) / 7.0, 1)
        weekly_learning_hours = study_hours_weekly
        study_consistency = min(100.0, (study_hours_weekly / 20.0) * 100.0)
        attendance_trend = attendance_rate - 75.0
        cgpa_trend = (gpa - 7.0) if gpa > 0 else -1.0
        coding_growth = min(100.0, (xp / 5000.0) * 100)
        quiz_growth = quiz_avg_score
        project_growth = project_completion_rate
        revision_frequency = min(10.0, study_hours_weekly / 2.5)
        knowledge_retention = min(100.0, (quiz_avg_score * 0.6) + (assignment_completion_rate * 0.4))

        # Burnout score calculation (high study hours + low sleep/late submissions)
        burnout_score = min(100.0, max(0.0, (study_hours_weekly / 40.0 * 60) + (100 - attendance_rate) * 0.4))
        engagement_score = min(100.0, (attendance_rate * 0.3) + (assignment_completion_rate * 0.3) + (min(100.0, xp / 30.0) * 0.4))

        return {
            "attendance_rate": attendance_rate,
            "assignment_completion_rate": assignment_completion_rate,
            "quiz_avg_score": quiz_avg_score,
            "coding_problems_solved": coding_problems_solved,
            "study_hours_weekly": study_hours_weekly,
            "gpa": gpa,
            "ats_score": ats_score,
            "xp": xp,
            "interview_score": interview_score,
            "project_completion_rate": project_completion_rate,
            "coding_accuracy": coding_accuracy,
            "coding_consistency": coding_consistency,
            "difficulty_score": difficulty_score,
            "daily_learning_minutes": daily_learning_minutes,
            "weekly_learning_hours": weekly_learning_hours,
            "study_consistency": study_consistency,
            "attendance_trend": attendance_trend,
            "cgpa_trend": cgpa_trend,
            "coding_growth": coding_growth,
            "quiz_growth": quiz_growth,
            "revision_frequency": revision_frequency,
            "knowledge_retention": knowledge_retention,
            "burnout_score": burnout_score,
            "engagement_score": engagement_score,
        }

class MLModelSuite:
    """
    Houses 8 Scikit-Learn prediction models for Digital Twin telemetry.
    """
    def __init__(self):
        self.models = {}
        self.load_or_train_models()

    def train_baseline_models(self):
        """
        Trains initial Scikit-Learn baseline models on synthetic domain telemetry dataset.
        """
        np.random.seed(42)
        N = 300
        # Synthetic feature generation
        att = np.random.uniform(50, 100, N)
        ass = np.random.uniform(40, 100, N)
        quiz = np.random.uniform(40, 100, N)
        coding = np.random.randint(0, 100, N)
        hours = np.random.uniform(2, 35, N)
        gpa = np.random.uniform(4.0, 10.0, N)
        ats = np.random.uniform(30, 95, N)
        xp = np.random.uniform(100, 10000, N)

        X = np.column_stack([att, ass, quiz, coding, hours, gpa, ats, xp])

        # Targets
        y_pace = np.clip((gpa * 4) + (quiz * 0.4) + (ass * 0.2), 0, 100)
        y_coding = np.clip((coding * 0.6) + (ats * 0.4), 0, 100)
        y_place = np.clip((ats * 0.4) + (gpa * 5) + (coding * 0.3), 0, 100)
        y_gpa = np.clip(gpa + (quiz - 70) * 0.01, 0, 10.0)
        y_burnout = np.where((hours > 25) & (att < 70), 2, np.where(hours > 18, 1, 0)) # 0: Low, 1: Medium, 2: High
        y_backlog = np.where((att < 65) | (gpa < 6.0), 1, 0) # 1: Risk, 0: Safe
        y_dropout = np.clip(100 - (att * 0.6 + gpa * 4), 0, 100)
        y_interview = np.clip(y_coding * 0.5 + ats * 0.5, 0, 100)

        m_pace = Ridge().fit(X, y_pace)
        m_coding = Ridge().fit(X, y_coding)
        m_place = RandomForestRegressor(n_estimators=20, random_state=42).fit(X, y_place)
        m_gpa = Ridge().fit(X, y_gpa)
        m_burnout = GradientBoostingClassifier(n_estimators=20, random_state=42).fit(X, y_burnout)
        m_backlog = LogisticRegression(max_iter=1000).fit(X, y_backlog)
        m_dropout = Ridge().fit(X, y_dropout)
        m_interview = Ridge().fit(X, y_interview)

        self.models = {
            "m_pace": m_pace,
            "m_coding": m_coding,
            "m_place": m_place,
            "m_gpa": m_gpa,
            "m_burnout": m_burnout,
            "m_backlog": m_backlog,
            "m_dropout": m_dropout,
            "m_interview": m_interview,
        }
        joblib.dump(self.models, MODEL_FILE)

    def load_or_train_models(self):
        if os.path.exists(MODEL_FILE):
            try:
                self.models = joblib.load(MODEL_FILE)
            except Exception:
                self.train_baseline_models()
        else:
            self.train_baseline_models()

    def predict_digital_twin(self, raw_input: Dict[str, Any]) -> Dict[str, Any]:
        feats = FeatureExtractor.extract_features(raw_input)
        X_vec = np.array([[
            feats["attendance_rate"],
            feats["assignment_completion_rate"],
            feats["quiz_avg_score"],
            feats["coding_problems_solved"],
            feats["study_hours_weekly"],
            feats["gpa"],
            feats["ats_score"],
            feats["xp"]
        ]])

        # Execute 8 models
        p_pace = round(float(self.models["m_pace"].predict(X_vec)[0]), 1) if feats["xp"] > 0 or feats["gpa"] > 0 else 0.0
        p_coding = round(float(self.models["m_coding"].predict(X_vec)[0]), 1) if feats["coding_problems_solved"] > 0 else 0.0
        p_place = round(float(self.models["m_place"].predict(X_vec)[0]), 1) if feats["ats_score"] > 0 or feats["gpa"] > 0 else 0.0
        p_gpa = round(float(self.models["m_gpa"].predict(X_vec)[0]), 2) if feats["gpa"] > 0 else 0.0

        b_class = int(self.models["m_burnout"].predict(X_vec)[0]) if feats["study_hours_weekly"] > 0 else 0
        burnout_risk = "High" if b_class == 2 else ("Medium" if b_class == 1 else "Low")

        bg_class = int(self.models["m_backlog"].predict(X_vec)[0]) if feats["gpa"] > 0 else 0
        backlog_risk = "High Risk" if bg_class == 1 else "Safe"

        p_dropout = round(float(self.models["m_dropout"].predict(X_vec)[0]), 1) if feats["attendance_rate"] > 0 else 0.0
        p_interview = round(float(self.models["m_interview"].predict(X_vec)[0]), 1) if feats["ats_score"] > 0 or feats["coding_problems_solved"] > 0 else 0.0

        # Overall prediction confidence score
        activity_count = sum(1 for v in [feats["attendance_rate"], feats["coding_problems_solved"], feats["gpa"], feats["ats_score"], feats["quiz_avg_score"]] if v > 0)
        confidence = round(min(98.0, 40.0 + (activity_count * 11.5)), 1)

        # Expected salary range
        salary_min = round(p_place * 0.12 + 4.0, 1) if p_place > 0 else 0.0
        salary_max = round(p_place * 0.22 + 8.0, 1) if p_place > 0 else 0.0

        return {
            "learningPace": max(0.0, min(100.0, p_pace)),
            "codingScore": max(0.0, min(100.0, p_coding)),
            "placementProbability": max(0.0, min(100.0, p_place)),
            "predictedCGPA": max(0.0, min(10.0, p_gpa)),
            "burnoutRisk": burnout_risk,
            "backlogRisk": backlog_risk,
            "dropoutRisk": max(0.0, min(100.0, p_dropout)),
            "interviewReadinessScore": max(0.0, min(100.0, p_interview)),
            "predictionConfidence": confidence,
            "estimatedSalaryRange": f"₹{salary_min}L - ₹{salary_max}L PA" if p_place > 0 else "Pending Data",
            "engineeredFeatures": feats
        }

    def predict_learning_pace(self, data: Dict[str, Any]) -> Dict[str, Any]:
        feats = FeatureExtractor.extract_features(data)
        X_vec = np.array([[
            feats["attendance_rate"], feats["assignment_completion_rate"], feats["quiz_avg_score"],
            feats["coding_problems_solved"], feats["study_hours_weekly"], feats["gpa"],
            feats["ats_score"], feats["xp"]
        ]])
        p_pace = round(float(self.models["m_pace"].predict(X_vec)[0]), 1) if feats["xp"] > 0 or feats["gpa"] > 0 else 0.0
        val = max(0.0, min(100.0, p_pace))
        return {
            "value": val,
            "lastUpdated": "2026-08-06T23:00:00Z",
            "history": [
                {"week": 1, "value": max(0.0, round(val * 0.7, 1))},
                {"week": 2, "value": max(0.0, round(val * 0.85, 1))},
                {"week": 3, "value": val}
            ]
        }

    def predict_coding_proficiency(self, data: Dict[str, Any]) -> Dict[str, Any]:
        feats = FeatureExtractor.extract_features(data)
        accepted = int(data.get("acceptedProblems") or data.get("codingProblemsSolved") or 0)
        accuracy = round(min(98.0, max(50.0, 70.0 + (accepted * 0.15))), 1) if accepted > 0 else 0.0
        medium_solved = int(accepted * 0.45)
        hard_solved = int(accepted * 0.15)
        projects = int(data.get("projectsCount") or 4)

        X_vec = np.array([[
            feats["attendance_rate"], feats["assignment_completion_rate"], feats["quiz_avg_score"],
            accepted, feats["study_hours_weekly"], feats["gpa"], feats["ats_score"], feats["xp"]
        ]])
        p_coding = round(float(self.models["m_coding"].predict(X_vec)[0]), 1) if accepted > 0 else 0.0
        score = max(0.0, min(100.0, p_coding))

        return {
            "score": score,
            "breakdown": {
                "accepted": accepted,
                "accuracy": accuracy,
                "mediumSolved": medium_solved,
                "hardSolved": hard_solved,
                "projects": projects
            }
        }

    def predict_placement_likelihood(self, data: Dict[str, Any]) -> Dict[str, Any]:
        feats = FeatureExtractor.extract_features(data)
        X_vec = np.array([[
            feats["attendance_rate"], feats["assignment_completion_rate"], feats["quiz_avg_score"],
            feats["coding_problems_solved"], feats["study_hours_weekly"], feats["gpa"],
            feats["ats_score"], feats["xp"]
        ]])
        p_place = round(float(self.models["m_place"].predict(X_vec)[0]), 1) if feats["ats_score"] > 0 or feats["gpa"] > 0 else 0.0
        prob = max(0.0, min(100.0, p_place))

        if prob >= 80:
            top_companies = ["Google", "Amazon", "Microsoft", "Zoho", "Atlassian"]
        elif prob >= 60:
            top_companies = ["Zoho", "TCS Digital", "Infosys Specialty", "Cognizant Elevate"]
        else:
            top_companies = ["TCS Ninja", "Wipro Turbo", "Accenture", "Capgemini"]

        return {
            "probability": prob,
            "topCompanies": top_companies,
            "estimatedSalary": f"₹{round(prob * 0.12 + 4, 1)}L - ₹{round(prob * 0.22 + 8, 1)}L PA" if prob > 0 else "N/A"
        }

    def predict_cgpa(self, data: Dict[str, Any]) -> Dict[str, Any]:
        gpa = float(data.get("currentCGPA") or data.get("gpa") or 0.0)
        feats = FeatureExtractor.extract_features(data)
        X_vec = np.array([[
            feats["attendance_rate"], feats["assignment_completion_rate"], feats["quiz_avg_score"],
            feats["coding_problems_solved"], feats["study_hours_weekly"], gpa,
            feats["ats_score"], feats["xp"]
        ]])
        p_gpa = round(float(self.models["m_gpa"].predict(X_vec)[0]), 2) if gpa > 0 else 0.0
        pred = max(0.0, min(10.0, p_gpa))
        confidence = round(min(98.0, 75.0 + (gpa * 2.2)), 1) if gpa > 0 else 50.0

        return {
            "current": gpa,
            "predicted": pred,
            "confidence": confidence
        }

    def predict_skill_radar(self, data: Dict[str, Any]) -> Dict[str, Any]:
        coding = float(data.get("codingScore") or 70.0)
        ats = float(data.get("atsScore") or 75.0)
        gpa = float(data.get("gpa") or 8.0)
        
        return {
            "radar": {
                "programming": round(min(100.0, coding * 0.9 + 10.0)),
                "communication": round(min(100.0, ats * 0.8 + 15.0)),
                "problemSolving": round(min(100.0, coding * 0.85 + gpa * 2.0)),
                "leadership": round(min(100.0, gpa * 7.5 + 15.0)),
                "aiProjects": round(min(100.0, coding * 0.8 + 10.0)),
                "webProjects": round(min(100.0, coding * 0.95)),
                "cloudCertifications": round(min(100.0, ats * 0.85)),
                "research": round(min(100.0, gpa * 8.0 + 10.0))
            }
        }

    def predict_cognitive_strength(self, data: Dict[str, Any]) -> Dict[str, Any]:
        strong_topics = data.get("completedTopics") or ["React", "Data Structures", "Python"]
        weak_topics = data.get("weakTopics") or ["Dynamic Programming", "Operating Systems", "Computer Networks"]
        return {
            "strong": strong_topics,
            "weak": weak_topics
        }

    def predict_risks(self, data: Dict[str, Any]) -> Dict[str, Any]:
        feats = FeatureExtractor.extract_features(data)
        X_vec = np.array([[
            feats["attendance_rate"], feats["assignment_completion_rate"], feats["quiz_avg_score"],
            feats["coding_problems_solved"], feats["study_hours_weekly"], feats["gpa"],
            feats["ats_score"], feats["xp"]
        ]])

        b_class = int(self.models["m_burnout"].predict(X_vec)[0]) if feats["study_hours_weekly"] > 0 else 0
        burnout_prob = 75 if b_class == 2 else (40 if b_class == 1 else 12)

        bg_class = int(self.models["m_backlog"].predict(X_vec)[0]) if feats["gpa"] > 0 else 0
        backlog_risk = "high" if bg_class == 1 else "low"

        att_shortage = feats["attendance_rate"] > 0 and feats["attendance_rate"] < 75.0
        gpa_drop_risk = "high" if feats["gpa"] > 0 and feats["gpa"] < 6.5 else ("medium" if feats["gpa"] < 7.5 else "low")

        return {
            "backlogRisk": backlog_risk,
            "burnoutProbability": burnout_prob,
            "attendanceShortage": att_shortage,
            "gpaDropRisk": gpa_drop_risk
        }

    def predict_recommendations(self, data: Dict[str, Any]) -> Dict[str, Any]:
        recs = []
        att = float(data.get("attendanceRate") or 85.0)
        coding = float(data.get("codingScore") or 70.0)
        ats = float(data.get("atsScore") or 75.0)
        burnout = float(data.get("burnoutProbability") or 15.0)

        if att < 75.0:
            recs.append(f"⚠️ Your attendance is at {att}%. Attend upcoming scheduled lectures to prevent cutoff shortage warnings.")
        else:
            recs.append("✅ Attendance is in the safe zone above 75%. Keep up the momentum!")

        if coding < 75.0:
            recs.append("💻 Practice 2 Medium difficulty LeetCode problems daily to increase your coding proficiency score.")
        else:
            recs.append("🌟 Excellent coding proficiency! Try tackling System Design and Hard competitive problems.")

        if ats < 80.0:
            recs.append("📄 Update your ATS resume with Docker, Kubernetes, and System Architecture keywords to boost ATS match rate.")

        if burnout > 50.0:
            recs.append("🛋️ High workload detected! Take regular breaks between study sessions to maintain steady cognitive output.")

        return {
            "recommendations": recs
        }

model_suite = MLModelSuite()
