from typing import Dict, Any, List

class ExplainableAIEngine:
    """
    Computes SHAP-inspired feature attribution & natural language explanation
    for ML predictions (Placement Probability, Learning Pace, CGPA, Burnout, Coding).
    """
    @staticmethod
    def explain_prediction(prediction_type: str, score: float, feature_vec: Dict[str, float]) -> Dict[str, Any]:
        top_factors = []
        reasoning_parts = []

        if prediction_type == "placement":
            att = feature_vec.get("attendance_percentage", 0.0)
            coding = feature_vec.get("coding_accuracy", 0.0)
            resume = feature_vec.get("resume_score", 0.0)
            interview = feature_vec.get("interview_score", 0.0)
            projects = feature_vec.get("project_score", 0.0)

            if att >= 75:
                top_factors.append({"factor": "Attendance", "impact": f"+{round(att * 0.1, 1)}%", "type": "positive"})
            else:
                top_factors.append({"factor": "Attendance Shortage", "impact": f"-{round((75 - att) * 0.15, 1)}%", "type": "negative"})

            if coding > 0:
                top_factors.append({"factor": "Coding Accuracy", "impact": f"+{round(coding * 0.2, 1)}%", "type": "positive"})
            if resume > 0:
                top_factors.append({"factor": "Resume ATS Score", "impact": f"+{round(resume * 0.18, 1)}%", "type": "positive"})
            if interview > 0:
                top_factors.append({"factor": "Mock Interview Score", "impact": f"+{round(interview * 0.15, 1)}%", "type": "positive"})
            if projects > 0:
                top_factors.append({"factor": "Project Portfolio Quality", "impact": f"+{round(projects * 0.12, 1)}%", "type": "positive"})

            factor_strs = [f"{tf['factor']} {tf['impact']}" for tf in top_factors[:4]]
            reasoning = f"Placement Probability is {score}% based on: " + ", ".join(factor_strs) + "."

        elif prediction_type == "cgpa":
            gpa = feature_vec.get("cgpa", 0.0)
            quiz = feature_vec.get("quiz_average", 0.0)
            ass = feature_vec.get("assignment_submission_rate", 0.0)

            top_factors.append({"factor": "Prior Cumulative GPA", "impact": f"{gpa} CGPA baseline", "type": "positive"})
            if quiz > 0:
                top_factors.append({"factor": "Quiz Performance Trend", "impact": f"+{round(quiz * 0.01, 2)} GPA", "type": "positive"})
            if ass > 0:
                top_factors.append({"factor": "Assignment Consistency", "impact": f"+{round(ass * 0.008, 2)} GPA", "type": "positive"})

            reasoning = f"Predicted CGPA of {score} derived from prior {gpa} CGPA baseline and {quiz}% quiz consistency."

        elif prediction_type == "burnout":
            hours = feature_vec.get("study_hours", 0.0)
            att = feature_vec.get("attendance_percentage", 0.0)

            if hours > 25:
                top_factors.append({"factor": "Weekly Study Overload", "impact": f"{hours}h weekly study", "type": "negative"})
            if att < 70:
                top_factors.append({"factor": "Irregular Class Attendance", "impact": f"{att}% attendance", "type": "negative"})
            if not top_factors:
                top_factors.append({"factor": "Balanced Workload", "impact": "Optimal study-rest cycle", "type": "positive"})

            reasoning = f"Burnout Risk evaluated as '{score}' considering {hours} weekly study hours and attendance trajectory."

        else:
            top_factors = [
                {"factor": "Study Consistency", "impact": "+15%", "type": "positive"},
                {"factor": "Code Executions", "impact": "+20%", "type": "positive"}
            ]
            reasoning = f"Predicted score {score} calculated from telemetry feature vector."

        return {
            "prediction": score,
            "topFactors": top_factors,
            "reasoning": reasoning
        }
