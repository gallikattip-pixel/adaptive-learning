"""
Model 2 Adapter (Mastery + Adaptive Difficulty).
Translates CommonStudentInput into Model 2 payload and normalizes response.
"""

import os
import sys
import logging
from typing import Any, Dict, List, Optional
import requests

from config import (
    MODEL2_URL,
    MODEL2_DIR,
    SERVICE_TIMEOUT_SECONDS,
    MODEL_EXECUTION_MODE,
)
from schemas.contracts import CommonStudentInput
from services.errors import ModelUnavailableException, ModelInferenceException, SchemaMismatchException

logger = logging.getLogger(__name__)


class Model2GatewayAdapter:
    """Adapter bridging Gateway to Model 2 (Mastery + Adaptive Difficulty)."""

    @classmethod
    def is_available(cls) -> bool:
        """Checks if Model 2 can be invoked (either via HTTP or direct module)."""
        try:
            resp = requests.get(f"{MODEL2_URL.rstrip('/')}/api/ml/mastery/health", timeout=1.0)
            if resp.status_code == 200:
                return True
        except Exception:
            pass

        if MODEL_EXECUTION_MODE in ("hybrid", "direct"):
            try:
                from adapters.isolation import isolate_model_environment
                with isolate_model_environment(MODEL2_DIR):
                    from src.predict import predict_mastery
                    return True
            except Exception:
                return False
        return False

    @classmethod
    def to_model_input(
        cls,
        student: CommonStudentInput,
        model1_output: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Transforms CommonStudentInput (and optional Model 1 upstream output) to Model 2 input.
        """
        skills_list = []

        # 1. Use Model 1 output if available
        if model1_output and "skills" in model1_output:
            for sk in model1_output["skills"]:
                sname = sk.get("skill", "")
                if sname:
                    score = float(sk.get("score", 0.50))
                    skills_list.append({"skill": sname, "ability_score": score})

        # 2. Otherwise use student's declared skills
        if not skills_list:
            for sk in student.skills:
                if sk.skill:
                    skills_list.append({"skill": sk.skill, "ability_score": sk.level})

        # 3. If still empty, derive target skills from assessment history without hardcoded generic fallbacks
        if not skills_list:
            seen_skills = set()
            for item in student.assessment_history:
                sk = item.get("skill") or item.get("skill_id")
                if sk and str(sk).strip() and str(sk).strip() not in seen_skills:
                    s_str = str(sk).strip()
                    seen_skills.add(s_str)
                    score_val = item.get("attempt_score", item.get("score", 0.50))
                    try:
                        score_num = float(score_val)
                        if score_num > 1.0:
                            score_num = score_num / 100.0
                        score_num = max(0.0, min(1.0, score_num))
                    except (ValueError, TypeError):
                        score_num = 0.50
                    skills_list.append({"skill": s_str, "ability_score": score_num})

        # Extract learning attempts from learning_history or assessment_history
        attempts = []
        for h in student.learning_history:
            sk = h.get("skill") or h.get("skill_id")
            if not sk:
                continue
            diff = str(h.get("difficulty", "MEDIUM")).upper()
            correct = bool(h.get("correct", False))
            time_val = h.get("time_seconds")
            time_sec = None
            if time_val is not None:
                try:
                    time_sec = float(time_val)
                except (ValueError, TypeError):
                    time_sec = None
            attempts.append({
                "skill": str(sk).strip(),
                "correct": correct,
                "difficulty": diff,
                "time_seconds": time_sec,
                "attempt_number": int(h.get("attempt_number", 1)),
            })

        for a in student.assessment_history:
            sk = a.get("skill") or a.get("skill_id")
            if not sk:
                continue

            diff = str(a.get("difficulty", "MEDIUM")).upper()
            if "correct" in a and a["correct"] is not None:
                correct = bool(a["correct"])
            elif "isCorrect" in a and a["isCorrect"] is not None:
                correct = bool(a["isCorrect"])
            elif "score" in a and a["score"] is not None:
                try:
                    correct = float(a["score"]) >= 0.5
                except (ValueError, TypeError):
                    correct = False
            else:
                correct = False

            time_val = a.get("time_seconds")
            time_sec = None
            if time_val is not None:
                try:
                    time_sec = float(time_val)
                except (ValueError, TypeError):
                    time_sec = None

            attempts.append({
                "skill": str(sk).strip(),
                "correct": correct,
                "difficulty": diff,
                "time_seconds": time_sec,
                "attempt_number": int(a.get("attempt_number", 1)),
            })

        return {
            "student_id": student.student_id,
            "skills": skills_list,
            "learning_history": attempts,
        }

    @classmethod
    def predict(
        cls,
        student: CommonStudentInput,
        model1_output: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Calls Model 2 service or in-process predictor."""
        payload = cls.to_model_input(student, model1_output)

        # 1. Try HTTP
        exec_mode = os.environ.get("MODEL_EXECUTION_MODE", "hybrid")
        if exec_mode in ("http", "hybrid"):
            try:
                url = f"{MODEL2_URL.rstrip('/')}/api/ml/mastery/predict"
                resp = requests.post(url, json=payload, timeout=SERVICE_TIMEOUT_SECONDS)
                if resp.status_code == 200:
                    return cls.normalize_response(resp.json())
                elif resp.status_code >= 500:
                    raise ModelInferenceException("model2", f"Model 2 server error: {resp.text}")
            except (requests.ConnectionError, requests.Timeout) as exc:
                if exec_mode == "http":
                    raise ModelUnavailableException("model2", f"Cannot connect to Model 2 service at {MODEL2_URL}: {exc}")
                logger.warning(f"HTTP call to Model 2 failed, trying direct module: {exc}")

        # 2. Try direct module
        if exec_mode in ("hybrid", "direct"):
            try:
                from adapters.isolation import isolate_model_environment
                with isolate_model_environment(MODEL2_DIR):
                    from src.predict import predict_mastery
                    raw_out = predict_mastery(payload)
                    return cls.normalize_response(raw_out)
            except Exception as e:
                raise ModelInferenceException("model2", f"Model 2 in-process execution failed: {e}")

        raise ModelUnavailableException("model2", f"Model 2 service is unavailable at {MODEL2_URL}")

    @classmethod
    def normalize_response(cls, raw: Dict[str, Any]) -> Dict[str, Any]:
        """Validates and normalizes Model 2 response."""
        if not isinstance(raw, dict):
            raise SchemaMismatchException("model2", "Model 2 did not return a JSON dictionary.")

        raw_skills = raw.get("skills", raw.get("mastery_evaluations", []))
        normalized_skills = []
        for sk in raw_skills:
            conf_val = sk.get("confidence", 0.50)
            if isinstance(conf_val, str):
                conf_map = {"HIGH": 0.90, "MEDIUM": 0.65, "LOW": 0.35}
                conf_float = conf_map.get(conf_val.upper(), 0.50)
            else:
                try:
                    conf_float = float(conf_val)
                except (ValueError, TypeError):
                    conf_float = 0.50

            normalized_skills.append({
                "skill": sk.get("skill", ""),
                "mastery_probability": float(sk.get("mastery_probability", 0.50)),
                "mastery_status": sk.get("mastery_status", "DEVELOPING"),
                "recommended_next_difficulty": sk.get("recommended_next_difficulty", "MEDIUM"),
                "confidence": conf_float,
                "evidence": sk.get("evidence", {}),
            })

        return {
            "status": "available",
            "student_id": raw.get("student_id", ""),
            "mastery_evaluations": normalized_skills,
            "skills": normalized_skills,
            "model_version": raw.get("model_version", "mastery-v2"),
            "schema_version": raw.get("schema_version", "1.0"),
        }
