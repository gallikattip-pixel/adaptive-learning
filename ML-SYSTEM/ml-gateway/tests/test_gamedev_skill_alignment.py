"""
Unit and integration tests for Model 1 and Model 2 Game Development skill alignment.
Verifies Stage C1.8.3.2-B requirements:
- Authentic Game Dev skill IDs (gd-*) are evaluated by Model 1 and Model 2.
- No synthetic 'programming_logic' or 'Programming Logic' fallback injection.
- Real item-level telemetry (correct, difficulty, time_seconds) is forwarded.
- Model 2 produces ephemeral mastery evaluations for gd-* skills.
"""

import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

GATEWAY_ROOT = Path(__file__).resolve().parent.parent
if str(GATEWAY_ROOT) not in sys.path:
    sys.path.insert(0, str(GATEWAY_ROOT))

from app import app
from schemas.contracts import CommonStudentInput
from adapters.model1_adapter import Model1GatewayAdapter
from adapters.model2_adapter import Model2GatewayAdapter


GAME_DEV_SKILLS = [
    "gd-csharp-scripting",
    "gd-engine-architecture",
    "gd-math-physics",
    "gd-game-design",
    "gd-game-ai",
    "gd-graphics-shaders",
]


@pytest.fixture(scope="session")
def client():
    return TestClient(app)


@pytest.fixture
def gamedev_diagnostic_student_input():
    """
    Simulates CommonStudentInput produced by stateAggregator for a student
    who completed the 18-question Game Development placement assessment.
    - skills: [] (empty before any manual skill assignment or pathway)
    - assessment_history: 18 items across the 6 canonical gd-* skills
    """
    history = []
    # 3 items per skill (1 easy, 1 medium, 1 hard), simulating diagnostic answers
    for skill_id in GAME_DEV_SKILLS:
        history.extend([
            {
                "attempt_id": "att_001",
                "assessment_id": "asm_gamedev_placement_01",
                "question_id": f"q_{skill_id}_1",
                "skill_id": skill_id,
                "skill": skill_id,
                "correct": True,
                "difficulty": "EASY",
                "time_seconds": 25,
                "attempt_score": 75.0,
            },
            {
                "attempt_id": "att_001",
                "assessment_id": "asm_gamedev_placement_01",
                "question_id": f"q_{skill_id}_2",
                "skill_id": skill_id,
                "skill": skill_id,
                "correct": True if "csharp" in skill_id or "engine" in skill_id else False,
                "difficulty": "MEDIUM",
                "time_seconds": 45,
                "attempt_score": 75.0,
            },
            {
                "attempt_id": "att_001",
                "assessment_id": "asm_gamedev_placement_01",
                "question_id": f"q_{skill_id}_3",
                "skill_id": skill_id,
                "skill": skill_id,
                "correct": False,
                "difficulty": "HARD",
                "time_seconds": 60,
                "attempt_score": 75.0,
            },
        ])

    return {
        "student_id": "student_gamedev_verify",
        "goal": "Game Developer",
        "interests": ["Game Development", "Unity"],
        "skills": [],  # Real diagnostic student starts with empty studentSkills
        "learning_history": [],
        "assessment_history": history,
        "resource_history": [],
        "activity_history": [],
    }


def test_model1_adapter_gamedev_skills(gamedev_diagnostic_student_input):
    """Verify Model 1 evaluates the 6 gd-* skills with NO programming_logic injection."""
    student = CommonStudentInput(**gamedev_diagnostic_student_input)
    payload = Model1GatewayAdapter.to_model_input(student)

    # required_skills must be exactly the 6 gd-* skills from history
    assert set(payload["required_skills"]) == set(GAME_DEV_SKILLS)
    assert "programming_logic" not in payload["required_skills"]

    # assessment questions must contain all 18 items with genuine fields
    questions = payload["assessment"]["questions"]
    assert len(questions) == 18
    for item in questions:
        assert item["skill"] in GAME_DEV_SKILLS
        assert item["difficulty"] in ("EASY", "MEDIUM", "HARD")
        assert isinstance(item["correct"], bool)
        assert isinstance(item["time_seconds"], (int, float))

    # Test direct execution
    resp = Model1GatewayAdapter.predict(student)
    assert resp["student_id"] == "student_gamedev_verify"
    evaluated_skills = set(s["skill"] for s in resp["skills"])
    assert evaluated_skills == set(GAME_DEV_SKILLS)
    assert "programming_logic" not in evaluated_skills


def test_model2_adapter_gamedev_skills(gamedev_diagnostic_student_input):
    """Verify Model 2 evaluates the 6 gd-* skills with NO Programming Logic fallback."""
    student = CommonStudentInput(**gamedev_diagnostic_student_input)
    payload = Model2GatewayAdapter.to_model_input(student)

    # Skills array must contain the 6 gd-* skills
    payload_skills = [s["skill"] for s in payload["skills"]]
    assert set(payload_skills) == set(GAME_DEV_SKILLS)
    assert "Programming Logic" not in payload_skills

    # Learning history must contain all 18 items
    assert len(payload["learning_history"]) == 18
    for item in payload["learning_history"]:
        assert item["skill"] in GAME_DEV_SKILLS
        assert item["difficulty"] in ("EASY", "MEDIUM", "HARD")
        assert isinstance(item["correct"], bool)

    # Test direct execution
    resp = Model2GatewayAdapter.predict(student)
    assert resp["student_id"] == "student_gamedev_verify"
    evaluated_skills = [m["skill"] for m in resp["mastery_evaluations"]]
    assert set(evaluated_skills) == set(GAME_DEV_SKILLS)
    assert "Programming Logic" not in evaluated_skills
    for m in resp["mastery_evaluations"]:
        assert 0.0 <= m["mastery_probability"] <= 1.0
        assert m["mastery_status"] in ("NOT_MASTERED", "IN_PROGRESS", "DEVELOPING", "NEAR_MASTERED", "MASTERED")
        assert m["recommended_next_difficulty"] in ("EASY", "MEDIUM", "HARD")


