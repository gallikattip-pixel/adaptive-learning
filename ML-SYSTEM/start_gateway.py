"""
ML Gateway Server Startup Script
Launches the Unified ML Gateway on port 5100 (or ML_GATEWAY_PORT).
"""

import sys
import os
import uvicorn

# Ensure ml-gateway is in sys.path
gateway_path = os.path.join(os.path.dirname(__file__), "ml-gateway")
if gateway_path not in sys.path:
    sys.path.insert(0, gateway_path)

from config import ML_GATEWAY_HOST, ML_GATEWAY_PORT

if __name__ == "__main__":
    print("=" * 70)
    print(f"Starting ML Gateway on {ML_GATEWAY_HOST}:{ML_GATEWAY_PORT}")
    print(f"Interactive Swagger Docs: http://localhost:{ML_GATEWAY_PORT}/docs")
    print(f"Health Check:             http://localhost:{ML_GATEWAY_PORT}/api/ml/health")
    print(f"Personalized Plan:        http://localhost:{ML_GATEWAY_PORT}/api/ml/personalized-plan")
    print("=" * 70)
    uvicorn.run("app:app", host=ML_GATEWAY_HOST, port=ML_GATEWAY_PORT, reload=False, app_dir=gateway_path)
