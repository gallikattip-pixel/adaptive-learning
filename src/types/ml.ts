/**
 * ML Service Interface Definitions
 * Prepared for real-time model integration via API gateway endpoints.
 */

// ---------------------------------------------------------------------------
// Unified Personalized Plan Contract (Stage B3/B4 Response)
// ---------------------------------------------------------------------------

export interface GatewayMetadata {
  model1_version?: string;
  model2_version?: string;
  model3_version?: string;
  model4_version?: string;
  model5_version?: string;
  schema_version: string;
  execution_time_ms?: number;
  timestamp?: string;
}

export interface SkillGapItem {
  skill: string;
  score: number;
  status: string; // STRONG | DEVELOPING | WEAK | NOT_READY
  priority: string; // HIGH | MEDIUM | LOW
  confidence?: number;
  evidence_count?: number;
  evidence?: Record<string, any>;
  prerequisite_status?: string | null;
}

export interface MasteryItem {
  skill: string;
  mastery_probability: number;
  mastery_status: string; // MASTERED | DEVELOPING | NOT_MASTERED
  recommended_next_difficulty: string; // EASY | MEDIUM | HARD
  confidence?: number;
  evidence?: Record<string, any>;
}

export interface ResourceRecommendation {
  resource_id: string;
  title: string;
  concept?: string;
  difficulty: string;
  score?: number;
  match_reasons?: string[];
  prerequisites_met?: boolean;
  estimated_minutes?: number;
}

export interface YouTubeVideoRecommendation {
  video_id: string;
  title: string;
  channel_title: string;
  thumbnail_url: string;
  youtube_url: string;
  embed_url: string;
  target_skill: string;
  concept: string;
  difficulty: string;
  estimated_minutes?: number;
  reason: string;
}

export interface RiskAssessment {
  risk_level: string; // NORMAL | AT_RISK | NEEDS_INTERVENTION
  risk_score: number;
  confidence?: number;
  evidence?: Record<string, any>;
}

export interface InterventionRecommendation {
  recommended_action: string;
  action_type: string;
  urgency: string;
  suggested_difficulty?: string | null;
  resource_adjustments?: any;
}

export interface InterestSignal {
  concept?: string;
  score?: number;
  confidence?: number;
  top_interests?: string[];
  interests?: any[];
  [key: string]: any;
}

export interface UnifiedPersonalizedPlan {
  student_id: string;
  interest: InterestSignal;
  skill_gaps: SkillGapItem[];
  mastery: MasteryItem[];
  recommendations: ResourceRecommendation[];
  video_recommendations?: YouTubeVideoRecommendation[];
  risk: RiskAssessment;
  intervention: InterventionRecommendation;
  metadata: GatewayMetadata;
}

// ---------------------------------------------------------------------------
// Legacy Model Endpoints Types
// ---------------------------------------------------------------------------

// 1. Skill-Gap Prediction
export interface SkillGapPredictionRequest {
  studentId: string;
  targetSkillId: string;
  recentAssessmentIds?: string[];
}

export interface IdentifiedSkillGap {
  skillId: string;
  skillTitle: string;
  prerequisiteDepth: number;
  gapSeverity: 'low' | 'moderate' | 'critical';
  confidenceScore: number;
}

export interface SkillGapPredictionResponse {
  studentId: string;
  targetSkillId: string;
  gapsIdentified: IdentifiedSkillGap[];
  timestamp: string;
}

// 2. Resource Recommendation
export interface ResourceRecommendationRequest {
  studentId: string;
  activeGapSkillId: string;
  preferredFormats?: ('interactive' | 'text' | 'video' | 'practice')[];
  maxResults?: number;
}

export interface RecommendedResourceItem {
  resourceId: string;
  title: string;
  format: 'interactive' | 'text' | 'video' | 'practice';
  estimatedMinutes: number;
  difficultyRating: number;
  matchScore: number;
}

export interface ResourceRecommendationResponse {
  studentId: string;
  targetSkillId: string;
  recommendations: RecommendedResourceItem[];
  timestamp: string;
}

// 3. Adaptive Difficulty
export interface AdaptiveDifficultyConfigRequest {
  studentId: string;
  skillId: string;
  recentItemSuccessRate?: number;
}

export type DifficultyLevel = 'remedial' | 'foundational' | 'intermediate' | 'advanced' | 'challenge';

export interface AdaptiveDifficultyConfigResponse {
  studentId: string;
  skillId: string;
  recommendedDifficulty: DifficultyLevel;
  itemParameters: {
    targetItemDiscrimination: number;
    targetItemDifficulty: number;
    timeAllocationSeconds: number;
  };
  timestamp: string;
}

// 4. Learning-Risk Prediction
export interface LearningRiskPredictionRequest {
  studentId: string;
  pathwayId: string;
}

export interface LearningRiskFactor {
  factorCode: string;
  description: string;
  impactWeight: number;
}

export interface LearningRiskPredictionResponse {
  studentId: string;
  pathwayId: string;
  riskCategory: 'nominal' | 'elevated' | 'high_stagnation';
  riskScore: number; // 0.0 to 1.0
  contributingFactors: LearningRiskFactor[];
  recommendedActionCode: string;
  timestamp: string;
}

// 5. Interest Prediction (Optional)
export interface InterestPredictionRequest {
  studentId: string;
}

export interface InferredInterestDomain {
  domainId: string;
  domainName: string;
  affinityScore: number; // 0.0 to 1.0
}

export interface InterestPredictionResponse {
  studentId: string;
  primaryInterests: InferredInterestDomain[];
  timestamp: string;
}
