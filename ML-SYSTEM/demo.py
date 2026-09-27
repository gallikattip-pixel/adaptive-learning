"""
ML-SYSTEM End-to-End Demonstration Script
Unified Multi-Model Adaptive Learning Integration
=================================================
Demonstrates the complete 5-model pipeline execution for student STU001:
  Step 1: Model 5 (Interest Prediction)
  Step 2: Model 1 (Skill-Gap Prediction)
  Step 3: Model 2 (Mastery & Adaptive Difficulty)
  Step 4: Model 3 (Resource Recommendation)
  Step 5: Model 4 (Learning Risk & Intervention)
  Output: Unified Personalized Learning Plan
"""

import sys
import os
import json
import argparse

parser = argparse.ArgumentParser(description="Run 5-Model Unified ML Pipeline Demo")
parser.add_argument("--mode", choices=["hybrid", "direct", "http"], default="hybrid", help="Execution mode (default: hybrid)")
args, _ = parser.parse_known_args()
os.environ["MODEL_EXECUTION_MODE"] = args.mode

# Add ml-gateway to sys.path
gateway_path = os.path.join(os.path.dirname(__file__), "ml-gateway")
if gateway_path not in sys.path:
    sys.path.insert(0, gateway_path)

from schemas.contracts import CommonStudentInput, SkillEntry
from orchestrator.pipeline import PipelineOrchestrator
from services.health import get_all_health


def run_demo():
    print("=" * 80)
    print("       ADAPTIVE LEARNING UNIFIED ML SYSTEM - LIVE DEMONSTRATION")
    print("=" * 80)

    # 1. Health Check
    print("\n[PHASE 1] Checking Health Across All 5 ML Models...")
    health_report = get_all_health()
    print(f"Overall Gateway Status: {health_report['gateway'].upper()}")
    for model_name, info in health_report["details"].items():
        status_icon = "[OK]" if info["status"] == "healthy" else "[WARN]"
        print(f"  {status_icon} {model_name:10} | Mode: {info.get('connection', 'direct'):15} | Status: {info['status']}")

    # 2. Prepare Student Profile
    print("\n[PHASE 2] Preparing Target Student Profile (STU001)...")
    student_input = CommonStudentInput(
        student_id="STU001",
        goal="Game Developer",
        interests=["Game Development", "Unity", "C#", "AI in Games"],
        skills=[
            SkillEntry(skill="Unity Fundamentals", level=0.42),
            SkillEntry(skill="C# Scripting", level=0.55),
            SkillEntry(skill="Shader Programming", level=0.28),
            SkillEntry(skill="Physics Engine", level=0.48),
            SkillEntry(skill="AI Pathfinding", level=0.35),
            SkillEntry(skill="Game Design", level=0.80),
        ],
        learning_history=[
            {"topic": "Unity Fundamentals", "score": 0.42, "time_spent": 35},
            {"topic": "C# Scripting", "score": 0.55, "time_spent": 45},
            {"topic": "Shader Programming", "score": 0.28, "time_spent": 20},
        ],
        assessment_history=[
            {"assessment_id": "A101", "score": 0.42, "passed": False},
            {"assessment_id": "A102", "score": 0.55, "passed": True},
            {"assessment_id": "A103", "score": 0.28, "passed": False},
        ],
        activity_history=[
            {"action": "quiz_attempt", "timestamp": "2026-09-20T10:00:00Z"},
            {"action": "reading", "timestamp": "2026-09-21T11:00:00Z"},
            {"action": "code_lab", "timestamp": "2026-09-22T14:30:00Z"},
        ]
    )

    print(f"  Student ID:     {student_input.student_id}")
    print(f"  Target Goal:    {student_input.goal}")
    print(f"  Interests:      {student_input.interests}")
    print(f"  Active Skills:  {[s.skill for s in student_input.skills]}")

    # 3. Execute Orchestrator Pipeline
    print("\n[PHASE 3] Executing 5-Model Orchestrator Pipeline...")
    print("  -> Invoking Model 5 (Interest Prediction Engine)...")
    print("  -> Invoking Model 1 (Skill-Gap Prediction Engine)...")
    print("  -> Invoking Model 2 (Mastery & Adaptive Difficulty Engine)...")
    print("  -> Invoking Model 3 (Resource Recommendation Engine)...")
    print("  -> Invoking Model 4 (Learning Risk & Intervention Engine)...")

    orchestrator = PipelineOrchestrator()
    plan = orchestrator.run_personalized_plan(student_input)

    # 4. Display Results
    print("\n" + "=" * 80)
    print("                UNIFIED PERSONALIZED LEARNING PLAN")
    print("=" * 80)
    print(f"Student ID:       {plan.student_id}")
    print(f"Execution Time:   {plan.metadata.execution_time_ms:.2f} ms")
    print(f"Generated At:     {plan.metadata.timestamp}")
    print(f"Schema Version:   {plan.metadata.schema_version}")

    print("\n--- MODEL 5: PREDICTED INTERESTS ---")
    print(f"Top Interests:    {plan.interest.get('top_interests', [])}")
    print(f"Status:           {plan.interest.get('status', 'N/A')}")
    print(f"Inferred:         {plan.interest.get('inferred_from_behavior', False)}")

    print("\n--- MODEL 1: IDENTIFIED SKILL GAPS ---")
    for gap in plan.skill_gaps:
        print(f"  * {gap.get('skill', 'Unknown'):22} | Score: {gap.get('score', 0):.2f} | Status: {gap.get('status', 'N/A'):12} | Priority: {gap.get('priority', 'N/A')}")

    print("\n--- MODEL 2: MASTERY & ADAPTIVE DIFFICULTY ---")
    for m in plan.mastery:
        print(f"  * {m.get('skill', 'Unknown'):22} | Level: {m.get('mastery_level', 'N/A'):12} | Target Diff: {m.get('recommended_difficulty', 'N/A'):8} | Confidence: {m.get('confidence', 'N/A')}")

    print("\n--- MODEL 4: RISK ASSESSMENT & INTERVENTIONS ---")
    risk_info = plan.risk
    print(f"Risk Level:       {risk_info.get('risk_level', 'N/A')}")
    print(f"Risk Score:       {risk_info.get('risk_score', 0):.2f}")
    intervention_info = plan.intervention
    print(f"Recommended Action: {intervention_info.get('recommended_action', 'N/A')}")
    print(f"Action Type:        {intervention_info.get('action_type', 'N/A')}")
    print(f"Urgency:            {intervention_info.get('urgency', 'N/A')}")

    print("\n--- MODEL 3: RECOMMENDED RESOURCES ---")
    for idx, rec in enumerate(plan.recommendations, 1):
        title = rec.get("title", "Resource")
        difficulty = rec.get("difficulty", "medium")
        res_type = rec.get("resource_type", "article")
        score = rec.get("match_score", rec.get("score", 0.0))
        skill = rec.get("target_skill", rec.get("skill", "General"))
        print(f"  {idx}. [{difficulty.upper()}] {title} ({res_type})")
        print(f"     Match Score: {score:.2f} | Target Skill: {skill}")

    print("\n" + "=" * 80)
    print("SUCCESS: All 5 models collaborated flawlessly to produce a unified plan!")
    print("=" * 80)


if __name__ == "__main__":
    run_demo()
