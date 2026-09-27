# Unified Adaptive Learning ML System

A unified, production-grade Machine Learning Orchestrator and Gateway integrating five independent ML models into a cohesive, high-performance personalization engine for student learning.

---

## 1. System Overview

The **Adaptive Learning Unified ML System** unifies five independently developed machine learning models located across the local desktop environment without altering their underlying predictive logic, retraining weights, or merging disparate codebases:

1. **Model 1 — Skill Gap Prediction Engine** (`Model-1`)
2. **Model 2 — Mastery Assessment & Adaptive Difficulty Engine** (`model2`)
3. **Model 3 — Intelligent Resource Recommendation Engine** (`model3`)
4. **Model 4 — Learning Risk & Proactive Intervention Engine** (`model4`)
5. **Model 5 — Dynamic Student Interest Prediction Engine** (`model-5`)

The system exposes a high-performance **ML Gateway** (FastAPI) on port `5100` that handles student input validation, upstream-to-downstream dependency chaining, namespace isolation, fallback resilience, and response aggregation into a unified **Personalized Learning Plan**.

---

## 2. Directory Structure

```text
ML-SYSTEM/
├── ml-gateway/
│   ├── adapters/                  # Model-specific translation adapters
│   │   ├── isolation.py           # In-process namespace isolation context manager
│   │   ├── model1_adapter.py      # Adapter for Model 1 (Skill Gaps)
│   │   ├── model2_adapter.py      # Adapter for Model 2 (Mastery & Difficulty)
│   │   ├── model3_adapter.py      # Adapter for Model 3 (Resource Recommendations)
│   │   ├── model4_adapter.py      # Adapter for Model 4 (Learning Risk)
│   │   └── model5_adapter.py      # Adapter for Model 5 (Student Interests)
│   ├── orchestrator/
│   │   └── pipeline.py            # Sequential orchestration pipeline (M5 -> M1 -> M2 -> M3 -> M4)
│   ├── schemas/
│   │   └── contracts.py           # Canonical Pydantic schemas and API contracts
│   ├── services/
│   │   ├── errors.py              # Structured error handlers and custom exceptions
│   │   └── health.py              # Multi-model health checking service
│   ├── tests/
│   │   └── test_gateway.py        # Gateway integration test suite (11/11 passing)
│   ├── app.py                     # FastAPI Gateway Application
│   ├── config.py                  # Global settings, paths, URLs, timeouts
│   └── requirements.txt           # Gateway dependencies
├── ml_client.py                   # Python client SDK for backend applications
├── demo.py                        # Runnable end-to-end demonstration script
├── start_gateway.py               # Fast standalone gateway server runner
├── start_gateway.bat              # Windows batch launcher for standalone gateway
├── start_all_services.py          # Process manager for multi-microservice deployment
├── start_all_services.bat         # Windows batch launcher for all services
├── README.md                      # Primary system documentation
├── ARCHITECTURE.md                # Architectural design and dataflow documentation
├── INTEGRATION.md                 # Backend and application integration guide
└── API_CONTRACT.md                # Complete REST API contract and JSON schemas
```

---

## 3. Key Architectural Features

- **Decoupled Architecture:** All 5 models maintain 100% independence. Their original directories, test suites (225 passing standalone tests), artifacts, and codebases remain untouched.
- **Hybrid Execution Engine:**
  - **HTTP Microservice Mode:** Gateway communicates via REST over ports `5001`–`5005`.
  - **In-Process Direct Fallback:** When standalone microservices are not actively booted, the Gateway seamlessly invokes model inference in-process using isolated module environments, delivering sub-200ms latency without requiring multi-process overhead.
- **Zero Namespace Collisions:** Utilizes dynamic `sys.path` and `sys.modules` isolation (`adapters/isolation.py`) ensuring `src`, `config`, and `schemas` modules from different models never collide or cross-contaminate.
- **Fail-Safe Resilience:** Built-in error trapping with standardized RFC 7807 error formats (`MODEL_UNAVAILABLE`, `INVALID_INPUT`, `MODEL_INFERENCE_ERROR`).

