"""
Configuration and Environment Settings for ML Gateway.
"""

import os
from pathlib import Path
from typing import Dict, Any

# Root directory of ML Gateway
GATEWAY_ROOT = Path(__file__).resolve().parent


def _resolve_model_dir(folder_name: str, env_var: str) -> Path:
    """Dynamically resolves model repository directory from environment or standard search locations."""
    if os.environ.get(env_var):
        return Path(os.environ[env_var]).resolve()

    candidates = []
    if os.environ.get("MODELS_DIR"):
        candidates.append(Path(os.environ["MODELS_DIR"]) / folder_name)
    if os.environ.get("DESKTOP_DIR"):
        candidates.append(Path(os.environ["DESKTOP_DIR"]) / "integrate" / folder_name)
        candidates.append(Path(os.environ["DESKTOP_DIR"]) / folder_name)

    home = Path.home()
    candidates.extend([
        home / "OneDrive" / "Desktop" / "integrate" / folder_name,
        home / "OneDrive" / "Desktop" / folder_name,
        home / "Desktop" / "integrate" / folder_name,
        home / "Desktop" / folder_name,
        GATEWAY_ROOT.parent.parent / "integrate" / folder_name,
        GATEWAY_ROOT.parent.parent / folder_name,
    ])

    for cand in candidates:
        if cand.exists() and cand.is_dir():
            return cand.resolve()

    return candidates[0] if candidates else Path(folder_name)


MODEL1_DIR = _resolve_model_dir("Model-1", "MODEL1_DIR")
MODEL2_DIR = _resolve_model_dir("model2", "MODEL2_DIR")
MODEL3_DIR = _resolve_model_dir("model3", "MODEL3_DIR")
MODEL4_DIR = _resolve_model_dir("model4", "MODEL4_DIR")
MODEL5_DIR = _resolve_model_dir("model-5", "MODEL5_DIR")

# Base Desktop Paths for Model Repositories (backward compatibility)
DESKTOP_DIR = Path(os.environ.get("DESKTOP_DIR", str(MODEL1_DIR.parent)))

# Service URLs
MODEL1_URL = os.environ.get("MODEL1_URL", "http://127.0.0.1:5001")
MODEL2_URL = os.environ.get("MODEL2_URL", "http://127.0.0.1:5002")
MODEL3_URL = os.environ.get("MODEL3_URL", "http://127.0.0.1:5003")
MODEL4_URL = os.environ.get("MODEL4_URL", "http://127.0.0.1:5004")
MODEL5_URL = os.environ.get("MODEL5_URL", "http://127.0.0.1:5005")

# Gateway Server Port
ML_GATEWAY_PORT = int(os.environ.get("ML_GATEWAY_PORT", 5100))
ML_GATEWAY_HOST = os.environ.get("ML_GATEWAY_HOST", "0.0.0.0")

# Execution Mode: "hybrid" (tries HTTP service first, falls back to direct module if enabled),
# "http" (strictly calls remote HTTP service), or "direct" (in-process)
MODEL_EXECUTION_MODE = os.environ.get("MODEL_EXECUTION_MODE", "hybrid")

# HTTP Request Timeout in seconds
SERVICE_TIMEOUT_SECONDS = float(os.environ.get("SERVICE_TIMEOUT_SECONDS", 5.0))

# Schema Version
GATEWAY_SCHEMA_VERSION = "1.0"

