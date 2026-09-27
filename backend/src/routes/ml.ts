import { Router } from 'express';
import { getPersonalizedPlan } from '../controllers/ml.js';
import { requireAuth } from '../middleware/auth.js';

export const mlRouter = Router();

/**
 * Protected ML endpoints
 * Authentication required via Firebase Bearer ID Token
 */
mlRouter.get('/personalized-plan', requireAuth, getPersonalizedPlan);
