# ML Gateway API Contract & Specification

This document defines the canonical REST API contract for the **ML Gateway Orchestrator** (`http://localhost:5100`).

---

## 1. System Health

### `GET /api/ml/health`
Checks operational health across the Gateway and all five ML models.

#### Response `200 OK`
```json
{
  "gateway": "healthy",
  "models": {
    "model1": "healthy",
    "model2": "healthy",
    "model3": "healthy",
    "model4": "healthy",
    "model5": "healthy"
  },
  "timestamp": "2026-09-26T18:29:18.494337+00:00"
}
```

---

## 2. Gateway Metadata

### `GET /api/ml/metadata`
Returns registered model versions, pipeline schema version, and host environment configuration.

#### Response `200 OK`
```json
{
  "gateway_version": "1.0.0",
  "schema_version": "1.0",
  "execution_mode": "hybrid",
  "models": {
    "model1": {"name": "Skill-Gap Prediction", "version": "1.0.0"},
    "model2": {"name": "Mastery & Adaptive Difficulty", "version": "v2"},
    "model3": {"name": "Resource Recommendation Engine", "version": "recommendation-v2"},
    "model4": {"name": "Learning Risk & Intervention", "version": "1.0.0"},
    "model5": {"name": "Interest Prediction Engine", "version": "1.0.0"}
  },
  "endpoints": [
    "/api/ml/health",
    "/api/ml/metadata",
    "/api/ml/personalized-plan",
    "/api/ml/interest",
    "/api/ml/skill-gap",
    "/api/ml/mastery",
    "/api/ml/recommendations",
    "/api/ml/risk"
  ]
}
```

---

## 3. Canonical Input Contract (`CommonStudentInput`)

All predictive endpoints accept the canonical student schema:

```json
{
  "student_id": "STU001",
  "goal": "Game Developer",
  "interests": ["Game Development", "Unity", "C#", "AI in Games"],
  "skills": [
    {"skill": "Unity Fundamentals", "level": 0.42, "confidence": 0.85},
    {"skill": "C# Scripting", "level": 0.55, "confidence": 0.90},
    {"skill": "Shader Programming", "level": 0.28, "confidence": 0.70},
    {"skill": "Physics Engine", "level": 0.48, "confidence": 0.75},
    {"skill": "AI Pathfinding", "level": 0.35, "confidence": 0.65},
    {"skill": "Game Design", "level": 0.80, "confidence": 0.95}
  ],
  "learning_history": [
    {"topic": "Unity Fundamentals", "score": 0.42, "time_spent": 35},
    {"topic": "C# Scripting", "score": 0.55, "time_spent": 45}
  ],
  "assessment_history": [
    {"assessment_id": "A101", "score": 0.42, "passed": false},
    {"assessment_id": "A102", "score": 0.55, "passed": true}
  ],
  "activity_history": [
    {"action": "quiz_attempt", "timestamp": "2026-09-20T10:00:00Z"},
    {"action": "reading", "timestamp": "2026-09-21T11:00:00Z"}
  ]
}
```

### Field Definitions:
- `student_id` (string, required): Unique student identifier.
- `goal` (string, optional, default: `"Game Developer"`): Target career role or specialization.
- `interests` (list[string], optional): Declared student interest tags.
- `skills` (list[SkillEntry], optional): Existing skill competencies with `skill` (string) and `level` (float between 0.0 and 1.0).
- `learning_history` (list[dict], optional): Temporal records of learning modules engaged.
- `assessment_history` (list[dict], optional): Previous quiz scores and pass/fail statuses.
- `activity_history` (list[dict], optional): Behavioral interactions on platform (time spent, clicks).

---

## 4. Primary Orchestrated Pipeline

### `POST /api/ml/personalized-plan`
Executes the full multi-model pipeline: **Model 5 -> Model 1 -> Model 2 -> Model 3 -> Model 4**.

#### Request Body
`CommonStudentInput` (JSON)

