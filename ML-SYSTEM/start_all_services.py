"""
Unified Service Manager for Adaptive Learning ML System
======================================================
Usage:
  python start_all_services.py                # Starts ML Gateway in Hybrid/Direct mode (port 5100)
  python start_all_services.py --microservices# Starts all 5 microservices on ports 5001-5005 + Gateway on 5100
"""

import sys
import os
import subprocess
import time
import argparse
import signal

PYTHON_EXE = sys.executable
GATEWAY_DIR = os.path.join(os.path.dirname(__file__), "ml-gateway")
if GATEWAY_DIR not in sys.path:
    sys.path.insert(0, GATEWAY_DIR)

from config import MODEL1_DIR, MODEL2_DIR, MODEL3_DIR, MODEL4_DIR, MODEL5_DIR, ML_GATEWAY_HOST, ML_GATEWAY_PORT


def start_standalone_gateway():
    """Starts the ML Gateway server."""
    print("=" * 70)
    print(f"Starting ML Gateway (Port {ML_GATEWAY_PORT})...")
    print("Execution Mode: Hybrid (Supports in-process fallback and HTTP microservices)")
    print(f"Interactive Docs: http://localhost:{ML_GATEWAY_PORT}/docs")
    print("=" * 70)
    cmd = [PYTHON_EXE, "-m", "uvicorn", "app:app", "--host", ML_GATEWAY_HOST, "--port", str(ML_GATEWAY_PORT), "--app-dir", GATEWAY_DIR]
    subprocess.run(cmd)


def start_all_microservices():
    """Starts individual model servers and the Gateway."""
    processes = []
    print("=" * 70)
    print("Launching All 5 Model Microservices + Gateway...")
    print("=" * 70)

    try:
        # Model 1
        m1_dir = str(MODEL1_DIR)
        if os.path.exists(m1_dir):
            print("Starting Model 1 (FastAPI on Port 5001)...")
            p1 = subprocess.Popen(
                [PYTHON_EXE, "-m", "uvicorn", "src.api:app", "--port", "5001"],
                cwd=m1_dir
            )
            processes.append(("Model 1", p1))

        # Model 2
        m2_dir = str(MODEL2_DIR)
        if os.path.exists(m2_dir):
            print("Starting Model 2 (Flask on Port 5002)...")
            # Flask app run
            m2_code = "from src.api.routes import app; app.run(port=5002)"
            p2 = subprocess.Popen(
                [PYTHON_EXE, "-c", m2_code],
                cwd=m2_dir
            )
            processes.append(("Model 2", p2))

        # Model 3
        m3_dir = str(MODEL3_DIR)
        if os.path.exists(m3_dir):
            print("Starting Model 3 (Flask on Port 5003)...")
            p3 = subprocess.Popen(
                [PYTHON_EXE, "src/api/app.py"],
                cwd=m3_dir
            )
            processes.append(("Model 3", p3))

        time.sleep(2)

        # Gateway
        print("Starting ML Gateway Orchestrator (Port 5100)...")
        p_gw = subprocess.Popen(
            [PYTHON_EXE, "-m", "uvicorn", "app:app", "--port", "5100", "--app-dir", GATEWAY_DIR]
        )
        processes.append(("Gateway", p_gw))

        print("\nAll services launched! Press Ctrl+C to terminate all services.")
        while True:
            time.sleep(1)

    except KeyboardInterrupt:
        print("\nShutting down all services...")
    finally:
        for name, p in processes:
            print(f"Terminating {name} (PID: {p.pid})...")
            p.terminate()
            p.wait()
        print("All services stopped.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Adaptive Learning ML Service Launcher")
    parser.add_argument("--microservices", action="store_true", help="Launch individual model microservices")
    args = parser.parse_args()

    if args.microservices:
        start_all_microservices()
    else:
        start_standalone_gateway()
