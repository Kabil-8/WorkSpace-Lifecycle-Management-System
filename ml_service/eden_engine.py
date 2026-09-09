import math
from typing import Dict, List, Any, Optional

class EdenEvolutionEngine:
    """
    Computes EDEN Evolution Stage based on user XP and achievements:
    Seed (0-500 XP) -> Spark (501-1500 XP) -> Assistant (1501-3500 XP) ->
    Mentor (3501-7000 XP) -> Guardian (7001-12000 XP) -> Career Guide (12001+ XP)
    """

    STAGES = [
        {"stage": "Seed", "minXp": 0, "maxXp": 500, "icon": "🌱", "title": "Academic Seed", "perk": "Basic Q&A & Timetable tracking"},
        {"stage": "Spark", "minXp": 501, "maxXp": 1500, "icon": "⚡", "title": "Knowledge Spark", "perk": "Attendance prediction & Study planner"},
        {"stage": "Assistant", "minXp": 1501, "maxXp": 3500, "icon": "🤖", "title": "AI Copilot Assistant", "perk": "Code debugging & Resume ATS analysis"},
        {"stage": "Mentor", "minXp": 3501, "maxXp": 7000, "icon": "🧠", "title": "Academic Mentor", "perk": "Predictive GPA & Backlog risk alerts"},
        {"stage": "Guardian", "minXp": 7001, "maxXp": 12000, "icon": "🛡️", "title": "Institutional Guardian", "perk": "Research paper synthesis & Interview prep"},
        {"stage": "Career Guide", "minXp": 12001, "maxXp": 99999, "icon": "👑", "title": "Career Guide", "perk": "Placement probability & Full Digital Twin"},
    ]

    @classmethod
    def get_stage(cls, xp: int) -> Dict[str, Any]:
        for s in cls.STAGES:
            if s["minXp"] <= xp <= s["maxXp"]:
                progress_pct = min(100, round(((xp - s["minXp"]) / max(1, s["maxXp"] - s["minXp"])) * 100))
                return {
                    "stage": s["stage"],
                    "title": s["title"],
                    "icon": s["icon"],
                    "perk": s["perk"],
                    "xp": xp,
                    "nextStageXp": s["maxXp"] + 1 if s["stage"] != "Career Guide" else s["maxXp"],
                    "progressPercentage": progress_pct
                }
        return cls.STAGES[-1]


class DigitalTwinEngine:
    """
    Computes 360-degree Student Digital Twin metrics & predictive scores
    """

    @staticmethod
    def compute_digital_twin(
        attendance_rate: float = 0.0,
        assignment_completion_rate: float = 0.0,
        quiz_avg_score: float = 0.0,
        coding_problems_solved: int = 0,
        study_hours_weekly: float = 0.0,
        gpa: float = 0.0,
        ats_score: int = 0,
        xp: int = 0,
        department: str = "Computer Science",
        completed_topics: Optional[List[str]] = None,
        weak_topics: Optional[List[str]] = None
    ) -> Dict[str, Any]:

        # 1. Learning Score (0-100)
        learning_score = round(min(100, (gpa / 10.0 * 40) + (quiz_avg_score * 0.4) + (assignment_completion_rate * 0.2)))

        # 2. Productivity Score (0-100)
        productivity_score = round(min(100, (min(40, study_hours_weekly / 25.0 * 40)) + (assignment_completion_rate * 0.4) + (min(20, coding_problems_solved * 2 * 0.2))))

        # 3. Focus Score (0-100)
        focus_score = round(min(100, (attendance_rate * 0.5) + (min(50, study_hours_weekly / 20.0 * 50))))

        # 4. Growth Score (0-100)
        growth_score = round(min(100, (xp / 10000.0 * 60) + (min(40, coding_problems_solved * 1.5 * 0.4))))

        # 5. Skill Score (0-100)
        skill_score = round(min(100, (ats_score * 0.5) + (gpa * 5.0)))

        # Predictive Outcomes
        predicted_gpa = round(min(10.0, max(0.0, gpa + (learning_score - 50) * 0.01)), 2) if gpa > 0 else 0.0
        placement_readiness_pct = round(min(100, (ats_score * 0.4) + (skill_score * 0.3) + (min(30, coding_problems_solved * 0.3))))
        
        if attendance_rate == 0 and gpa == 0:
            backlog_risk = "Safe"
        else:
            backlog_risk = "Low" if attendance_rate >= 75 and gpa >= 7.0 else ("Moderate" if attendance_rate >= 65 else "High")
            
        evolution = EdenEvolutionEngine.get_stage(xp)

        # Dynamic topic extraction
        strong = completed_topics if (completed_topics and len(completed_topics) > 0) else []
        weak = weak_topics if (weak_topics and len(weak_topics) > 0) else (
            [f"{department} Core Concepts", "Algorithms & Data Structures", "Database Systems"] if (gpa > 0 or xp > 0 or coding_problems_solved > 0) else []
        )

        return {
            "scores": {
                "learningScore": learning_score,
                "productivityScore": productivity_score,
                "focusScore": focus_score,
                "growthScore": growth_score,
                "skillScore": skill_score,
            },
            "predictions": {
                "predictedSemesterGpa": predicted_gpa,
                "placementReadinessPct": placement_readiness_pct,
                "backlogRisk": backlog_risk,
                "estimatedSalaryRange": f"₹{round(placement_readiness_pct * 0.12 + 4, 1)}L - ₹{round(placement_readiness_pct * 0.22 + 8, 1)}L PA" if placement_readiness_pct > 0 else "N/A",
            },
            "strongTopics": strong,
            "weakTopics": weak,
            "evolution": evolution,
        }