#### Response `200 OK` (`UnifiedPersonalizedPlan`)
```json
{
  "student_id": "STU001",
  "interest": {
    "status": "available",
    "student_id": "STU001",
    "top_interests": ["Game Development", "Unity", "C#", "AI in Games"],
    "interests": [
      {"concept": "Game Development", "score": 0.9, "confidence": 0.8, "trend": "rising"}
    ],
    "inferred_from_behavior": false,
    "model_version": "interest-v1"
  },
  "skill_gaps": [
    {
      "skill": "unity_fundamentals",
      "score": 0.0,
      "status": "NOT_READY",
      "priority": "HIGH",
      "confidence": 0.5
    },
    {
      "skill": "c#_scripting",
      "score": 1.0,
      "status": "STRONG",
      "priority": "LOW",
      "confidence": 0.5
    },
    {
      "skill": "shader_programming",
      "score": 0.0,
      "status": "NOT_READY",
      "priority": "HIGH",
      "confidence": 0.5
    },
    {
      "skill": "physics_engine",
      "score": 0.0,
      "status": "NOT_READY",
      "priority": "HIGH",
      "confidence": 0.5
    },
    {
      "skill": "ai_pathfinding",
      "score": 0.0,
      "status": "NOT_READY",
      "priority": "HIGH",
      "confidence": 0.5
    },
    {
      "skill": "game_design",
      "score": 0.9,
      "status": "STRONG",
      "priority": "LOW",
      "confidence": 0.5
    },
    {
      "skill": "programming_logic",
      "score": 0.39,
      "status": "NOT_READY",
      "priority": "HIGH",
      "confidence": 0.5
    }
  ],
  "mastery": [
    {
      "skill": "unity_fundamentals",
      "mastery_level": "N/A",
      "recommended_difficulty": "N/A",
      "confidence": 0.35
    },
    {
      "skill": "c#_scripting",
      "mastery_level": "N/A",
      "recommended_difficulty": "N/A",
      "confidence": 0.35
    }
  ],
  "recommendations": [
    {
      "resource_id": "RES-001",
      "title": "Unity Fundamentals: Core Engine Architecture & Scene Workflow",
      "resource_type": "article",
      "difficulty": "beginner",
      "target_skill": "General",
      "match_score": 0.62
    },
    {
      "resource_id": "RES-002",
      "title": "Beginner Gameplay Scripting with C# in Unity",
      "resource_type": "article",
      "difficulty": "easy",
      "target_skill": "General",
      "match_score": 0.57
    }
  ],
  "risk": {
    "risk_level": "NORMAL",
    "risk_score": 0.15,
    "confidence": 0.85
  },
  "intervention": {
    "recommended_action": "CONTINUE_PATH",
    "action_type": "POSITIVE_REINFORCEMENT",
    "urgency": "LOW"
  },
  "metadata": {
    "model1_version": "1.0.0",
    "model2_version": "v2",
    "model3_version": "recommendation-v2",
    "model4_version": "1.0.0",
    "model5_version": "1.0.0",
    "schema_version": "1.0",
    "execution_time_ms": 145.73,
    "timestamp": "2026-09-26T18:29:18.494337+00:00"
  }
}
```

---

## 5. Individual Model Endpoints

Each underlying model can also be queried independently via the Gateway using the same canonical `CommonStudentInput` schema:

### `POST /api/ml/interest`
Executes Model 5 (Student Interest Prediction). Returns inferred concepts, confidence scores, and trends.

### `POST /api/ml/skill-gap`
Executes Model 1 (Skill Gap Prediction). Returns predicted skill readiness, gaps, and curriculum priorities.

### `POST /api/ml/mastery`
Executes Model 2 (Mastery & Adaptive Difficulty). Returns skill mastery levels and difficulty recommendations.

### `POST /api/ml/recommendations`
Executes Model 3 (Resource Recommendations). Returns ranked educational materials tailored to the student.

### `POST /api/ml/risk`
Executes Model 4 (Learning Risk & Intervention). Returns risk classification, dropout probability, and intervention actions.

---

## 6. Error Responses

All errors conform to RFC 7807 problem details:

```json
{
  "model": "model1",
  "error_code": "MODEL_UNAVAILABLE",
  "message": "Model 1 is currently offline and unreachable.",
  "retryable": true,
  "details": {"url": "http://127.0.0.1:5001"}
}
```

### Common HTTP Status Codes:
- `200 OK`: Request succeeded.
- `400 Bad Request`: Invalid request structure or missing required fields (`student_id`).
- `422 Unprocessable Entity`: Schema validation error.
- `500 Internal Server Error`: Unhandled model inference exception.
- `503 Service Unavailable`: Target model microservice unreachable and in-process fallback disabled.
