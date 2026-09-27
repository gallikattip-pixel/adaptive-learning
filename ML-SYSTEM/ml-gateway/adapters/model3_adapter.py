"""
Model 3 Adapter (Learning Resource Recommendation Engine).
Translates CommonStudentInput and upstream model outputs into Model 3 payload and normalizes response.
"""

import os
import sys
import logging
from typing import Any, Dict, List, Optional
import requests

from config import (
    MODEL3_URL,
    MODEL3_DIR,
    SERVICE_TIMEOUT_SECONDS,
    MODEL_EXECUTION_MODE,
)
from schemas.contracts import CommonStudentInput
from services.errors import ModelUnavailableException, ModelInferenceException, SchemaMismatchException

logger = logging.getLogger(__name__)


class Model3GatewayAdapter:
    """Adapter bridging Gateway to Model 3 (Resource Recommendation Engine)."""

    @classmethod
    def is_available(cls) -> bool:
        """Checks if Model 3 can be invoked (either via HTTP or direct module)."""
        try:
            resp = requests.get(f"{MODEL3_URL.rstrip('/')}/api/ml/recommendations/health", timeout=1.0)
            if resp.status_code == 200:
                return True
        except Exception:
            pass

        if MODEL_EXECUTION_MODE in ("hybrid", "direct"):
            try:
                from adapters.isolation import isolate_model_environment
                with isolate_model_environment(MODEL3_DIR):
                    from src.v2.recommender_v2 import GameDevRecommendationEngineV2
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
        model5_output: Optional[Dict[str, Any]] = None,
        top_k: int = 5,
    ) -> Dict[str, Any]:
        """
        Builds Model 3 v2 payload leveraging upstream outputs from Model 1, 2, and 5.
        """
        payload: Dict[str, Any] = {
            "student_id": student.student_id,
            "goal": student.goal,
            "explicit_interests": student.interests,
            "interests": student.interests,
            "model_version": "recommendation-v2",
            "top_k": top_k,
        }

        # Upstream Model 1 output -> model1_payload
        if model1_output:
            payload["model1_payload"] = model1_output
            if "skill_gaps" in model1_output:
                payload["skill_gaps"] = model1_output["skill_gaps"]

        # Upstream Model 2 output -> model2_payload
        if model2_output:
            payload["model2_payload"] = model2_output

        # Upstream Model 5 output -> model5_payload
        if model5_output:
            payload["model5_payload"] = model5_output

        # Historical completed resources
        completed = []
        for r in student.resource_history:
            if r.get("completed", False) or r.get("event_type") == "complete":
                completed.append(r.get("resource_id", ""))
        payload["completed_resources"] = [c for c in completed if c]

        return payload

    @classmethod
    def predict(
        cls,
        student: CommonStudentInput,
        model1_output: Optional[Dict[str, Any]] = None,
        model2_output: Optional[Dict[str, Any]] = None,
        model5_output: Optional[Dict[str, Any]] = None,
        top_k: int = 5,
    ) -> Dict[str, Any]:
        """Calls Model 3 service or in-process engine."""
        payload = cls.to_model_input(
            student=student,
            model1_output=model1_output,
            model2_output=model2_output,
            model5_output=model5_output,
            top_k=top_k,
        )

        # 1. Try HTTP
        exec_mode = os.environ.get("MODEL_EXECUTION_MODE", "hybrid")
        if exec_mode in ("http", "hybrid"):
            try:
                url = f"{MODEL3_URL.rstrip('/')}/api/ml/recommendations/predict?version=recommendation-v2"
                resp = requests.post(url, json=payload, timeout=SERVICE_TIMEOUT_SECONDS)
                if resp.status_code == 200:
                    return cls.normalize_response(resp.json())
                elif resp.status_code >= 500:
                    raise ModelInferenceException("model3", f"Model 3 server error: {resp.text}")
            except (requests.ConnectionError, requests.Timeout) as exc:
                if exec_mode == "http":
                    raise ModelUnavailableException("model3", f"Cannot connect to Model 3 service at {MODEL3_URL}: {exc}")
                logger.warning(f"HTTP call to Model 3 failed, trying direct module: {exc}")

        # 2. Try direct module
        if exec_mode in ("hybrid", "direct"):
            try:
                from adapters.isolation import isolate_model_environment
                with isolate_model_environment(MODEL3_DIR):
                    from src.v2.recommender_v2 import GameDevRecommendationEngineV2
                    from src.v2.concept_graph import GameDevKnowledgeGraph
                    from src.v2.resource_catalog_v2 import GameDevResourceCatalogV2
                    from src.adapters.model1_adapter import Model1Adapter
                    from src.adapters.model2_adapter import Model2Adapter
                    from src.adapters.model5_adapter import Model5Adapter

                    kg = GameDevKnowledgeGraph()
                    cat = GameDevResourceCatalogV2()
                    engine = GameDevRecommendationEngineV2(knowledge_graph=kg, catalog=cat)

                    # Extract signals using Model 3's built-in adapters
                    skill_gaps = []
                    if model1_output:
                        adapted_gaps = Model1Adapter.adapt_skill_gaps(model1_output)
                        skill_gaps = [g.skill for g in adapted_gaps]

                    m2_mastery = None
                    m2_diff = None
                    if model2_output:
                        try:
                            adapted_m = Model2Adapter.adapt_mastery_state(model2_output)
                            m2_mastery = {item.skill: item.mastery_probability for item in adapted_m}
                            m2_diff = Model2Adapter.adapt_difficulty_recommendation(model2_output)
                        except Exception:
                            pass

                    m5_signals = None
                    if model5_output:
                        try:
                            m5_signals = Model5Adapter.extract_interest_signals(model5_output)
                        except Exception:
                            pass

                    rec_result = engine.recommend(
                        student_id=student.student_id,
                        goal=student.goal,
                        explicit_interests=student.interests,
                        skill_gaps=skill_gaps,
                        model2_mastery=m2_mastery,
                        model2_difficulty=m2_diff,
                        model5_signals=m5_signals,
                        top_k=top_k,
                    )
                    return cls.normalize_response(rec_result.to_dict())
            except Exception as e:
                raise ModelInferenceException("model3", f"Model 3 in-process execution failed: {e}")

        raise ModelUnavailableException("model3", f"Model 3 service is unavailable at {MODEL3_URL}")

    @classmethod
    def normalize_response(cls, raw: Dict[str, Any]) -> Dict[str, Any]:
        """Validates and normalizes Model 3 response."""
        if not isinstance(raw, dict):
            raise SchemaMismatchException("model3", "Model 3 did not return a JSON dictionary.")

        raw_recs = raw.get("recommendations", raw.get("recommended_resources", []))
        normalized_recs = []
        for r in raw_recs:
            normalized_recs.append({
                "resource_id": r.get("resource_id", ""),
                "title": r.get("title", ""),
                "concept": r.get("concept", ""),
                "difficulty": r.get("difficulty", "MEDIUM"),
                "score": float(r.get("score", 0.50)),
                "match_reasons": r.get("match_reasons", []),
                "prerequisites_met": bool(r.get("prerequisites_met", True)),
                "estimated_minutes": r.get("estimated_minutes", 15),
            })

        return {
            "status": "available",
            "student_id": raw.get("student_id", ""),
            "recommendations": normalized_recs,
            "recommended_resources": normalized_recs,
            "recommendation_metadata": raw.get("recommendation_metadata", {}),
            "model_version": raw.get("model_version", "recommendation-v2"),
            "schema_version": "1.0",
        }