class AttendanceIntelligence:
    """
    Computes exact attendance math:
    "If you miss tomorrow's class your attendance becomes X%"
    """

    @staticmethod
    def calculate_attendance_math(
        present_classes: int,
        total_classes: int,
        upcoming_classes_to_miss: int = 1
    ) -> Dict[str, Any]:

        current_pct = round((present_classes / max(1, total_classes)) * 100, 1)

        # Scenario 1: Miss upcoming class
        new_total_if_miss = total_classes + upcoming_classes_to_miss
        pct_if_miss = round((present_classes / max(1, new_total_if_miss)) * 100, 1)

        # Scenario 2: Attend upcoming class
        new_present_if_attend = present_classes + 1
        new_total_if_attend = total_classes + 1
        pct_if_attend = round((new_present_if_attend / max(1, new_total_if_attend)) * 100, 1)

        # Classes needed for 75%
        required_75_classes = 0
        if current_pct < 75.0:
            # (present + x) / (total + x) >= 0.75 => x >= (0.75 * total - present) / 0.25
            needed = math.ceil((0.75 * total_classes - present_classes) / 0.25)
            required_75_classes = max(0, needed)

        # Safe classes to skip
        safe_to_skip = 0
        if current_pct > 75.0:
            # (present) / (total + y) >= 0.75 => y <= (present - 0.75 * total) / 0.75
            skips = math.floor((present_classes - 0.75 * total_classes) / 0.75)
            safe_to_skip = max(0, skips)

        risk_level = "Safe" if pct_if_miss >= 75.0 else ("Warning" if pct_if_miss >= 70.0 else "Critical")

        return {
            "currentAttendanceRate": current_pct,
            "ifMissTomorrowPct": pct_if_miss,
            "ifAttendTomorrowPct": pct_if_attend,
            "classesNeededFor75Pct": required_75_classes,
            "safeClassesToSkip": safe_to_skip,
            "riskLevel": risk_level,
            "insightMessage": f"If you miss tomorrow's class your attendance becomes {pct_if_miss}%. "
                              f"{'You are currently in the safe zone!' if pct_if_miss >= 75 else f'You will drop below the 75% eligibility cutoff! You need to attend {required_75_classes} consecutive classes to recover.'}"
        }


class SmartStudyPlanner:
    """
    Generates dynamic daily & weekly study timetables
    """

    @staticmethod
    def generate_timetable(target_role: str, weak_subjects: List[str], gpa: float) -> Dict[str, Any]:
        weak_str = ", ".join(weak_subjects) if weak_subjects else "Data Structures & Algorithms"

        daily_schedule = [
            {"time": "08:00 AM - 09:00 AM", "task": f"Deep Dive: {weak_str}", "category": "Academic", "priority": "High"},
            {"time": "09:15 AM - 11:30 AM", "task": "Core University Lectures", "category": "College", "priority": "Mandatory"},
            {"time": "01:30 PM - 03:00 PM", "task": f"Practical Coding & Project: {target_role} Stack", "category": "Skill", "priority": "High"},
            {"time": "04:30 PM - 05:30 PM", "task": "LeetCode / Algorithmic Practice (2 Problems)", "category": "Coding", "priority": "Medium"},
            {"time": "07:00 PM - 08:00 PM", "task": "Revision & Quiz Readiness Review", "category": "Revision", "priority": "Medium"},
            {"time": "09:00 PM - 09:30 PM", "task": "EDEN AI Reflection & Daily Progress Check", "category": "Productivity", "priority": "Low"},
        ]

        weekly_milestones = [
            {"day": "Monday", "focus": "Data Structures (Trees & Graphs)", "targetHours": 3.5},
            {"day": "Tuesday", "focus": f"{target_role} Project Build", "targetHours": 4.0},
            {"day": "Wednesday", "focus": "Database Systems & System Design", "targetHours": 3.0},
            {"day": "Thursday", "focus": "Resume ATS Keyword Polish & LeetCode", "targetHours": 3.5},
            {"day": "Friday", "focus": "Mock Interview & Speech Prep", "targetHours": 3.0},
            {"day": "Saturday", "focus": "Hackathon / Portfolio Development", "targetHours": 5.0},
            {"day": "Sunday", "focus": "Weekly Revision & EDEN Evolution Check", "targetHours": 2.5},
        ]

        return {
            "dailySchedule": daily_schedule,
            "weeklyMilestones": weekly_milestones,
            "recommendedWeeklyStudyHours": 24.5,
            "aiAdjustedNote": f"Schedule automatically calibrated for {target_role} track with focus on improving {weak_str}."
        }
