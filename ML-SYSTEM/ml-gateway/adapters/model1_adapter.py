"""
Model 1 Adapter (Skill Gap Prediction Engine).
Translates CommonStudentInput into Model 1 payload and normalizes response.
"""

import os
import sys
import logging
from typing import Any, Dict, List, Optional
import requests

from config import (
    MODEL1_URL,
    MODEL1_DIR,
    SERVICE_TIMEOUT_SECONDS,
    MODEL_EXECUTION_MODE,
)
from schemas.contracts import CommonStudentInput
from services.errors import ModelUnavailableException, ModelInferenceException, SchemaMismatchException

logger = logging.getLogger(__name__)


class Model1GatewayAdapter:
    """Adapter bridging Gateway to Model 1 (Skill-Gap Prediction Engine)."""

    @classmethod
    def is_available(cls) -> bool:
        """Checks if Model 1 can be invoked (either via HTTP or direct module)."""
        try:
            resp = requests.get(f"{MODEL1_URL.rstrip('/')}/api/ml/skill-gap/health", timeout=1.0)
            if resp.status_code == 200:
                return True
        except Exception:
            pass

        if MODEL_EXECUTION_MODE in ("hybrid", "direct"):
            try:
                from adapters.isolation import isolate_model_environment
                with isolate_model_environment(MODEL1_DIR):
                    from src.predict import predict_skill_gaps
                    return True
            except Exception:
                return False
        return False

    @classmethod
    def to_model_input(cls, student: CommonStudentInput) -> Dict[str, Any]:
        """Transforms CommonStudentInput to Model 1 request contract."""
        completed_skills = []
        assessed_questions = []

        # Map declared skills
        for sk in student.skills:
            if sk.level >= 0.80:
                completed_skills.append(sk.skill.lower().replace(" ", "_"))
            else:
                # Synthesize attempt representation if no explicit assessment history
                diff = "EASY" if sk.level < 0.40 else ("MEDIUM" if sk.level < 0.70 else "HARD")
                assessed_questions.append({
                    "skill": sk.skill.lower().replace(" ", "_"),
                    "difficulty": diff,
                    "correct": sk.level >= 0.50,
                    "time_seconds": 25.0,
                    "attempt_number": 1,
                })

        # Add explicit assessment history if present
        assessed_skills_from_history = []
        for item in student.assessment_history:
            sk_name = item.get("skill") or item.get("skill_id")
            if not sk_name:
                continue

            clean_sk = str(sk_name).strip()
            if clean_sk not in assessed_skills_from_history:
                assessed_skills_from_history.append(clean_sk)

            diff_val = item.get("difficulty")
            diff_str = str(diff_val).upper() if diff_val else "MEDIUM"

            if "correct" in item and item["correct"] is not None:
                is_correct = bool(item["correct"])
            elif "isCorrect" in item and item["isCorrect"] is not None:
                is_correct = bool(item["isCorrect"])
            elif "score" in item and item["score"] is not None:
                try:
                    is_correct = float(item["score"]) >= 0.5
                except (ValueError, TypeError):
                    is_correct = False
            else:
                is_correct = False

            time_val = item.get("time_seconds")
            q_entry = {
                "question_id": item.get("question_id"),
                "skill": clean_sk,
                "difficulty": diff_str,
                "correct": is_correct,
                "attempt_number": int(item.get("attempt_number", 1)),
            }
            if time_val is not None:
                try:
                    q_entry["time_seconds"] = float(time_val)
                except (ValueError, TypeError):
                    pass

            assessed_questions.append(q_entry)

        # Determine required_skills: preserve authentic declared or assessed skills
        if student.skills:
            required_skills = [s.skill.lower().replace(" ", "_") for s in student.skills]
        elif assessed_skills_from_history:
            required_skills = assessed_skills_from_history
        else:
            required_skills = None

        return {
            "student_id": student.student_id,
            "goal": student.goal,
            "completed_skills": completed_skills,
            "required_skills": required_skills,
            "assessment": {
                "assessment_id": f"ASSESS_{student.student_id}",
                "questions": assessed_questions,
            },
            "previous_performance": student.learning_history,
        }

    @classmethod
    def predict(cls, student: CommonStudentInput) -> Dict[str, Any]:
        """Calls Model 1 service or fallback engine."""
        payload = cls.to_model_input(student)

        # 1. Try HTTP microservice if in http or hybrid mode
        exec_mode = os.environ.get("MODEL_EXECUTION_MODE", "hybrid")
        if exec_mode in ("http", "hybrid"):
            try:
                url = f"{MODEL1_URL.rstrip('/')}/api/ml/skill-gap/predict"
                resp = requests.post(url, json=payload, timeout=SERVICE_TIMEOUT_SECONDS)
                if resp.status_code == 200:
                    return cls.normalize_response(resp.json())
                elif resp.status_code >= 500:
                    raise ModelInferenceException("model1", f"Model 1 server error: {resp.text}")
            except (requests.ConnectionError, requests.Timeout) as exc:
                if exec_mode == "http":
                    raise ModelUnavailableException("model1", f"Cannot connect to Model 1 service at {MODEL1_URL}: {exc}")
                logger.warning(f"HTTP call to Model 1 failed, trying direct module: {exc}")

        # 2. Try direct module in hybrid or direct mode
        if exec_mode in ("hybrid", "direct"):
            try:
                if str(MODEL1_DIR) not in sys.path:
                    sys.path.insert(0, str(MODEL1_DIR))
                from src.predict import predict_skill_gaps
                raw_out = predict_skill_gaps(payload)
                return cls.normalize_response(raw_out)
            except Exception as e:
                raise ModelInferenceException("model1", f"Model 1 in-process execution failed: {e}")

        raise ModelUnavailableException("model1", f"Model 1 service is unavailable at {MODEL1_URL}")

    @classmethod
    def normalize_response(cls, raw: Dict[str, Any]) -> Dict[str, Any]:
        """Validates and normalizes Model 1 response."""
        if not isinstance(raw, dict):
            raise SchemaMismatchException("model1", "Model 1 did not return a JSON dictionary.")

        return {
            "status": "available",
            "student_id": raw.get("student_id", ""),
            "goal": raw.get("goal"),
            "overall_skill_score": float(raw.get("overall_skill_score", 0.50)),
            "skills": raw.get("skills", []),
            "strong_skills": raw.get("strong_skills", []),
            "developing_skills": raw.get("developing_skills", []),
            "skill_gaps": raw.get("skill_gaps", []),
            "learning_priorities": raw.get("learning_priorities", []),
            "model_version": raw.get("model_version", "skill-gap-model-v1"),
        }
