import { Router } from 'express';
import { getStudentPathways } from '../controllers/pathway.js';
import { requireAuth } from '../middleware/auth.js';

export const pathwayRouter = Router();

/**
 * Protected student pathway endpoints
 * Authentication required via Firebase Bearer ID Token
 */
pathwayRouter.get('/pathways', requireAuth, getStudentPathways);
