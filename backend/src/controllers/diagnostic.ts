import type { Request, Response, NextFunction } from 'express';
import { diagnosticService, DiagnosticError } from '../services/diagnosticService.js';

/**
 * POST /api/v1/diagnostic/start
 * Initializes or resumes a placement assessment session for the authenticated student.
 */
export async function startDiagnosticHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const uid = req.user?.uid;

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

  const { assessmentId } = req.body || {};

  try {
    const result = await diagnosticService.startDiagnostic(
      uid.trim(),
      typeof assessmentId === 'string' ? assessmentId : undefined
    );
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof DiagnosticError) {
      res.status(error.statusCode).json({
        error: {
          code: error.code,
          message: error.message,
        },
        status: error.statusCode,
        timestamp: new Date().toISOString(),
      });
      return;
    }
    next(error);
  }
}

/**
 * POST /api/v1/diagnostic/submit
 * Submits student answers for an in-progress diagnostic attempt.
 * Evaluates correctness server-side, records latency, and calculates scores.
 */
export async function submitDiagnosticHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const uid = req.user?.uid;

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

  const { attemptId, answers } = req.body || {};

  if (!attemptId || typeof attemptId !== 'string' || !attemptId.trim()) {
    res.status(400).json({
      error: {
        code: 'INVALID_INPUT',
        message: 'A valid attemptId string is required in the request body.',
      },
      status: 400,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (!Array.isArray(answers) || answers.length === 0) {
    res.status(400).json({
      error: {
        code: 'INVALID_INPUT',
        message: 'A non-empty answers array is required in the request body.',
      },
      status: 400,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  try {
    const result = await diagnosticService.submitDiagnostic(uid.trim(), attemptId.trim(), answers);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof DiagnosticError) {
      res.status(error.statusCode).json({
        error: {
          code: error.code,
          message: error.message,
        },
        status: error.statusCode,
        timestamp: new Date().toISOString(),
      });
      return;
    }
    next(error);
  }
}
