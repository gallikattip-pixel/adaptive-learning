"""
Health checker service for all ML models and the Gateway.
"""

from datetime import datetime, timezone
from typing import Dict, Any
import requests

from config import (
    MODEL1_URL,
    MODEL2_URL,
    MODEL3_URL,
    MODEL4_URL,
    MODEL5_URL,
    SERVICE_TIMEOUT_SECONDS,
    MODEL_EXECUTION_MODE,
)


def check_http_health(url: str, endpoint: str) -> bool:
    try:
        resp = requests.get(f"{url.rstrip('/')}{endpoint}", timeout=0.2)
        return resp.status_code == 200
    except Exception:
        return False


def check_model1_health() -> Dict[str, Any]:
    # 1. Try HTTP
    if check_http_health(MODEL1_URL, "/api/ml/skill-gap/health"):
        return {"status": "healthy", "connection": "http", "url": MODEL1_URL}
    # 2. Check local module if allowed
    if MODEL_EXECUTION_MODE in ("hybrid", "direct"):
        try:
            from adapters.model1_adapter import Model1GatewayAdapter
            if Model1GatewayAdapter.is_available():
                return {"status": "healthy", "connection": "direct_module"}
        except Exception as e:
            return {"status": "unhealthy", "error": str(e)}
    return {"status": "unavailable", "url": MODEL1_URL}


def check_model2_health() -> Dict[str, Any]:
    # 1. Try HTTP
    if check_http_health(MODEL2_URL, "/api/ml/mastery/health"):
        return {"status": "healthy", "connection": "http", "url": MODEL2_URL}
    # 2. Check local module if allowed
    if MODEL_EXECUTION_MODE in ("hybrid", "direct"):
        try:
            from adapters.model2_adapter import Model2GatewayAdapter
            if Model2GatewayAdapter.is_available():
                return {"status": "healthy", "connection": "direct_module"}
        except Exception as e:
            return {"status": "unhealthy", "error": str(e)}
    return {"status": "unavailable", "url": MODEL2_URL}


def check_model3_health() -> Dict[str, Any]:
    # 1. Try HTTP
    if check_http_health(MODEL3_URL, "/api/ml/recommendations/health"):
        return {"status": "healthy", "connection": "http", "url": MODEL3_URL}
    # 2. Check local module if allowed
    if MODEL_EXECUTION_MODE in ("hybrid", "direct"):
        try:
            from adapters.model3_adapter import Model3GatewayAdapter
            if Model3GatewayAdapter.is_available():
                return {"status": "healthy", "connection": "direct_module"}
        except Exception as e:
            return {"status": "unhealthy", "error": str(e)}
    return {"status": "unavailable", "url": MODEL3_URL}


def check_model4_health() -> Dict[str, Any]:
    # 1. Try HTTP
    if check_http_health(MODEL4_URL, "/api/ml/risk/health"):
        return {"status": "healthy", "connection": "http", "url": MODEL4_URL}
    # 2. Check local module if allowed
    if MODEL_EXECUTION_MODE in ("hybrid", "direct"):
        try:
            from adapters.model4_adapter import Model4GatewayAdapter
            if Model4GatewayAdapter.is_available():
                return {"status": "healthy", "connection": "direct_module"}
        except Exception as e:
            return {"status": "unhealthy", "error": str(e)}
    return {"status": "unavailable", "url": MODEL4_URL}


def check_model5_health() -> Dict[str, Any]:
    # 1. Try HTTP
    if check_http_health(MODEL5_URL, "/api/ml/interest/health"):
        return {"status": "healthy", "connection": "http", "url": MODEL5_URL}
    # 2. Check local module if allowed
    if MODEL_EXECUTION_MODE in ("hybrid", "direct"):
        try:
            from adapters.model5_adapter import Model5GatewayAdapter
            if Model5GatewayAdapter.is_available():
                return {"status": "healthy", "connection": "direct_module"}
        except Exception as e:
            return {"status": "unhealthy", "error": str(e)}
    return {"status": "unavailable", "url": MODEL5_URL}


def get_all_health() -> Dict[str, Any]:
    h1 = check_model1_health()
    h2 = check_model2_health()
    h3 = check_model3_health()
    h4 = check_model4_health()
    h5 = check_model5_health()

    models_status = {
        "model1": h1["status"],
        "model2": h2["status"],
        "model3": h3["status"],
        "model4": h4["status"],
        "model5": h5["status"],
    }

    all_healthy = all(s == "healthy" for s in models_status.values())
    gateway_status = "healthy" if all_healthy else "degraded"

    return {
        "gateway": gateway_status,
        "models": models_status,
        "details": {
            "model1": h1,
            "model2": h2,
            "model3": h3,
            "model4": h4,
            "model5": h5,
        },
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
