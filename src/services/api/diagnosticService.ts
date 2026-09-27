import { apiClient } from './apiClient';
import type {
  DiagnosticStartResponse,
  DiagnosticSubmitRequest,
  DiagnosticSubmitResponse,
} from '@/types/learning';

export class DiagnosticApiService {
  /**
   * Initializes or resumes a placement diagnostic assessment session.
   * Authenticated Firebase token is attached automatically by apiClient.
   */
  async startDiagnostic(assessmentId?: string): Promise<DiagnosticStartResponse> {
    const res = await apiClient.post<DiagnosticStartResponse>('/diagnostic/start', {
      ...(assessmentId ? { assessmentId } : {}),
    });
    return res.data;
  }

  /**
   * Submits student answers for an in-progress diagnostic attempt.
   * Calculates scores server-side and returns completed results.
   */
  async submitDiagnostic(payload: DiagnosticSubmitRequest): Promise<DiagnosticSubmitResponse> {
    const res = await apiClient.post<DiagnosticSubmitResponse>('/diagnostic/submit', payload);
    return res.data;
  }
}

export const diagnosticService = new DiagnosticApiService();
