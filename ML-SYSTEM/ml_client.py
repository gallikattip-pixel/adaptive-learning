"""
Adaptive Learning ML Client Library
===================================
A lightweight, typed Python client for interacting with the Unified ML Gateway (Port 5100).
Designed for seamless consumption by application backends (Django, FastAPI, Flask, Node.js bridges).

Usage:
    from ml_client import MLGatewayClient

    client = MLGatewayClient(base_url="http://localhost:5100")
    plan = client.get_personalized_plan({
        "student_id": "STU001",
        "goal": "Game Developer",
        "interests": ["Game Development", "Unity", "C#"],
        "skills": [{"skill": "Unity Fundamentals", "level": 0.45}]
    })
    print(plan["recommendations"])
"""

import logging
from typing import Any, Dict, List, Optional
import requests

logger = logging.getLogger(__name__)


class MLClientError(Exception):
    """Base exception for ML client errors."""
    def __init__(self, message: str, status_code: Optional[int] = None, details: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.status_code = status_code
        self.details = details or {}


class MLGatewayClient:
    """Client for the ML Gateway Orchestrator API."""

    def __init__(self, base_url: str = "http://localhost:5100", timeout_seconds: float = 10.0):
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout_seconds

    def _post(self, path: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        url = f"{self.base_url}{path}"
        try:
            resp = requests.post(url, json=payload, timeout=self.timeout)
            if resp.status_code >= 400:
                err_detail = resp.json() if resp.headers.get("content-type") == "application/json" else {"text": resp.text}
                raise MLClientError(
                    f"ML Gateway returned error {resp.status_code}: {err_detail.get('message', resp.text)}",
                    status_code=resp.status_code,
                    details=err_detail
                )
            return resp.json()
        except requests.RequestException as e:
            raise MLClientError(f"Failed to communicate with ML Gateway at {url}: {e}")

    def _get(self, path: str) -> Dict[str, Any]:
        url = f"{self.base_url}{path}"
        try:
            resp = requests.get(url, timeout=self.timeout)
            if resp.status_code >= 400:
                raise MLClientError(f"ML Gateway returned error {resp.status_code}: {resp.text}", status_code=resp.status_code)
            return resp.json()
        except requests.RequestException as e:
            raise MLClientError(f"Failed to communicate with ML Gateway at {url}: {e}")

    def health(self) -> Dict[str, Any]:
        """Checks overall gateway health and connectivity to all 5 ML models."""
        return self._get("/api/ml/health")

    def metadata(self) -> Dict[str, Any]:
        """Fetches gateway metadata, model versions, and active configurations."""
        return self._get("/api/ml/metadata")

    def get_personalized_plan(self, student_input: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes the full 5-model unified pipeline:
        Model 5 -> Model 1 -> Model 2 -> Model 3 -> Model 4 -> Unified Personalized Plan.
        """
        return self._post("/api/ml/personalized-plan", student_input)

    def predict_interest(self, student_input: Dict[str, Any]) -> Dict[str, Any]:
        """Direct call to Model 5 (Interest Prediction)."""
        return self._post("/api/ml/interest", student_input)

    def predict_skill_gap(self, student_input: Dict[str, Any]) -> Dict[str, Any]:
        """Direct call to Model 1 (Skill-Gap Prediction)."""
        return self._post("/api/ml/skill-gap", student_input)

    def predict_mastery(self, student_input: Dict[str, Any]) -> Dict[str, Any]:
        """Direct call to Model 2 (Mastery & Difficulty Engine)."""
        return self._post("/api/ml/mastery", student_input)

    def predict_recommendations(self, student_input: Dict[str, Any]) -> Dict[str, Any]:
        """Direct call to Model 3 (Resource Recommendation Engine)."""
        return self._post("/api/ml/recommendations", student_input)

    def predict_risk(self, student_input: Dict[str, Any]) -> Dict[str, Any]:
        """Direct call to Model 4 (Learning Risk & Intervention Engine)."""
        return self._post("/api/ml/risk", student_input)
