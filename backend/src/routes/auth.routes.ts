import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import {
  hashPassword,
  comparePassword,
  generateJWT,
  incrementLoginAttempt,
  resetLoginAttempt,
  isLocked,
} from '../services/auth.service';
import { registerSchema, loginSchema } from '../schemas/auth.schema';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req, res: Response): Promise<void> => {
  const parse = registerSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({
      success: false,
      error: parse.error.errors[0]?.message ?? 'Dữ liệu không hợp lệ',
    });
    return;
  }

  const { email, password, name } = parse.data;

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({
        success: false,
        error: 'Email này đã được đăng ký. Bạn có muốn đăng nhập không?',
      });
      return;
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, name, passwordHash },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    const token = generateJWT({ userId: user.id, email: user.email });
    res.status(201).json({ success: true, data: { token, user } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, error: 'Có lỗi xảy ra. Thử lại?' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res: Response): Promise<void> => {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({
      success: false,
      error: parse.error.errors[0]?.message ?? 'Dữ liệu không hợp lệ',
    });
    return;
  }

  const { email, password } = parse.data;

  // Check rate limiting
  const lockStatus = isLocked(email);
  if (lockStatus.locked) {
    res.status(429).json({
      success: false,
      error: 'Tài khoản bị khóa tạm thời.',
      remainingMs: lockStatus.remainingMs,
    });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      incrementLoginAttempt(email);
      res.status(401).json({ success: false, error: 'Email hoặc mật khẩu không đúng.' });
      return;
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      const attempt = incrementLoginAttempt(email);
      if (attempt.lockedUntil) {
        res.status(429).json({
          success: false,
          error: 'Tài khoản bị khóa tạm thời.',
          remainingMs: attempt.lockedUntil - Date.now(),
        });
        return;
      }
      res.status(401).json({ success: false, error: 'Email hoặc mật khẩu không đúng.' });
      return;
    }

    resetLoginAttempt(email);

    // Check if user has any workspace
    const workspaceMember = await prisma.workspaceMember.findFirst({
      where: { userId: user.id },
      include: { workspace: true },
    });

    const token = generateJWT({ userId: user.id, email: user.email });
    res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
        },
        hasWorkspace: !!workspaceMember,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: 'Có lỗi xảy ra. Thử lại?' });
  }
});

// POST /api/auth/logout
router.post('/logout', authMiddleware, (_req: AuthRequest, res: Response): void => {
  // JWT is stateless — client clears token. We just confirm.
  res.status(200).json({ success: true, data: { message: 'Đã đăng xuất.' } });
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, email: true, name: true, createdAt: true, updatedAt: true },
    });
    if (!user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    res.status(200).json({ success: true, data: { user } });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ success: false, error: 'Có lỗi xảy ra. Thử lại?' });
  }
});

export default router;
