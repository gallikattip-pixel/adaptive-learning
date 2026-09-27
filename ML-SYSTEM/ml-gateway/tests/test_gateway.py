"""
Integration tests for ML Gateway and multi-model pipeline.
Covers Section 22 Tests 1 through 9.
"""

import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

# Ensure ml-gateway root is on sys.path
GATEWAY_ROOT = Path(__file__).resolve().parent.parent
if str(GATEWAY_ROOT) not in sys.path:
    sys.path.insert(0, str(GATEWAY_ROOT))

from app import app
from schemas.contracts import CommonStudentInput, SkillEntry
from orchestrator.pipeline import PipelineOrchestrator
from services.errors import ModelUnavailableException


@pytest.fixture(scope="session")
def client():
    return TestClient(app)


@pytest.fixture
def sample_student_input():
    return {
        "student_id": "STU001",
        "goal": "Game Developer",
        "interests": ["Unity", "AI"],
        "skills": [
            {"skill": "Python", "level": 0.75},
            {"skill": "C#", "level": 0.45},
            {"skill": "Programming Logic", "level": 0.85},
            {"skill": "Mathematics", "level": 0.35},
        ],
        "learning_history": [
            {"skill": "programming_logic", "correct": True, "difficulty": "MEDIUM", "time_seconds": 22},
            {"skill": "programming_logic", "correct": True, "difficulty": "HARD", "time_seconds": 35},
            {"skill": "mathematics", "correct": False, "difficulty": "MEDIUM", "time_seconds": 55},
        ],
        "assessment_history": [
            {"skill": "programming_logic", "correct": True, "difficulty": "MEDIUM", "time_seconds": 18},
            {"skill": "mathematics", "correct": False, "difficulty": "HARD", "time_seconds": 65},
        ],
        "resource_history": [
            {"resource_id": "RES_UNITY_INTRO", "concept": "Unity", "completed": True, "dwell_time_seconds": 180},
        ],
        "activity_history": [
            {"session_id": "S1", "time_spent_minutes": 35.0},
            {"session_id": "S2", "time_spent_minutes": 40.0},
        ],
    }


# ===========================================================================
# Test 1 — Model Health
# ===========================================================================
def test_01_gateway_health_endpoint(client):
    res = client.get("/api/ml/health")
    assert res.status_code == 200
    data = res.json()
    assert "gateway" in data
    assert "models" in data
    assert "model1" in data["models"]
    assert "model2" in data["models"]
    assert "model3" in data["models"]
    assert "model4" in data["models"]
    assert "model5" in data["models"]
    assert data["gateway"] in ("healthy", "degraded")


# ===========================================================================
# Test 2 — Common Student Input Validation
# ===========================================================================
def test_02_common_student_input_schema(sample_student_input):
    obj = CommonStudentInput(**sample_student_input)
    assert obj.student_id == "STU001"
    assert obj.goal == "Game Developer"
    assert len(obj.skills) == 4
    assert "Unity" in obj.interests


# ===========================================================================
# Test 3 — Model 5 (Interest) Integration
# ===========================================================================
def test_03_interest_endpoint(client, sample_student_input):
    res = client.post("/api/ml/interest", json=sample_student_input)
    assert res.status_code == 200
    data = res.json()
    assert data["student_id"] == "STU001"
    assert "interests" in data
    assert "top_interests" in data
    assert len(data["interests"]) > 0


# ===========================================================================
# Test 4 — Model 1 (Skill Gap) Integration
# ===========================================================================
def test_04_skill_gap_endpoint(client, sample_student_input):
    res = client.post("/api/ml/skill-gap", json=sample_student_input)
    assert res.status_code == 200
    data = res.json()
    assert data["student_id"] == "STU001"
    assert "skills" in data
    assert "skill_gaps" in data
    assert "learning_priorities" in data
    assert "overall_skill_score" in data


# ===========================================================================
# Test 5 — Model 2 (Mastery + Difficulty) Integration
# ===========================================================================
def test_05_mastery_endpoint(client, sample_student_input):
    res = client.post("/api/ml/mastery", json=sample_student_input)
    assert res.status_code == 200
    data = res.json()
    assert data["student_id"] == "STU001"
    assert "mastery_evaluations" in data
    assert len(data["mastery_evaluations"]) > 0
    first = data["mastery_evaluations"][0]
    assert "mastery_probability" in first
    assert "mastery_status" in first
    assert "recommended_next_difficulty" in first


