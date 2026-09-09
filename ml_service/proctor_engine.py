import math
from datetime import datetime
from typing import Dict, Any, List, Optional

class ProctorRiskEngine:
    """
    Live Examination Integrity & Telemetry Risk Engine.
    Fuses MediaPipe eye gaze, head pose rotation, face count presence, browser tab switches,
    and audio detection into an automated integrity score and chronological event timeline.
    Scientifically sound: Flags anomalies for human proctor review rather than asserting cheating.
    """
    @staticmethod
    def evaluate_live_risk(
        eye_focus_score: float = 95.0,
        head_yaw: float = 0.0,
        head_pitch: float = 0.0,
        face_count: int = 1,
        browser_violations: int = 0,
        audio_detected: bool = False,
        previous_warnings: int = 0
    ) -> Dict[str, Any]:
        base_score = 100.0
        events: List[Dict[str, Any]] = []
        now_str = datetime.utcnow().isoformat() + "Z"

        # 1. Eye Focus Assessment
        if eye_focus_score < 50.0:
            deduct = (50.0 - eye_focus_score) * 0.4
            base_score -= deduct
            events.append({
                "timestamp": now_str,
                "event": "GAZE_AWAY",
                "severity": "HIGH",
                "description": f"Significant gaze deviation detected (Focus score: {round(eye_focus_score, 1)}%)."
            })
        elif eye_focus_score < 75.0:
            deduct = (75.0 - eye_focus_score) * 0.2
            base_score -= deduct
            events.append({
                "timestamp": now_str,
                "event": "GAZE_DRIFT",
                "severity": "LOW",
                "description": f"Minor eye gaze drift observed (Focus score: {round(eye_focus_score, 1)}%)."
            })

        # 2. Head Pose Rotation (Yaw > 25° or Pitch > 20°)
        abs_yaw = abs(head_yaw)
        abs_pitch = abs(head_pitch)
        if abs_yaw > 25.0:
            deduct = min(25.0, (abs_yaw - 25.0) * 0.8)
            base_score -= deduct
            events.append({
                "timestamp": now_str,
                "event": "HEAD_ROTATION_YAW",
                "severity": "MEDIUM",
                "description": f"Head turned horizontally beyond normal threshold ({round(abs_yaw, 1)}°)."
            })
        if abs_pitch > 20.0:
            deduct = min(20.0, (abs_pitch - 20.0) * 0.6)
            base_score -= deduct
            events.append({
                "timestamp": now_str,
                "event": "HEAD_ROTATION_PITCH",
                "severity": "MEDIUM",
                "description": f"Head tilted vertically beyond threshold ({round(abs_pitch, 1)}°)."
            })

        # 3. Face Count Verification
        if face_count == 0:
            base_score -= 25.0
            events.append({
                "timestamp": now_str,
                "event": "NO_FACE_DETECTED",
                "severity": "HIGH",
                "description": "Candidate not detected within primary camera frame."
            })
        elif face_count > 1:
            base_score -= 35.0
            events.append({
                "timestamp": now_str,
                "event": "MULTIPLE_FACES_DETECTED",
                "severity": "HIGH",
                "description": f"Multiple faces ({face_count}) identified in proctoring stream."
            })

        # 4. Browser Window Violations
        if browser_violations > 0:
            base_score -= (browser_violations * 10.0)
            events.append({
                "timestamp": now_str,
                "event": "BROWSER_TAB_SWITCH",
                "severity": "HIGH" if browser_violations > 2 else "MEDIUM",
                "description": f"{browser_violations} unauthorized browser window blur/tab switch event(s) recorded."
            })

        # 5. Audio Detection
        if audio_detected:
            base_score -= 12.0
            events.append({
                "timestamp": now_str,
                "event": "AUDIO_VOICE_DETECTED",
                "severity": "MEDIUM",
                "description": "Acoustic activity detected in candidate environment during exam session."
            })

        # 6. Previous Warnings
        if previous_warnings > 0:
            base_score -= (previous_warnings * 8.0)

        integrity_score = max(0, min(100, int(base_score)))

        # Risk Classification
        if integrity_score >= 81:
            risk_category = "Safe"
            requires_review = False
        elif integrity_score >= 61:
            risk_category = "Low Risk"
            requires_review = False
        elif integrity_score >= 41:
            risk_category = "Moderate Risk"
            requires_review = True
        elif integrity_score >= 21:
            risk_category = "High Risk"
            requires_review = True
        else:
            risk_category = "Critical Risk"
            requires_review = True

        return {
            "integrityScore": integrity_score,
            "riskCategory": risk_category,
            "requiresProctorReview": requires_review,
            "eventTimeline": events,
            "telemetrySummary": {
                "eyeFocusScore": eye_focus_score,
                "headYaw": head_yaw,
                "headPitch": head_pitch,
                "faceCount": face_count,
                "browserViolations": browser_violations,
                "audioDetected": audio_detected,
                "previousWarnings": previous_warnings
            },
            "scientificDisclaimer": "Integrity indicators reflect automated algorithmic anomaly flags for human proctor review; they do not constitute definitive proof of academic dishonesty."
        }


class CheatingPredictor:
    """
    Historical Risk Pattern Predictor.
    Analyzes historical anomaly frequencies across prior examination sessions.
    """
    @staticmethod
    def predict_future_cheating(
        past_violations_count: int = 0,
        avg_eye_focus: float = 90.0,
        tab_switches_per_exam: float = 0.5,
        past_warning_history: int = 0
    ) -> Dict[str, Any]:
        risk_score = min(100.0, max(5.0, (
            past_violations_count * 15.0 +
            (100.0 - avg_eye_focus) * 0.4 +
            tab_switches_per_exam * 12.0 +
            past_warning_history * 10.0
        )))

        risk_category = "High Risk Profile" if risk_score >= 65 else ("Moderate Risk Profile" if risk_score >= 40 else "Safe Profile")

        return {
            "riskScore": round(risk_score, 1),
            "riskCategory": risk_category,
            "recommendation": "Enhanced proctoring vigilance recommended" if risk_score >= 40 else "Standard examination protocols apply",
            "historicalTelemetry": {
                "pastViolationsCount": past_violations_count,
                "avgEyeFocus": avg_eye_focus,
                "tabSwitchesPerExam": tab_switches_per_exam,
                "pastWarningHistory": past_warning_history
            },
            "scientificDisclaimer": "Historical risk profiles are advisory statistical heuristics intended solely for proctoring resource allocation."
        }
