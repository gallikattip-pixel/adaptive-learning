import type {
  SkillGapPredictionRequest,
  SkillGapPredictionResponse,
  ResourceRecommendationRequest,
  ResourceRecommendationResponse,
  AdaptiveDifficultyConfigRequest,
  AdaptiveDifficultyConfigResponse,
  LearningRiskPredictionRequest,
  LearningRiskPredictionResponse,
  InterestPredictionRequest,
  InterestPredictionResponse,
  UnifiedPersonalizedPlan,
} from '@/types/ml';
import { API_CONFIG } from '@/services/api/config';
import { apiClient } from '@/services/api/apiClient';

export class MlService {
  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('student_access_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  /**
   * Fetches the real-time Unified Personalized Plan for the currently authenticated student
   * from the Node.js backend (GET /api/v1/ml/personalized-plan).
   */
  async getPersonalizedPlan(): Promise<UnifiedPersonalizedPlan> {
    const response = await apiClient.get<UnifiedPersonalizedPlan>('/ml/personalized-plan');
    return response.data;
  }

  // -------------------------------------------------------------------------
  // Legacy / Direct endpoints
  // -------------------------------------------------------------------------

  async predictSkillGaps(request: SkillGapPredictionRequest): Promise<SkillGapPredictionResponse | null> {
    try {
      const response = await fetch(`${API_CONFIG.mlBaseUrl}/predict-skill-gaps`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(request),
      });

      if (!response.ok) return null;
      return (await response.json()) as SkillGapPredictionResponse;
    } catch {
      return null;
    }
  }

  async getRecommendedResources(
    request: ResourceRecommendationRequest
  ): Promise<ResourceRecommendationResponse | null> {
    try {
      const response = await fetch(`${API_CONFIG.mlBaseUrl}/recommend-resources`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(request),
      });

      if (!response.ok) return null;
      return (await response.json()) as ResourceRecommendationResponse;
    } catch {
      return null;
    }
  }

  async getAdaptiveDifficulty(
    request: AdaptiveDifficultyConfigRequest
  ): Promise<AdaptiveDifficultyConfigResponse | null> {
    try {
      const response = await fetch(`${API_CONFIG.mlBaseUrl}/adaptive-difficulty`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(request),
      });

      if (!response.ok) return null;
      return (await response.json()) as AdaptiveDifficultyConfigResponse;
    } catch {
      return null;
    }
  }

  async predictLearningRisk(
    request: LearningRiskPredictionRequest
  ): Promise<LearningRiskPredictionResponse | null> {
    try {
      const response = await fetch(`${API_CONFIG.mlBaseUrl}/predict-risk`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(request),
      });

      if (!response.ok) return null;
      return (await response.json()) as LearningRiskPredictionResponse;
    } catch {
      return null;
    }
  }

  async predictInterests(request: InterestPredictionRequest): Promise<InterestPredictionResponse | null> {
    try {
      const response = await fetch(`${API_CONFIG.mlBaseUrl}/predict-interests`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(request),
      });

      if (!response.ok) return null;
      return (await response.json()) as InterestPredictionResponse;
    } catch {
      return null;
    }
  }
}

export const mlService = new MlService();
