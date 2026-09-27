"""
Canonical API Contracts and Schemas for ML Gateway.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Canonical Student Input Contract (Section 6 & 14)
# ---------------------------------------------------------------------------

class SkillEntry(BaseModel):
    skill: str
    level: float = 0.50
    confidence: Optional[float] = None


class CommonStudentInput(BaseModel):
    student_id: str
    goal: Optional[str] = "Game Developer"
    interests: List[str] = Field(default_factory=list)
    skills: List[SkillEntry] = Field(default_factory=list)
    learning_history: List[Dict[str, Any]] = Field(default_factory=list)
    assessment_history: List[Dict[str, Any]] = Field(default_factory=list)
    resource_history: List[Dict[str, Any]] = Field(default_factory=list)
    activity_history: List[Dict[str, Any]] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Model 5 Interest Contract
# ---------------------------------------------------------------------------

class InterestItem(BaseModel):
    concept: str
    score: float
    confidence: float = 0.50
    evidence_sources: List[str] = Field(default_factory=list)
    trend: str = "stable"


class InterestResponse(BaseModel):
    status: str = "available"
    student_id: str
    top_interests: List[str] = Field(default_factory=list)
    interests: List[Dict[str, Any]] = Field(default_factory=list)
    inferred_from_behavior: bool = False
    model_version: str = "interest-v1"


# ---------------------------------------------------------------------------
# Model 1 Skill Gap Contract
# ---------------------------------------------------------------------------

class SkillGapItemOutput(BaseModel):
    skill: str
    score: float
    status: str  # STRONG, DEVELOPING, WEAK, NOT_READY
    priority: str  # HIGH, MEDIUM, LOW
    confidence: float = 0.50
    evidence_count: int = 0
    prerequisite_status: Optional[str] = None


class SkillGapResponse(BaseModel):
    status: str = "available"
    student_id: str
    overall_skill_score: float = 0.50
    skills: List[SkillGapItemOutput] = Field(default_factory=list)
    strong_skills: List[str] = Field(default_factory=list)
    developing_skills: List[str] = Field(default_factory=list)
    skill_gaps: List[str] = Field(default_factory=list)
    learning_priorities: List[Dict[str, Any]] = Field(default_factory=list)
    model_version: str = "skill-gap-model-v1"


# ---------------------------------------------------------------------------
# Model 2 Mastery & Adaptive Difficulty Contract
# ---------------------------------------------------------------------------

class MasteryItemOutput(BaseModel):
    skill: str
    mastery_probability: float
    mastery_status: str  # MASTERED, DEVELOPING, NOT_MASTERED
    recommended_next_difficulty: str  # EASY, MEDIUM, HARD
    confidence: Any = 0.50


class MasteryResponse(BaseModel):
    status: str = "available"
    student_id: str
    mastery_evaluations: List[MasteryItemOutput] = Field(default_factory=list)
    model_version: str = "mastery-v2"
    schema_version: str = "1.0"


# ---------------------------------------------------------------------------
# Model 3 Recommendation Contract
# ---------------------------------------------------------------------------

class RecommendedResourceItem(BaseModel):
    resource_id: str
    title: str
    concept: str
    difficulty: str
    score: float
    match_reasons: List[str] = Field(default_factory=list)
    prerequisites_met: bool = True


class RecommendationResponse(BaseModel):
    status: str = "available"
    student_id: str
    recommended_resources: List[RecommendedResourceItem] = Field(default_factory=list)
    recommendation_metadata: Dict[str, Any] = Field(default_factory=dict)
    model_version: str = "recommendation-v2"


# ---------------------------------------------------------------------------
# Model 4 Risk & Intervention Contract
# ---------------------------------------------------------------------------

class RiskAssessmentOutput(BaseModel):
    risk_level: str  # NORMAL, AT_RISK, NEEDS_INTERVENTION
    risk_score: float
    confidence: float = 0.50
    evidence: Dict[str, Any] = Field(default_factory=dict)


class InterventionOutput(BaseModel):
    recommended_action: str
    action_type: str
    urgency: str
    suggested_difficulty: Optional[str] = None
    resource_adjustments: Optional[Dict[str, Any]] = None


class RiskResponse(BaseModel):
    status: str = "available"
    student_id: str
    risk_assessment: RiskAssessmentOutput
    intervention: InterventionOutput
    model_version: str = "risk-v1"


# ---------------------------------------------------------------------------
# Unified Output Contract (Section 7 & 14)
# ---------------------------------------------------------------------------

class GatewayMetadata(BaseModel):
    model1_version: Optional[str] = None
    model2_version: Optional[str] = None
    model3_version: Optional[str] = None
    model4_version: Optional[str] = None
    model5_version: Optional[str] = None
    schema_version: str = "1.0"
    execution_time_ms: Optional[float] = None
    timestamp: Optional[str] = None


class UnifiedPersonalizedPlan(BaseModel):
    student_id: str
    interest: Dict[str, Any] = Field(default_factory=dict)
    skill_gaps: List[Dict[str, Any]] = Field(default_factory=list)
    mastery: List[Dict[str, Any]] = Field(default_factory=list)
    recommendations: List[Dict[str, Any]] = Field(default_factory=list)
    risk: Dict[str, Any] = Field(default_factory=dict)
    intervention: Dict[str, Any] = Field(default_factory=dict)
    metadata: GatewayMetadata


# ---------------------------------------------------------------------------
# Health and Error Schemas
# ---------------------------------------------------------------------------

class GatewayHealthResponse(BaseModel):
    gateway: str = "healthy"
    models: Dict[str, str] = Field(default_factory=dict)
    timestamp: str


class GatewayErrorResponse(BaseModel):
    model: str
    error_code: str
    message: str
    retryable: bool = False
    details: Optional[Dict[str, Any]] = None