def test_gamedev_diagnostic_endpoints(client, gamedev_diagnostic_student_input):
    """Verify HTTP endpoints /api/ml/skill-gap, /api/ml/mastery, and /api/ml/personalized-plan."""
    # 1. Skill Gap Endpoint
    res1 = client.post("/api/ml/skill-gap", json=gamedev_diagnostic_student_input)
    assert res1.status_code == 200
    data1 = res1.json()
    m1_skills = [s["skill"] for s in data1["skills"]]
    assert set(m1_skills) == set(GAME_DEV_SKILLS)
    assert "programming_logic" not in m1_skills

    # 2. Mastery Endpoint
    res2 = client.post("/api/ml/mastery", json=gamedev_diagnostic_student_input)
    assert res2.status_code == 200
    data2 = res2.json()
    m2_skills = [m["skill"] for m in data2["mastery_evaluations"]]
    assert set(m2_skills) == set(GAME_DEV_SKILLS)
    assert "Programming Logic" not in m2_skills

    # 3. Personalized Plan Pipeline
    res3 = client.post("/api/ml/personalized-plan", json=gamedev_diagnostic_student_input)
    assert res3.status_code == 200
    data3 = res3.json()
    plan_gap_skills = [g["skill"] for g in data3["skill_gaps"]]
    plan_mastery_skills = [m["skill"] for m in data3["mastery"]]
    # All gap skills must be gd-* skills
    for s in plan_gap_skills:
        assert s in GAME_DEV_SKILLS
    # All mastery skills must be gd-* skills
    for s in plan_mastery_skills:
        assert s in GAME_DEV_SKILLS
    assert "programming_logic" not in plan_gap_skills
    assert "Programming Logic" not in plan_mastery_skills


def test_missing_telemetry_does_not_fabricate_values():
    """Verify that when time_seconds is omitted, adapters do NOT fabricate 30.0."""
    student_data = {
        "student_id": "student_no_timing",
        "goal": "Game Developer",
        "skills": [],
        "learning_history": [],
        "assessment_history": [
            {
                "skill_id": "gd-csharp-scripting",
                "skill": "gd-csharp-scripting",
                "correct": True,
                "difficulty": "EASY",
                # time_seconds is omitted
            }
        ],
    }
    student = CommonStudentInput(**student_data)

    # Model 1 check
    m1_payload = Model1GatewayAdapter.to_model_input(student)
    q = m1_payload["assessment"]["questions"][0]
    assert "time_seconds" not in q  # Must not synthesize 30.0!

    # Model 2 check
    m2_payload = Model2GatewayAdapter.to_model_input(student)
    att = m2_payload["learning_history"][0]
    assert att["time_seconds"] is None  # Must remain None, not fabricated 30.0!

    # Both models must still succeed cleanly with authentic non-fabricated telemetry
    m1_resp = Model1GatewayAdapter.predict(student)
    assert "gd-csharp-scripting" in [s["skill"] for s in m1_resp["skills"]]

    m2_resp = Model2GatewayAdapter.predict(student)
    assert "gd-csharp-scripting" in [m["skill"] for m in m2_resp["mastery_evaluations"]]


def test_models_actually_influenced_by_telemetry():
    """
    Verify that Model 1 and Model 2 outputs are genuinely influenced by the
    provided diagnostic telemetry (correctness/difficulty), proving real signal processing.
    """
    # Student High: all 3 items correct
    high_input = CommonStudentInput(
        student_id="student_high",
        goal="Game Developer",
        skills=[],
        assessment_history=[
            {"skill": "gd-csharp-scripting", "correct": True, "difficulty": "EASY", "time_seconds": 20},
            {"skill": "gd-csharp-scripting", "correct": True, "difficulty": "MEDIUM", "time_seconds": 30},
            {"skill": "gd-csharp-scripting", "correct": True, "difficulty": "HARD", "time_seconds": 40},
        ],
    )
    # Student Low: all 3 items incorrect
    low_input = CommonStudentInput(
        student_id="student_low",
        goal="Game Developer",
        skills=[],
        assessment_history=[
            {"skill": "gd-csharp-scripting", "correct": False, "difficulty": "EASY", "time_seconds": 60},
            {"skill": "gd-csharp-scripting", "correct": False, "difficulty": "MEDIUM", "time_seconds": 60},
            {"skill": "gd-csharp-scripting", "correct": False, "difficulty": "HARD", "time_seconds": 60},
        ],
    )

    # Model 1 check: high score must be strictly greater than low score
    m1_high = Model1GatewayAdapter.predict(high_input)
    m1_low = Model1GatewayAdapter.predict(low_input)
    score_high = m1_high["skills"][0]["score"]
    score_low = m1_low["skills"][0]["score"]
    assert score_high > score_low, f"Model 1 score should be influenced by telemetry: {score_high} vs {score_low}"
    assert m1_high["skills"][0]["status"] == "STRONG"
    assert m1_low["skills"][0]["status"] == "NOT_READY"

    # Model 2 check: high probability must be strictly greater than low probability
    m2_high = Model2GatewayAdapter.predict(high_input)
    m2_low = Model2GatewayAdapter.predict(low_input)
    prob_high = m2_high["mastery_evaluations"][0]["mastery_probability"]
    prob_low = m2_low["mastery_evaluations"][0]["mastery_probability"]
    assert prob_high > prob_low, f"Model 2 probability should be influenced by telemetry: {prob_high} vs {prob_low}"

