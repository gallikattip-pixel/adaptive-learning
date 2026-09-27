import type { Request, Response, NextFunction } from 'express';
import { buildCommonStudentInput } from '../services/stateAggregator.js';
import { generatePersonalizedPlan, MlGatewayError, UnifiedPersonalizedPlan } from '../services/mlGateway.js';

/**
 * GET /api/v1/ml/personalized-plan
 *
 * Generates an end-to-end unified personalized plan for the authenticated student.
 * Flow:
 * 1. Extracts authenticated Firebase UID from req.user (strictly rejects unverified student IDs).
 * 2. Aggregates real Firestore student state via buildCommonStudentInput().
 * 3. Dispatches payload to ML Gateway via generatePersonalizedPlan().
 * 4. Returns UnifiedPersonalizedPlan without persisting to database.
 */
export async function getPersonalizedPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
  const startTime = Date.now();
  const uid = req.user?.uid;

  // Strict authentication verification
  if (!uid || typeof uid !== 'string' || !uid.trim()) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authenticated student UID not found in request context.',
      },
      status: 401,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const cleanUid = uid.trim();

  try {
    // 1. Read authentic student state from Firestore collections
    const studentInput = await buildCommonStudentInput(cleanUid);

    // 2. Request unified plan across all 5 ML models via ML Gateway client service
    const plan: UnifiedPersonalizedPlan = await generatePersonalizedPlan(studentInput);

    const elapsedMs = Date.now() - startTime;
    // Safe operational logging only — no tokens, no PII, no raw history, no full plans logged
    console.log(`[ML Controller] Generated personalized plan successfully in ${elapsedMs}ms`);

    // 3. Return the UnifiedPersonalizedPlan directly
    res.status(200).json(plan);
  } catch (error) {
    const elapsedMs = Date.now() - startTime;
    console.error(
      `[ML Controller] Plan generation failed after ${elapsedMs}ms:`,
      error instanceof Error ? error.message : 'Unknown error'
    );

    // Handle ML Gateway communication errors cleanly without leaking internal paths or secrets
    if (error instanceof MlGatewayError) {
      const isTimeout = error.status === 504 || (error.message && error.message.includes('timed out'));
      const statusCode = isTimeout ? 504 : 502;
      res.status(statusCode).json({
        error: {
          code: isTimeout ? 'ML_GATEWAY_TIMEOUT' : 'ML_GATEWAY_UNAVAILABLE',
          message: isTimeout
            ? 'The ML Gateway request timed out while generating your personalized plan.'
            : 'The ML Gateway service is currently unavailable or returned an error.',
        },
        status: statusCode,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (error instanceof Error && error.message.includes('[StateAggregator]')) {
      res.status(500).json({
        error: {
          code: 'STATE_AGGREGATION_FAILED',
          message: 'Failed to aggregate student learning profile data.',
        },
        status: 500,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next(error);
  }
}
