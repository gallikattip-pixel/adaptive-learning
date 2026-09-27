import dotenv from 'dotenv';
import http from 'http';
import https from 'https';

dotenv.config();

/**
 * Standardized Student Input payload expected by ML Gateway
 */
export interface SkillEntry {
  skill: string;
  level: number;
  confidence?: number;
}

export interface CommonStudentInput {
  student_id: string;
  goal?: string;
  interests?: string[];
  skills?: SkillEntry[];
  learning_history?: Record<string, any>[];
  assessment_history?: Record<string, any>[];
  resource_history?: Record<string, any>[];
  activity_history?: Record<string, any>[];
}

/**
 * Standardized Gateway Health Response
 */
export interface GatewayHealthResponse {
  gateway: string;
  models: Record<string, string>;
  timestamp: string;
}

/**
 * Standardized Gateway Metadata
 */
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

/**
 * Standardized Unified Personalized Plan Output
 */
export interface UnifiedPersonalizedPlan {
  student_id: string;
  interest: Record<string, any>;
  skill_gaps: Record<string, any>[];
  mastery: Record<string, any>[];
  recommendations: Record<string, any>[];
  risk: Record<string, any>;
  intervention: Record<string, any>;
  metadata: GatewayMetadata;
}

/**
 * Custom Error Class for ML Gateway Communication Errors
 */
export class MlGatewayError extends Error {
  public status?: number;
  public details?: unknown;

  constructor(message: string, status?: number, details?: unknown) {
    super(message);
    this.name = 'MlGatewayError';
    this.status = status;
    this.details = details;
  }
}

/**
 * Resolves the base URL for the ML Gateway from environment or fallback
 */
function getBaseUrl(): string {
  const url = process.env.ML_GATEWAY_URL || 'http://127.0.0.1:5100';
  return url.replace(/\/$/, '');
}

interface HttpResponse {
  status: number;
  text: string;
  json: () => any;
}

/**
 * Native Node.js HTTP/HTTPS client helper with timer timeout and clean socket release
 */
function httpRequest(
  urlStr: string,
  options: { method?: string; headers?: Record<string, string>; body?: string; timeoutMs?: number } = {}
): Promise<HttpResponse> {
  return new Promise((resolve, reject) => {
    try {
      const url = new URL(urlStr);
      const isHttps = url.protocol === 'https:';
      const client = isHttps ? https : http;

      const reqOptions = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method: options.method || 'GET',
        headers: {
          'Accept': 'application/json',
          ...(options.headers || {}),
        },
      };

      const timeoutMs = options.timeoutMs || 10000;
      let timedOut = false;

      let req: http.ClientRequest;

      const timer = setTimeout(() => {
        timedOut = true;
        if (req) {
          req.destroy();
        }
        reject(new MlGatewayError(`ML Gateway request timed out after ${timeoutMs}ms`, 504));
      }, timeoutMs);

      req = client.request(reqOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          clearTimeout(timer);
          if (timedOut) return;
          resolve({
            status: res.statusCode || 500,
            text: data,
            json: () => {
              try {
                return JSON.parse(data);
              } catch {
                return data;
              }
            },
          });
        });
      });

      req.on('error', (err) => {
        clearTimeout(timer);
        if (timedOut) return;
        reject(new MlGatewayError(`ML Gateway network error: ${err.message}`, 503));
      });

      if (options.body) {
        req.write(options.body);
      }
      req.end();
    } catch (err) {
      reject(new MlGatewayError(`Invalid ML Gateway URL: ${(err as Error).message}`, 400));
    }
  });
}

/**
 * Checks operational health of ML Gateway and underlying model microservices
 */
export async function getGatewayHealth(): Promise<GatewayHealthResponse> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/api/ml/health`;

  try {
    const res = await httpRequest(url, { method: 'GET', timeoutMs: 10000 });
    if (res.status !== 200) {
      throw new MlGatewayError(
        `ML Gateway health check failed with status ${res.status}`,
        res.status,
        res.text
      );
    }
    return res.json() as GatewayHealthResponse;
  } catch (error) {
    if (error instanceof MlGatewayError) throw error;
    throw new MlGatewayError(`Failed to fetch ML Gateway health: ${(error as Error).message}`);
  }
}

/**
 * Retrieves metadata from ML Gateway including registered model versions
 */
export async function getGatewayMetadata(): Promise<Record<string, any>> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/api/ml/metadata`;

  try {
    const res = await httpRequest(url, { method: 'GET', timeoutMs: 10000 });
    if (res.status !== 200) {
      throw new MlGatewayError(
        `ML Gateway metadata check failed with status ${res.status}`,
        res.status,
        res.text
      );
    }
    return res.json();
  } catch (error) {
    if (error instanceof MlGatewayError) throw error;
    throw new MlGatewayError(`Failed to fetch ML Gateway metadata: ${(error as Error).message}`);
  }
}

/**
 * Invokes the main 5-model unified pipeline on the ML Gateway
 */
export async function generatePersonalizedPlan(
  input: CommonStudentInput
): Promise<UnifiedPersonalizedPlan> {
  if (!input.student_id || !input.student_id.trim()) {
    throw new MlGatewayError('student_id is required for generating a personalized plan', 400);
  }

  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/api/ml/personalized-plan`;

  try {
    const bodyStr = JSON.stringify(input);
    const res = await httpRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr).toString(),
      },
      body: bodyStr,
      timeoutMs: 20000,
    });

    if (res.status !== 200) {
      throw new MlGatewayError(
        `ML Gateway personalized plan execution failed with status ${res.status}`,
        res.status,
        res.json()
      );
    }

    return res.json() as UnifiedPersonalizedPlan;
  } catch (error) {
    if (error instanceof MlGatewayError) throw error;
    throw new MlGatewayError(
      `Failed to generate personalized plan via ML Gateway: ${(error as Error).message}`
    );
  }
}
