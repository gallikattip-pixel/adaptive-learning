"""
ML Pipeline Orchestrator for 5-Model Unified Architecture.
Coordinates data flow across:
Model 5 (Interest) + Model 1 (Skill Gap) + Model 2 (Mastery)
  -> Model 3 (Recommendation)
    -> Model 4 (Risk & Intervention)
      -> Unified Personalized Learning Plan
"""

import time
import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from schemas.contracts import (
    CommonStudentInput,
    UnifiedPersonalizedPlan,
    GatewayMetadata,
)
from adapters.model1_adapter import Model1GatewayAdapter
from adapters.model2_adapter import Model2GatewayAdapter
from adapters.model3_adapter import Model3GatewayAdapter
from adapters.model4_adapter import Model4GatewayAdapter
from adapters.model5_adapter import Model5GatewayAdapter
from config import GATEWAY_SCHEMA_VERSION

logger = logging.getLogger(__name__)


class PipelineOrchestrator:
    """
    Executes the 5-model unified integration pipeline.
    """

    def __init__(self):
        self.m1_adapter = Model1GatewayAdapter
        self.m2_adapter = Model2GatewayAdapter
        self.m3_adapter = Model3GatewayAdapter
        self.m4_adapter = Model4GatewayAdapter
        self.m5_adapter = Model5GatewayAdapter

    def run_personalized_plan(self, student: CommonStudentInput) -> UnifiedPersonalizedPlan:
        """
        Executes the full pedagogical learning plan generation pipeline.
        """
        start_time = time.perf_counter()
        latencies = {}

        # -------------------------------------------------------------
        # STEP 1: MODEL 5 — Student Interest Prediction
        # -------------------------------------------------------------
        t0 = time.perf_counter()
        m5_output = self.m5_adapter.predict(student)
        latencies["model5_ms"] = round((time.perf_counter() - t0) * 1000, 2)

        # -------------------------------------------------------------
        # STEP 2: MODEL 1 — Skill Gap Prediction
        # -------------------------------------------------------------
        t0 = time.perf_counter()
        m1_output = self.m1_adapter.predict(student)
        latencies["model1_ms"] = round((time.perf_counter() - t0) * 1000, 2)

        # -------------------------------------------------------------
        # STEP 3: MODEL 2 — Mastery + Adaptive Difficulty
        # -------------------------------------------------------------
        t0 = time.perf_counter()
        m2_output = self.m2_adapter.predict(student, model1_output=m1_output)
        latencies["model2_ms"] = round((time.perf_counter() - t0) * 1000, 2)

        # -------------------------------------------------------------
        # STEP 4: MODEL 3 — Resource Recommendation (uses 1, 2, 5)
        # -------------------------------------------------------------
        t0 = time.perf_counter()
        m3_output = self.m3_adapter.predict(
            student=student,
            model1_output=m1_output,
            model2_output=m2_output,
            model5_output=m5_output,
            top_k=5,
        )
        latencies["model3_ms"] = round((time.perf_counter() - t0) * 1000, 2)

        # -------------------------------------------------------------
        # STEP 5: MODEL 4 — Learning Risk & Intervention (uses 1, 2, 3)
        # -------------------------------------------------------------
        t0 = time.perf_counter()
        m4_output = self.m4_adapter.predict(
            student=student,
            model1_output=m1_output,
            model2_output=m2_output,
            model3_output=m3_output,
        )
        latencies["model4_ms"] = round((time.perf_counter() - t0) * 1000, 2)

        total_elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

        # Build Unified Personalized Plan
        metadata = GatewayMetadata(
            model1_version=m1_output.get("model_version"),
            model2_version=m2_output.get("model_version"),
            model3_version=m3_output.get("model_version"),
            model4_version=m4_output.get("model_version"),
            model5_version=m5_output.get("model_version"),
            schema_version=GATEWAY_SCHEMA_VERSION,
            execution_time_ms=total_elapsed_ms,
            timestamp=datetime.now(timezone.utc).isoformat(),
        )

        return UnifiedPersonalizedPlan(
            student_id=student.student_id,
            interest=m5_output,
            skill_gaps=m1_output.get("skills", []),
            mastery=m2_output.get("mastery_evaluations", []),
            recommendations=m3_output.get("recommendations", []),
            risk=m4_output.get("risk_assessment", {}),
            intervention=m4_output.get("intervention", {}),
            metadata=metadata,
        )

    # -----------------------------------------------------------------
    # Partial Execution Methods
    # -----------------------------------------------------------------

    def run_interest(self, student: CommonStudentInput) -> Dict[str, Any]:
        return self.m5_adapter.predict(student)

    def run_skill_gap(self, student: CommonStudentInput) -> Dict[str, Any]:
        return self.m1_adapter.predict(student)

    def run_mastery(self, student: CommonStudentInput) -> Dict[str, Any]:
        return self.m2_adapter.predict(student)

    def run_recommendations(
        self,
        student: CommonStudentInput,
        model1_output: Optional[Dict[str, Any]] = None,
        model2_output: Optional[Dict[str, Any]] = None,
        model5_output: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        return self.m3_adapter.predict(
            student=student,
            model1_output=model1_output,
            model2_output=model2_output,
            model5_output=model5_output,
        )

    def run_risk(
        self,
        student: CommonStudentInput,
        model1_output: Optional[Dict[str, Any]] = None,
        model2_output: Optional[Dict[str, Any]] = None,
        model3_output: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        return self.m4_adapter.predict(
            student=student,
            model1_output=model1_output,
            model2_output=model2_output,
            model3_output=model3_output,
        )
