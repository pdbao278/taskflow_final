import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { sanitizeInput } from './middleware/sanitize';
import { errorHandler } from './middleware/error-handler';
import authRoutes from './routes/auth.routes';
import workspaceRoutes from './routes/workspace.routes';
import inviteRoutes from './routes/invite.routes';

const app = express();

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);

// Global rate limiter: 100 req/min per IP
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Thử lại sau.' },
});
app.use(globalLimiter);

// Input sanitization
app.use(sanitizeInput);

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/invite', inviteRoutes);

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use(errorHandler);

export default app;
