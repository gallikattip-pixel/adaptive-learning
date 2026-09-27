# Adaptive Learning Backend Integration Guide

This guide explains how to integrate web applications, backend services, or learning management systems (LMS) with the **Adaptive Learning Unified ML Gateway**.

---

## 1. System Integration Overview

The ML Gateway acts as the central intelligence engine for the Adaptive Learning platform. Rather than having application backends orchestrate 5 separate model services individually, the backend communicates exclusively with the **ML Gateway** at:

```text
http://localhost:5100
```

### Discovery Note on Existing Workspace
During filesystem inspection across the host environment, all 5 ML model repositories (`Model-1`, `model2`, `model3`, `model4`, `model-5`) were discovered and verified. However, no separate `Adaptive Learning` backend or frontend web application directory was present on disk. 

To ensure seamless integration whenever your backend application is deployed or developed, this repository provides:
1. Canonical REST endpoints (`/api/ml/...`).
2. A turnkey Python Client SDK (`ml_client.py`).
3. Standardized payload schemas.

---

## 2. Quick Integration with Python Backends

If your backend is built in Python (FastAPI, Django, Flask, Celery), use the bundled `ml_client.py`:

```python
from ml_client import MLGatewayClient, MLClientError

# Initialize client pointing to Gateway
ml_client = MLGatewayClient(base_url="http://localhost:5100", timeout_seconds=5.0)

def generate_student_dashboard(student_id: str):
    payload = {
        "student_id": student_id,
        "goal": "Game Developer",
        "interests": ["Game Development", "Unity", "C#"],
        "skills": [
            {"skill": "Unity Fundamentals", "level": 0.45},
            {"skill": "C# Scripting", "level": 0.60}
        ],
        "learning_history": [
            {"topic": "Unity Fundamentals", "score": 0.45}
        ],
        "assessment_history": [
            {"assessment_id": "A1", "score": 0.45, "passed": False}
        ]
    }

    try:
        # Full 5-model pipeline
        plan = ml_client.get_personalized_plan(payload)

        # Access model outputs
        predicted_interests = plan["interest"]["top_interests"]
        skill_gaps = plan["skill_gaps"]
        recommended_difficulty = plan["mastery"][0]["recommended_difficulty"]
        resources = plan["recommendations"]
        risk = plan["risk"]

        return {
            "status": "success",
            "plan_id": plan["metadata"]["timestamp"],
            "difficulty": recommended_difficulty,
            "resources": resources,
            "risk_level": risk["risk_level"]
        }

    except MLClientError as e:
        print(f"ML Gateway error: {e}")
        # Implement fallback or default recommendations
        return {"status": "degraded", "error": str(e)}
```

---

## 3. Integration with Node.js / Express Backends

If your backend is built in JavaScript / TypeScript (Node.js, Next.js, Express):

```typescript
import axios from 'axios';

const ML_GATEWAY_URL = process.env.ML_GATEWAY_URL || 'http://localhost:5100';

interface StudentInput {
  student_id: string;
  goal: string;
  interests: string[];
  skills: Array<{ skill: string; level: number }>;
}

export async function fetchPersonalizedPlan(student: StudentInput) {
  try {
    const response = await axios.post(
      `${ML_GATEWAY_URL}/api/ml/personalized-plan`,
      student,
      { timeout: 8000 }
    );
    return response.data;
  } catch (error: any) {
    if (error.response) {
      console.error(`ML Gateway Error (${error.response.status}):`, error.response.data);
    } else {
      console.error('Network failure contacting ML Gateway:', error.message);
    }
    throw error;
  }
}
```

---

## 4. Endpoints Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/ml/health` | Health status of Gateway and all 5 underlying models |
| `GET` | `/api/ml/metadata` | Metadata, model versions, and configuration details |
| `POST` | `/api/ml/personalized-plan` | Primary unified pipeline (executes M5 -> M1 -> M2 -> M3 -> M4) |
| `POST` | `/api/ml/interest` | Direct invocation of Model 5 (Interest Prediction) |
| `POST` | `/api/ml/skill-gap` | Direct invocation of Model 1 (Skill-Gap Prediction) |
| `POST` | `/api/ml/mastery` | Direct invocation of Model 2 (Mastery & Difficulty) |
| `POST` | `/api/ml/recommendations` | Direct invocation of Model 3 (Resource Recommendations) |
| `POST` | `/api/ml/risk` | Direct invocation of Model 4 (Learning Risk & Intervention) |

---

## 5. Configuration & Environment Variables

Configure the ML Gateway using environment variables or a `.env` file in `ML-SYSTEM/ml-gateway/`:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `ML_GATEWAY_PORT` | `5100` | Port for the ML Gateway server |
| `ML_GATEWAY_HOST` | `0.0.0.0` | Host bind address |
| `MODEL_EXECUTION_MODE` | `hybrid` | Execution mode: `hybrid`, `direct`, or `http` |
| `SERVICE_TIMEOUT_SECONDS` | `5.0` | Timeout for external HTTP microservice calls |
| `MODEL1_URL` | `http://127.0.0.1:5001` | URL for Model 1 microservice |
| `MODEL2_URL` | `http://127.0.0.1:5002` | URL for Model 2 microservice |
| `MODEL3_URL` | `http://127.0.0.1:5003` | URL for Model 3 microservice |
| `MODEL4_URL` | `http://127.0.0.1:5004` | URL for Model 4 microservice |
| `MODEL5_URL` | `http://127.0.0.1:5005` | URL for Model 5 microservice |
| `DESKTOP_DIR` | `C:\Users\MAHALAXMI\OneDrive\Desktop` | Base path containing model directories |

---

## 6. Error Handling & Retry Policies

When calling the ML Gateway:
- **Timeout Policy:** Set client timeouts between `5` and `10` seconds. In direct mode, the pipeline executes in ~150ms.
- **Retry Policy:** Do NOT retry on `400 Bad Request` or `422 Unprocessable Entity`. Retry up to 2 times with exponential backoff on `503 Service Unavailable` or transient connection timeouts.
- **Health Checks:** Backends can poll `GET /api/ml/health` periodically or on startup to verify connectivity.
