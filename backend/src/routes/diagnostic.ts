import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { startDiagnosticHandler, submitDiagnosticHandler } from '../controllers/diagnostic.js';

export const diagnosticRouter = Router();

// POST /api/v1/diagnostic/start — Start or resume placement assessment session
diagnosticRouter.post('/start', requireAuth, startDiagnosticHandler);

// POST /api/v1/diagnostic/submit — Authoritative submission & grading of assessment attempt
diagnosticRouter.post('/submit', requireAuth, submitDiagnosticHandler);
