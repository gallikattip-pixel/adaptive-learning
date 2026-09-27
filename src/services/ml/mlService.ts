import type { UnifiedPersonalizedPlan } from '@/types/ml';
import { apiClient } from '@/services/api/apiClient';

export class MlService {
  /**
   * Fetches the real-time Unified Personalized Plan for the currently authenticated student
   * from the Node.js backend (GET /api/v1/ml/personalized-plan).
   */
  async getPersonalizedPlan(): Promise<UnifiedPersonalizedPlan> {
    const response = await apiClient.get<UnifiedPersonalizedPlan>('/ml/personalized-plan');
    return response.data;
  }
}

export const mlService = new MlService();