# ===========================================================================
# Test 6 — Model 4 (Risk & Intervention) Integration
# ===========================================================================
def test_06_risk_endpoint(client, sample_student_input):
    res = client.post("/api/ml/risk", json=sample_student_input)
    assert res.status_code == 200
    data = res.json()
    assert data["student_id"] == "STU001"
    assert "risk_assessment" in data
    assert "intervention" in data
    assert data["risk_assessment"]["risk_level"] in ("NORMAL", "AT_RISK", "NEEDS_INTERVENTION")


# ===========================================================================
# Test 7 — Complete End-to-End Orchestrated Pipeline
# ===========================================================================
def test_07_complete_personalized_plan_pipeline(client, sample_student_input):
    res = client.post("/api/ml/personalized-plan", json=sample_student_input)
    assert res.status_code == 200
    data = res.json()

    assert data["student_id"] == "STU001"
    # Interest
    assert "interest" in data
    assert "top_interests" in data["interest"]
    # Skill Gaps
    assert "skill_gaps" in data
    assert len(data["skill_gaps"]) > 0
    # Mastery
    assert "mastery" in data
    assert len(data["mastery"]) > 0
    # Recommendations
    assert "recommendations" in data
    assert len(data["recommendations"]) > 0
    # Risk
    assert "risk" in data
    assert "risk_level" in data["risk"]
    # Intervention
    assert "intervention" in data
    assert "recommended_action" in data["intervention"]
    # Metadata
    assert "metadata" in data
    assert data["metadata"]["schema_version"] == "1.0"
    assert data["metadata"]["execution_time_ms"] > 0


# ===========================================================================
# Test 8 — Model Unavailable Handling (No Silent Fabrication)
# ===========================================================================
def test_08_model_unavailable_structured_error():
    from adapters.model1_adapter import Model1GatewayAdapter
    from schemas.contracts import CommonStudentInput

    # Force strict HTTP mode with non-existent port to test error handling
    import os
    orig_mode = os.environ.get("MODEL_EXECUTION_MODE")
    os.environ["MODEL_EXECUTION_MODE"] = "http"
    try:
        from config import MODEL1_URL
        # Attempting predict when service is unreachable in strict HTTP mode raises ModelUnavailableException
        with pytest.raises(ModelUnavailableException) as excinfo:
            student = CommonStudentInput(student_id="STU_ERR_TEST", goal="Tester")
            # Override URL temporarily to dead port
            import adapters.model1_adapter as m1_mod
            orig_url = m1_mod.MODEL1_URL
            m1_mod.MODEL1_URL = "http://127.0.0.1:59999"
            try:
                m1_mod.Model1GatewayAdapter.predict(student)
            finally:
                m1_mod.MODEL1_URL = orig_url

        err = excinfo.value.to_dict()
        assert err["model"] == "model1"
        assert err["error_code"] == "MODEL_UNAVAILABLE"
        assert err["retryable"] is True
    finally:
        if orig_mode:
            os.environ["MODEL_EXECUTION_MODE"] = orig_mode
        else:
            os.environ["MODEL_EXECUTION_MODE"] = "hybrid"


# ===========================================================================
# Test 9 — Invalid Input Returns 400 Bad Request
# ===========================================================================
def test_09_invalid_input_empty_student_id(client):
    res = client.post("/api/ml/personalized-plan", json={"student_id": "", "goal": "Game Developer"})
    assert res.status_code == 400
    data = res.json()
    assert data["error_code"] == "INVALID_INPUT"


def test_09b_invalid_input_missing_body(client):
    res = client.post("/api/ml/personalized-plan", json={})
    assert res.status_code in (400, 422)


# ===========================================================================
# Test 10 — Metadata Endpoint
# ===========================================================================
def test_10_metadata_endpoint(client):
    res = client.get("/api/ml/metadata")
    assert res.status_code == 200
    data = res.json()
    assert "models" in data
    assert "model1" in data["models"]
    assert "model2" in data["models"]
    assert "model3" in data["models"]
    assert "model4" in data["models"]
    assert "model5" in data["models"]
    assert data["gateway_schema_version"] == "1.0"
