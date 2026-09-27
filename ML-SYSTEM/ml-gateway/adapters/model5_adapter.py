"""
Model 5 Adapter (Student Interest Prediction Engine).
Translates CommonStudentInput into Model 5 payload and normalizes response.
"""

import os
import sys
import logging
from typing import Any, Dict, List, Optional
import requests

from config import (
    MODEL5_URL,
    MODEL5_DIR,
    SERVICE_TIMEOUT_SECONDS,
    MODEL_EXECUTION_MODE,
)
from schemas.contracts import CommonStudentInput
from services.errors import ModelUnavailableException, ModelInferenceException, SchemaMismatchException

logger = logging.getLogger(__name__)


class Model5GatewayAdapter:
    """Adapter bridging Gateway to Model 5 (Interest Prediction Engine)."""

    @classmethod
    def is_available(cls) -> bool:
        """Checks if Model 5 can be invoked (either via HTTP or direct module)."""
        try:
            resp = requests.get(f"{MODEL5_URL.rstrip('/')}/api/ml/interest/health", timeout=1.0)
            if resp.status_code == 200:
                return True
        except Exception:
            pass

        if MODEL_EXECUTION_MODE in ("hybrid", "direct"):
            try:
                from adapters.isolation import isolate_model_environment
                with isolate_model_environment(MODEL5_DIR):
                    from model_5_interest.engine import InterestPredictionEngine
                    return True
            except Exception:
                return False
        return False

    @classmethod
    def to_model_input(cls, student: CommonStudentInput) -> Dict[str, Any]:
        """Transforms CommonStudentInput to Model 5 input payload."""
        events = []
        for i, act in enumerate(student.resource_history):
            c_name = act.get("concept", act.get("topic", "unity"))
            # normalize concept to topic_id
            topic_id = str(c_name).lower().replace(" ", "_").replace("#", "sharp")
            events.append({
                "student_id": student.student_id,
                "topic_id": topic_id,
                "interaction_type": act.get("interaction_type", "view"),
                "time_spent_seconds": float(act.get("dwell_time_seconds", act.get("time_spent_seconds", 60.0))),
                "resource_id": act.get("resource_id", f"RES_{i+1}"),
            })

        profile = {
            "student_id": student.student_id,
            "explicit_interests": student.interests or ["Game Development", "Unity"],
            "learning_goals": [student.goal] if student.goal else ["Game Developer"],
        }

        return {
            "student_profile": profile,
            "events": events,
        }

    @classmethod
    def predict(cls, student: CommonStudentInput) -> Dict[str, Any]:
        """Calls Model 5 service or in-process engine."""
        payload = cls.to_model_input(student)

        # 1. Try HTTP
        exec_mode = os.environ.get("MODEL_EXECUTION_MODE", "hybrid")
        if exec_mode in ("http", "hybrid"):
            try:
                url = f"{MODEL5_URL.rstrip('/')}/api/ml/interest/predict"
                resp = requests.post(url, json=payload, timeout=SERVICE_TIMEOUT_SECONDS)
                if resp.status_code == 200:
                    return cls.normalize_response(resp.json())
                elif resp.status_code >= 500:
                    raise ModelInferenceException("model5", f"Model 5 server error: {resp.text}")
            except (requests.ConnectionError, requests.Timeout) as exc:
                if exec_mode == "http":
                    raise ModelUnavailableException("model5", f"Cannot connect to Model 5 service at {MODEL5_URL}: {exc}")
                logger.warning(f"HTTP call to Model 5 failed, trying direct module: {exc}")

        # 2. Try direct module
        if exec_mode in ("hybrid", "direct"):
            try:
                from adapters.isolation import isolate_model_environment
                with isolate_model_environment(MODEL5_DIR):
                    from model_5_interest.engine import InterestPredictionEngine
                    from model_5_interest.models import PredictRequest
                    from model_5_interest.config import get_default_config
                    from model_5_interest.taxonomy import TaxonomyManager

                    engine = InterestPredictionEngine(
                        config=get_default_config(),
                        taxonomy=TaxonomyManager.get_default_taxonomy()
                    )
                    req_obj = PredictRequest.model_validate(payload)
                    resp_obj = engine.predict_interests(
                        profile=req_obj.student_profile,
                        events=req_obj.events
                    )
                    raw_out = resp_obj.model_dump()
                    return cls.normalize_response(raw_out)
            except Exception as e:
                raise ModelInferenceException("model5", f"Model 5 in-process execution failed: {e}")

        raise ModelUnavailableException("model5", f"Model 5 service is unavailable at {MODEL5_URL}")

    @classmethod
    def normalize_response(cls, raw: Dict[str, Any]) -> Dict[str, Any]:
        """Validates and normalizes Model 5 response."""
        if not isinstance(raw, dict):
            raise SchemaMismatchException("model5", "Model 5 did not return a JSON dictionary.")

        interests_list = raw.get("interests", [])
        top_interests = raw.get("top_interests", [])
        if not top_interests and interests_list:
            top_interests = [item.get("concept", "") for item in sorted(
                interests_list, key=lambda x: x.get("score", 0.0), reverse=True
            )[:3]]

        return {
            "status": "available",
            "student_id": raw.get("student_id", ""),
            "top_interests": top_interests,
            "interests": interests_list,
            "inferred_from_behavior": bool(raw.get("inferred_from_behavior", False)),
            "model_version": raw.get("model_version", "interest-v1"),
            "schema_version": "1.0",
        }
