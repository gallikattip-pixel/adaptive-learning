"""
Model 4 Adapter (Learning Risk & Intervention Engine).
Translates CommonStudentInput and upstream model outputs into Model 4 payload and normalizes response.
"""

import os
import sys
import logging
from typing import Any, Dict, List, Optional
import requests

from config import (
    MODEL4_URL,
    MODEL4_DIR,
    SERVICE_TIMEOUT_SECONDS,
    MODEL_EXECUTION_MODE,
)
from schemas.contracts import CommonStudentInput
from services.errors import ModelUnavailableException, ModelInferenceException, SchemaMismatchException

logger = logging.getLogger(__name__)


class Model4GatewayAdapter:
    """Adapter bridging Gateway to Model 4 (Learning Risk & Intervention Engine)."""

    @classmethod
    def is_available(cls) -> bool:
        """Checks if Model 4 can be invoked (either via HTTP or direct module)."""
        try:
            resp = requests.get(f"{MODEL4_URL.rstrip('/')}/api/ml/risk/health", timeout=1.0)
            if resp.status_code == 200:
                return True
        except Exception:
            pass

        if MODEL_EXECUTION_MODE in ("hybrid", "direct"):
            try:
                from adapters.isolation import isolate_model_environment
                with isolate_model_environment(MODEL4_DIR):
                    from src.predict import RiskPredictionService
                    return True
            except Exception:
                return False
        return False

    @classmethod
    def to_model_input(
        cls,
        student: CommonStudentInput,
        model1_output: Optional[Dict[str, Any]] = None,
        model2_output: Optional[Dict[str, Any]] = None,
        model3_output: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Builds Model 4 RiskInputPayload leveraging upstream outputs from Model 1, 2, and 3.
        """
        payload: Dict[str, Any] = {
            "student_id": student.student_id,
        }

        # Upstream Model 1 output -> model1
        if model1_output:
            m1_for_m4 = dict(model1_output)
            raw_gaps = model1_output.get("skill_gaps", [])
            formatted_gaps = []
            for g in raw_gaps:
                if isinstance(g, dict):
                    formatted_gaps.append(g)
                elif isinstance(g, str):
                    gap_score = 0.60
                    for sk in model1_output.get("skills", []):
                        if sk.get("skill") == g:
                            gap_score = round(1.0 - float(sk.get("score", 0.40)), 2)
                            break
                    formatted_gaps.append({"skill": g, "gap_score": gap_score})
            m1_for_m4["skill_gaps"] = formatted_gaps
            payload["model1"] = m1_for_m4

        # Upstream Model 2 output -> model2
        if model2_output:
            payload["model2"] = model2_output

        # Upstream Model 3 output -> model3
        if model3_output:
            payload["model3"] = model3_output

        # Learning activity telemetry from activity_history
        act_history = student.activity_history
        total_time = sum(float(a.get("time_spent_minutes", 10.0)) for a in act_history)
        payload["learning_activity"] = {
            "sessions_last_7_days": max(1, len(act_history)),
            "sessions_last_14_days": max(1, len(act_history) * 2),
            "total_time_spent_minutes": total_time or 60.0,
            "days_inactive": 0 if act_history else 2,
            "average_session_minutes": 25.0,
        }

        # Performance telemetry
        attempts = student.learning_history + student.assessment_history
        if attempts:
            correct_cnt = sum(1 for a in attempts if a.get("correct") is True)
            acc = correct_cnt / len(attempts)
            payload["performance"] = {
                "recent_accuracy": round(acc, 2),
                "previous_accuracy": round(acc, 2),
                "score_trend": 0.0,
                "failed_attempts": len(attempts) - correct_cnt,
                "total_attempts": len(attempts),
                "consecutive_wrong": 1 if acc < 0.5 else 0,
                "consecutive_correct": 1 if acc >= 0.7 else 0,
            }

        return payload

    @classmethod
    def predict(
        cls,
        student: CommonStudentInput,
        model1_output: Optional[Dict[str, Any]] = None,
        model2_output: Optional[Dict[str, Any]] = None,
        model3_output: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Calls Model 4 service or in-process engine."""
        payload = cls.to_model_input(
            student=student,
            model1_output=model1_output,
            model2_output=model2_output,
            model3_output=model3_output,
        )

        # 1. Try HTTP
        exec_mode = os.environ.get("MODEL_EXECUTION_MODE", "hybrid")
        if exec_mode in ("http", "hybrid"):
            try:
                url = f"{MODEL4_URL.rstrip('/')}/api/ml/risk/predict"
                resp = requests.post(url, json=payload, timeout=SERVICE_TIMEOUT_SECONDS)
                if resp.status_code == 200:
                    return cls.normalize_response(resp.json())
                elif resp.status_code >= 500:
                    raise ModelInferenceException("model4", f"Model 4 server error: {resp.text}")
            except (requests.ConnectionError, requests.Timeout) as exc:
                if exec_mode == "http":
                    raise ModelUnavailableException("model4", f"Cannot connect to Model 4 service at {MODEL4_URL}: {exc}")
                logger.warning(f"HTTP call to Model 4 failed, trying direct module: {exc}")

        # 2. Try direct module
        if exec_mode in ("hybrid", "direct"):
            try:
                from adapters.isolation import isolate_model_environment
                with isolate_model_environment(MODEL4_DIR):
                    from src.predict import RiskPredictionService
                    service = RiskPredictionService()
                    raw_out = service.predict_from_dict(payload)
                    return cls.normalize_response(raw_out)
            except Exception as e:
                raise ModelInferenceException("model4", f"Model 4 in-process execution failed: {e}")

        raise ModelUnavailableException("model4", f"Model 4 service is unavailable at {MODEL4_URL}")

    @classmethod
    def normalize_response(cls, raw: Dict[str, Any]) -> Dict[str, Any]:
        """Validates and normalizes Model 4 response."""
        if not isinstance(raw, dict):
            raise SchemaMismatchException("model4", "Model 4 did not return a JSON dictionary.")

        risk_assess = raw.get("risk_assessment", {})
        intervention = raw.get("intervention", {})

        return {
            "status": "available",
            "student_id": raw.get("student_id", ""),
            "risk_assessment": {
                "risk_level": risk_assess.get("risk_level", "NORMAL"),
                "risk_score": float(risk_assess.get("risk_score", 0.15)),
                "confidence": float(risk_assess.get("confidence", 0.85)),
                "evidence": risk_assess.get("evidence", {}),
            },
            "intervention": {
                "recommended_action": intervention.get("recommended_action", "CONTINUE_PATH"),
                "action_type": intervention.get("action_type", "POSITIVE_REINFORCEMENT"),
                "urgency": intervention.get("urgency", "LOW"),
                "suggested_difficulty": intervention.get("suggested_difficulty"),
                "resource_adjustments": intervention.get("resource_adjustments"),
            },
            "model_version": raw.get("model_version", "risk-v1"),
            "schema_version": "1.0",
        }
