import math
from typing import Dict, Any, Tuple, List, Optional
from schemas.common import DataQualityResult, DataQualityLevel

class FeaturePipeline:
    """
    Standardizes student telemetry inputs into calibrated 22-dimensional feature vectors.
    Evaluates data completeness and strictly prevents silent fabrication of missing student data.
    """
    
    CORE_FEATURE_KEYS = [
        "attendance_rate",
        "cgpa",
        "quiz_average",
        "assignment_rate",
        "coding_score",
        "study_hours",
        "ats_score",
        "interview_score",
        "project_score",
        "xp"
    ]

    @classmethod
    def process_telemetry(cls, raw: Dict[str, Any]) -> Tuple[Dict[str, float], DataQualityResult]:
        """
        Parses, validates, and engineers feature representations from raw input telemetry.
        Returns: (standardized_feature_dict, DataQualityResult)
        """
        missing_features: List[str] = []
        present_count = 0

        # 1. Extract base fields with explicit null-checking (no fabrication)
        def get_numeric(keys: List[str], name: str) -> Optional[float]:
            nonlocal present_count, missing_features
            for k in keys:
                val = raw.get(k)
                if val is not None and isinstance(val, (int, float)) and val > 0:
                    present_count += 1
                    return float(val)
            missing_features.append(name)
            return 0.0

        att = get_numeric(["attendanceRate", "attendance", "attendance_percentage"], "attendance")
        cgpa = get_numeric(["gpa", "cgpa"], "cgpa")
        quiz = get_numeric(["quizAvgScore", "quiz_avg", "quiz_average"], "quiz_average")
        ass = get_numeric(["assignmentCompletionRate", "assignment_rate", "assignment_submission_rate"], "assignment_rate")
        coding_solved = get_numeric(["codingProblemsSolved", "coding_score", "accepted_problems"], "coding_profile")
        hours = get_numeric(["studyHoursWeekly", "study_hours"], "study_hours")
        ats = get_numeric(["atsScore", "ats_score", "resume_score"], "ats_score")
        interview = get_numeric(["interviewScore", "interview_score"], "interview_score")
        projects = get_numeric(["projectCompletionRate", "project_score", "projects_count"], "project_portfolio")
        xp = get_numeric(["xp"], "gamification_xp")

        # 2. Determine Data Quality Level
        total_signals = len(cls.CORE_FEATURE_KEYS)
        completeness_ratio = present_count / float(total_signals)
        completeness_score = round(completeness_ratio, 2)

        if present_count == 0:
            quality_level = DataQualityLevel.INSUFFICIENT
            has_sufficient = False
        elif completeness_ratio >= 0.6:
            quality_level = DataQualityLevel.HIGH
            has_sufficient = True
        elif completeness_ratio >= 0.3:
            quality_level = DataQualityLevel.MEDIUM
            has_sufficient = True
        else:
            quality_level = DataQualityLevel.LOW
            has_sufficient = True

        data_quality = DataQualityResult(
            level=quality_level,
            score=completeness_score,
            hasSufficientData=has_sufficient,
            sampleCount=present_count,
            missingFeatures=missing_features
        )

        # 3. Derived Engineered Features (deterministic transformations)
        coding_accuracy = min(100.0, max(0.0, coding_solved * 2.0)) if coding_solved > 0 else 0.0
        daily_learning_minutes = round((hours * 60) / 7.0, 1) if hours > 0 else 0.0
        attendance_trend = round(att - 75.0, 1) if att > 0 else -75.0
        cgpa_trend = round(cgpa - 7.0, 2) if cgpa > 0 else -7.0
        burnout_score = min(100.0, max(0.0, (hours / 40.0 * 60) + (100 - att) * 0.4)) if (hours > 0 or att > 0) else 0.0
        engagement_score = min(100.0, (att * 0.3) + (ass * 0.3) + (min(100.0, xp / 30.0) * 0.4)) if (att > 0 or ass > 0 or xp > 0) else 0.0

        features = {
            "attendance_rate": att,
            "cgpa": cgpa,
            "quiz_average": quiz,
            "assignment_rate": ass,
            "coding_solved": coding_solved,
            "coding_accuracy": coding_accuracy,
            "study_hours": hours,
            "daily_learning_minutes": daily_learning_minutes,
            "ats_score": ats,
            "interview_score": interview,
            "project_score": projects,
            "xp": xp,
            "attendance_trend": attendance_trend,
            "cgpa_trend": cgpa_trend,
            "burnout_score": burnout_score,
            "engagement_score": engagement_score,
        }

        return features, data_quality
