import { Router } from 'express';
import { signup, login, getMe, updateMe } from '../controllers/auth.js';
import { requireAuth } from '../middleware/auth.js';

export const authRouter = Router();

// Public auth endpoints
authRouter.post('/signup', signup);
authRouter.post('/login', login);

// Protected student auth endpoints
authRouter.get('/me', requireAuth, getMe);
authRouter.patch('/me', requireAuth, updateMe);
