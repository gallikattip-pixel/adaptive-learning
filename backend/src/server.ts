import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { healthRouter } from './routes/health.js';
import { authRouter } from './routes/auth.js';
import { errorHandler } from './middleware/error.js';
import { requestLogger } from './middleware/logger.js';
import { isFirebaseConfigured } from './config/firebase.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// 1. Security Middleware
app.use(helmet());
app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
  })
);

// 2. Body Parser & Logger
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);

// 3. Health & Auth Routes
app.use('/', healthRouter);
app.use('/api/v1/auth', authRouter);

// 4. Centralized Error Handling
app.use(errorHandler);

// 5. Start Express Server
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`Adaptive Learning Backend Service (Stage 1)`);
  console.log(`Port: ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`CORS Allowed Origin: ${CORS_ORIGIN}`);
  console.log(`Firebase Configured: ${isFirebaseConfigured() ? 'YES' : 'NO (Missing Admin Credentials)'}`);
  console.log(`Health Check: GET http://localhost:${PORT}/health`);
  console.log(`==================================================`);
});
