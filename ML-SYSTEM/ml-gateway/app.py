"""
ML Gateway Application.
Unified REST API orchestrator for all 5 ML models:
- Model 1: Skill Gap Prediction
- Model 2: Mastery + Adaptive Difficulty
- Model 3: Resource Recommendation
- Model 4: Learning Risk & Intervention
- Model 5: Interest Prediction
"""

import logging
from typing import Any, Dict
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from config import ML_GATEWAY_PORT, ML_GATEWAY_HOST, GATEWAY_SCHEMA_VERSION
from schemas.contracts import (
    CommonStudentInput,
    UnifiedPersonalizedPlan,
    GatewayHealthResponse,
)
from orchestrator.pipeline import PipelineOrchestrator
from services.health import get_all_health
from services.errors import (
    GatewayException,
    ModelUnavailableException,
    InvalidInputException,
    ModelInferenceException,
    SchemaMismatchException,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("ml_gateway")

app = FastAPI(
    title="ML Gateway — Adaptive Learning Multi-Model Orchestrator",
    description="Unified API Gateway coordinating 5 ML microservices for student skill gap, mastery, recommendation, risk, and interest inference.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

orchestrator = PipelineOrchestrator()


# ---------------------------------------------------------------------------
# Exception Handlers
# ---------------------------------------------------------------------------

@app.exception_handler(GatewayException)
async def gateway_exception_handler(request: Request, exc: GatewayException):
    return JSONResponse(
        status_code=exc.status_code,
        content=exc.to_dict(),
    )


@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "model": "gateway",
            "error_code": "INVALID_INPUT",
            "message": str(exc),
            "retryable": False,
        },
    )


# ---------------------------------------------------------------------------
# System Endpoints
# ---------------------------------------------------------------------------

@app.get("/api/ml/health", response_model=GatewayHealthResponse, tags=["System"])
def health_endpoint():
    """
    Returns real-time health status for Gateway and all 5 models.
    Never returns fake healthy status.
    """
    return get_all_health()


@app.get("/api/ml/metadata", tags=["System"])
def metadata_endpoint():
    """
    Returns unified metadata from all 5 models and Gateway configuration.
    """
    health = get_all_health()
    return {
        "gateway_schema_version": GATEWAY_SCHEMA_VERSION,
        "service": "ML Gateway Orchestrator",
        "models": {
            "model1": {
                "name": "Skill Gap Prediction Engine",
                "version": "skill-gap-model-v1",
                "status": health["models"].get("model1", "unknown"),
            },
            "model2": {
                "name": "Mastery + Adaptive Difficulty",
                "version": "mastery-v2",
                "status": health["models"].get("model2", "unknown"),
            },
            "model3": {
                "name": "Resource Recommendation Engine",
                "version": "recommendation-v2",
                "status": health["models"].get("model3", "unknown"),
            },
            "model4": {
                "name": "Learning Risk & Intervention",
                "version": "risk-v1",
                "status": health["models"].get("model4", "unknown"),
            },
            "model5": {
                "name": "Student Interest Prediction",
                "version": "interest-v1",
                "status": health["models"].get("model5", "unknown"),
            },
        },
    }


# ---------------------------------------------------------------------------
# Main Unified Orchestration Endpoint
# ---------------------------------------------------------------------------

@app.post(
    "/api/ml/personalized-plan",
    response_model=UnifiedPersonalizedPlan,
    tags=["Orchestration"],
)
def create_personalized_plan(student: CommonStudentInput):
    """
    Unified entry point executing full 5-model pipeline:
    Student Input -> Model 5 (Interest) -> Model 1 (Skill Gap) -> Model 2 (Mastery)
      -> Model 3 (Recommendation) -> Model 4 (Risk) -> Unified Plan.
    """
    if not student.student_id or not student.student_id.strip():
        raise InvalidInputException("student_id is required and cannot be empty")

    try:
        return orchestrator.run_personalized_plan(student)
    except GatewayException:
        raise
    except Exception as exc:
        logger.exception("Unexpected error in unified personalized plan execution")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Personalized plan pipeline error: {exc}",
        )


# ---------------------------------------------------------------------------
# Individual Model Forwarding Endpoints
# ---------------------------------------------------------------------------

@app.post("/api/ml/interest", tags=["Individual Models"])
def predict_interest_endpoint(student: CommonStudentInput):
    """Executes Model 5: Interest Prediction."""
    if not student.student_id:
        raise InvalidInputException("student_id is required")
    return orchestrator.run_interest(student)


@app.post("/api/ml/skill-gap", tags=["Individual Models"])
def predict_skill_gap_endpoint(student: CommonStudentInput):
    """Executes Model 1: Skill Gap Prediction."""
    if not student.student_id:
        raise InvalidInputException("student_id is required")
    return orchestrator.run_skill_gap(student)


@app.post("/api/ml/mastery", tags=["Individual Models"])
def predict_mastery_endpoint(student: CommonStudentInput):
    """Executes Model 2: Mastery + Adaptive Difficulty."""
    if not student.student_id:
        raise InvalidInputException("student_id is required")
    return orchestrator.run_mastery(student)


@app.post("/api/ml/recommendations", tags=["Individual Models"])
def predict_recommendations_endpoint(student: CommonStudentInput):
    """Executes Model 3: Learning Resource Recommendation."""
    if not student.student_id:
        raise InvalidInputException("student_id is required")
    return orchestrator.run_recommendations(student)


@app.post("/api/ml/risk", tags=["Individual Models"])
def predict_risk_endpoint(student: CommonStudentInput):
    """Executes Model 4: Learning Risk & Intervention."""
    if not student.student_id:
        raise InvalidInputException("student_id is required")
    return orchestrator.run_risk(student)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host=ML_GATEWAY_HOST, port=ML_GATEWAY_PORT, reload=False)
