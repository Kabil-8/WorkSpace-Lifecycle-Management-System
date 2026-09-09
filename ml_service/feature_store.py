import math
from typing import Dict, Any, List

class FeatureStoreEngine:
    """
    Centralized Student Feature Store Engine that generates standardized 22-dimension
    feature vectors from raw student telemetry inputs with data completeness indicators.
    """
    @staticmethod
    def extract_feature_vector(raw: Dict[str, Any]) -> Dict[str, Any]:
        att = float(raw.get("attendanceRate") or raw.get("attendance_percentage") or 0.0)
        hours = float(raw.get("studyHoursWeekly") or raw.get("study_hours") or 0.0)
        ass = float(raw.get("assignmentCompletionRate") or raw.get("assignment_submission_rate") or 0.0)
        quiz = float(raw.get("quizAvgScore") or raw.get("quiz_average") or 0.0)
        solved = float(raw.get("codingProblemsSolved") or raw.get("accepted_problems") or 0)
        gpa = float(raw.get("gpa") or raw.get("cgpa") or 0.0)
        ats = float(raw.get("atsScore") or raw.get("resume_score") or 0.0)
        xp = float(raw.get("xp") or 0.0)
        interview = float(raw.get("interviewScore") or raw.get("interview_score") or 0.0)
        projects = float(raw.get("projectCompletionRate") or raw.get("project_score") or 0.0)

        # Count active data signals
        active_signals = [v for v in [att, hours, ass, quiz, solved, gpa, ats, xp, interview, projects] if v > 0]
        sample_count = len(active_signals)
        has_data = sample_count > 0
        completeness_pct = round((sample_count / 10.0) * 100, 1)

        # Derived engineered features
        coding_accuracy = min(100.0, max(50.0, 70.0 + (solved * 0.15))) if solved > 0 else 0.0
        compiler_success_rate = min(100.0, max(40.0, (solved / max(1.0, solved * 1.3)) * 100.0)) if solved > 0 else 0.0
        course_completion = float(raw.get("courseCompletionRate") or raw.get("course_completion") or (min(100.0, ass * 0.8 + quiz * 0.2) if (ass > 0 or quiz > 0) else 0.0))
        video_completion = float(raw.get("videoCompletion") or min(100.0, course_completion * 0.9))
        notes_completion = float(raw.get("notesCompletion") or (min(100.0, hours * 3.5) if hours > 0 else 0.0))
        revision_frequency = min(10.0, round(hours / 2.5, 1)) if hours > 0 else 0.0

        communication_score = min(100.0, ats * 0.8 + 15.0) if ats > 0 else 0.0
        leadership_score = min(100.0, gpa * 7.5 + 15.0) if gpa > 0 else 0.0
        hackathon_score = min(100.0, solved * 0.8 + xp * 0.01) if (solved > 0 or xp > 0) else 0.0
        research_score = min(100.0, gpa * 8.0 + 10.0) if gpa > 0 else 0.0
        consistency_score = min(100.0, (hours / 20.0 * 50.0) + (att * 0.5)) if (hours > 0 or att > 0) else 0.0

        workload_risk_score = min(100.0, max(0.0, (hours / 40.0 * 60) + (100 - att) * 0.4)) if (hours > 0 or att > 0) else 0.0
        engagement_score = min(100.0, (att * 0.3) + (ass * 0.3) + (min(100.0, xp / 30.0) * 0.4)) if (att > 0 or ass > 0 or xp > 0) else 0.0

        return {
            "hasData": has_data,
            "sampleCount": sample_count,
            "dataCompleteness": completeness_pct,
            "features": {
                "attendance_percentage": round(att, 1),
                "study_hours": round(hours, 1),
                "assignment_submission_rate": round(ass, 1),
                "quiz_average": round(quiz, 1),
                "coding_accuracy": round(coding_accuracy, 1),
                "compiler_success_rate": round(compiler_success_rate, 1),
                "course_completion": round(course_completion, 1),
                "video_completion": round(video_completion, 1),
                "notes_completion": round(notes_completion, 1),
                "revision_frequency": round(revision_frequency, 1),
                "communication_score": round(communication_score, 1),
                "leadership_score": round(leadership_score, 1),
                "project_score": round(projects, 1),
                "cgpa": round(gpa, 2),
                "placement_score": round(min(100.0, ats * 0.5 + gpa * 5.0), 1) if (ats > 0 or gpa > 0) else 0.0,
                "interview_score": round(interview, 1),
                "resume_score": round(ats, 1),
                "hackathon_score": round(hackathon_score, 1),
                "research_score": round(research_score, 1),
                "consistency_score": round(consistency_score, 1),
                "workload_risk_score": round(workload_risk_score, 1),
                "engagement_score": round(engagement_score, 1)
            }
        }

feature_store_engine = FeatureStoreEngine()
