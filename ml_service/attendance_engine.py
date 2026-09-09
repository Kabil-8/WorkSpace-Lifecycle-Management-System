import math
from typing import Dict, Any

class AttendancePredictor:
    @staticmethod
    def predict_attendance(present_classes: int = 0, total_classes: int = 0, target_goal: float = 90.0) -> Dict[str, Any]:
        """
        ML Forecasting model calculating attendance trends, eligibility, and required consecutive classes.
        """
        if total_classes == 0:
            current_pct = 0.0
            forecasted_pct = 0.0
            required_classes = 0
            is_eligible = False
            req_for_75 = 0
            risk_level = "No Logs Yet"
        else:
            current_pct = round((present_classes / total_classes) * 100.0, 1)
            future_present = present_classes + 17
            future_total = total_classes + 20
            forecasted_pct = round((future_present / future_total) * 100.0, 1)

            if current_pct >= target_goal:
                required_classes = 0
            else:
                num = (target_goal * total_classes) - (100.0 * present_classes)
                den = 100.0 - target_goal
                required_classes = max(0, math.ceil(num / den)) if den > 0 else 0

            is_eligible = current_pct >= 75.0
            req_for_75 = 0 if is_eligible else math.ceil((75.0 * total_classes - 100.0 * present_classes) / 25.0)
            risk_level = "Safe" if current_pct >= 85 else "Low Risk" if current_pct >= 75 else "High Risk (Shortage Alert)"

        return {
            "currentPercentage": current_pct,
            "forecastedPercentage": forecasted_pct,
            "targetGoal": target_goal,
            "requiredClassesForGoal": required_classes,
            "isEligibleForExams": is_eligible,
            "requiredClassesFor75": max(0, req_for_75),
            "riskLevel": risk_level,
        }

    @staticmethod
    def answer_eden_attendance_query(query: str, present_classes: int = 0, total_classes: int = 0, target_goal: float = 90.0) -> Dict[str, Any]:
        """
        EDEN AI Attendance Copilot answering natural language queries dynamically per student.
        """
        query_lower = query.lower()

        if total_classes == 0:
            return {
                "answer": f"🎯 You currently have 0 logged attendance classes. Attend upcoming scheduled sessions to build your attendance record toward your {target_goal}% target goal.",
                "currentPercentage": 0.0,
                "percentageIfAbsent": 0.0,
                "recommended": False
            }

        current_pct = round((present_classes / total_classes) * 100.0, 1)

        if "miss" in query_lower or "absent" in query_lower or "tomorrow" in query_lower:
            new_total = total_classes + 1
            new_pct = round((present_classes / new_total) * 100.0, 1)
            drop = round(current_pct - new_pct, 1)

            if new_pct < 75.0:
                rec = f"❌ Highly Not Recommended! If you miss tomorrow's class, your attendance will drop from {current_pct}% to {new_pct}%, breaching the 75% semester eligibility cutoff."
            elif new_pct < 80.0:
                rec = f"⚠️ Not Recommended. Missing tomorrow drops your attendance from {current_pct}% to {new_pct}%. You will enter the caution zone."
            else:
                rec = f"✅ Safe to miss if necessary. If absent tomorrow, your attendance drops by {drop}% (from {current_pct}% to {new_pct}%). You remain above the 75% requirement."

            return {
                "answer": rec,
                "currentPercentage": current_pct,
                "percentageIfAbsent": new_pct,
                "recommended": new_pct >= 80.0
            }

        elif "how many" in query_lower or "target" in query_lower or "goal" in query_lower or "reach" in query_lower:
            num = (target_goal * total_classes) - (100.0 * present_classes)
            den = 100.0 - target_goal
            required = max(0, math.ceil(num / den)) if den > 0 else 0

            return {
                "answer": f"🎯 To reach your target of {target_goal}%, you need to attend the next {required} consecutive classes without any absences.",
                "currentPercentage": current_pct,
                "targetGoal": target_goal,
                "requiredClasses": required
            }

        else:
            return {
                "answer": f"📊 EDEN Intelligence: Your current overall attendance is {current_pct}% ({present_classes}/{total_classes} classes). Maintain above 75% for exam eligibility.",
                "currentPercentage": current_pct
            }
