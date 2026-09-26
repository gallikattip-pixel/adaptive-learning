/**
 * API Configuration
 * All API base URLs and timeouts are read from public environment variables.
 * No secret keys or credentials are stored here.
 */

export const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  mlBaseUrl: import.meta.env.VITE_ML_API_BASE_URL || '/api/v1/ml',
  timeoutMs: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
} as const;