---

## 4. Quickstart

### Prerequisites
- Python 3.12+ (64-bit)
- Required packages: `fastapi`, `uvicorn`, `flask`, `pydantic`, `scikit-learn`, `requests`, `pytest`, `pandas`, `numpy`

### Running the End-to-End Demo
To verify the full 5-model pipeline execution with real student data (`STU001` Game Developer):

```powershell
# Run using isolated direct in-process mode (Ultra fast: ~150ms)
python demo.py --mode direct

# Run in hybrid mode (Checks HTTP services first, falls back seamlessly)
python demo.py --mode hybrid
```

### Launching the ML Gateway Server
To run the ML Gateway REST API on `http://localhost:5100`:

```powershell
# Using Python runner
python start_gateway.py

# Or using Windows Batch
start_gateway.bat
```

Once running:
- **Interactive Swagger Docs:** [http://localhost:5100/docs](http://localhost:5100/docs)
- **ReDoc:** [http://localhost:5100/redoc](http://localhost:5100/redoc)
- **Health Check:** `GET http://localhost:5100/api/ml/health`
- **Metadata:** `GET http://localhost:5100/api/ml/metadata`
- **Personalized Plan:** `POST http://localhost:5100/api/ml/personalized-plan`

### Launching All Services (Microservices Mode)
To launch all standalone model servers in separate subprocesses along with the gateway:

```powershell
python start_all_services.py --microservices
```

Ports allocated:
- `5001`: Model 1 (Skill-Gap Prediction - FastAPI)
- `5002`: Model 2 (Mastery & Difficulty - Flask)
- `5003`: Model 3 (Resource Recommendation - Flask)
- `5004`: Model 4 (Learning Risk - Direct/Service)
- `5005`: Model 5 (Interest Prediction - Direct/Service)
- `5100`: ML Gateway Orchestrator (FastAPI)

---

## 5. Verification & Test Suite

The unified integration has been validated across both individual model test suites and comprehensive Gateway integration tests:

| Test Suite | Location | Result | Status |
| :--- | :--- | :--- | :--- |
| **Model 1 Unit Tests** | `Model-1/tests` | 9 passed | Passed (100%) |
| **Model 2 Unit Tests** | `model2/tests` | 62 passed | Passed (100%) |
| **Model 3 Unit Tests** | `model3/tests` | 79 passed | Passed (100%) |
| **Model 4 Unit Tests** | `model4/tests` | 54 passed | Passed (100%) |
| **Model 5 Unit Tests** | `model-5/tests` | 21 passed | Passed (100%) |
| **Gateway Integration Tests** | `ML-SYSTEM/ml-gateway/tests` | 11 passed | Passed (100%) |
| **Total Test Count** | **Unified System** | **236 passed** | **100% Green** |

To run the Gateway integration test suite:

```powershell
pytest ml-gateway/tests/ -v
```

---

## 6. Backend Integration

Any backend application (FastAPI, Django, Express, Ruby on Rails) can consume the ML System using standard HTTP or the bundled Python client library:

```python
from ml_client import MLGatewayClient

client = MLGatewayClient(base_url="http://localhost:5100")

# Generate unified personalized plan
plan = client.get_personalized_plan({
    "student_id": "STU1001",
    "goal": "Game Developer",
    "interests": ["Game Development", "Unity", "C#"],
    "skills": [
        {"skill": "Unity Fundamentals", "level": 0.40},
        {"skill": "C# Scripting", "level": 0.55}
    ]
})

print(f"Risk Level: {plan['risk']['risk_level']}")
print(f"Top Recommendation: {plan['recommendations'][0]['title']}")
```

Refer to `INTEGRATION.md` for full implementation guides and `API_CONTRACT.md` for comprehensive schema specifications.
