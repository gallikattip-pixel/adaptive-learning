import type { Request, Response, NextFunction } from 'express';
import { buildStudentPathway } from '../services/prerequisiteEngine.js';

/**
 * GET /api/v1/student/pathways
 * Generates the deterministic prerequisite pathway for the authenticated student.
 */
export async function getStudentPathways(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const startTime = Date.now();
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

  const cleanUid = uid.trim();

  try {
    const pathway = await buildStudentPathway(cleanUid);
    const elapsedMs = Date.now() - startTime;
    console.log(`[Pathway Controller] Evaluated pathway in ${elapsedMs}ms (${pathway.nodes.length} nodes)`);

    res.status(200).json(pathway);
  } catch (error) {
    const elapsedMs = Date.now() - startTime;
    console.error(
      `[Pathway Controller] Pathway evaluation failed after ${elapsedMs}ms:`,
      error instanceof Error ? error.message : 'Unknown error'
    );
    next(error);
  }
}
