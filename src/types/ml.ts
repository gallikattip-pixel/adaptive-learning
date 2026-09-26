/**
 * ML Service Interface Definitions
 * Prepared for real-time model integration via API gateway endpoints.
 */

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
