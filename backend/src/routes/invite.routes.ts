import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { isTokenExpired } from '../services/invite.service';
import { createNotification } from '../services/notification.service';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const router = Router();

const registerAndAcceptSchema = z.object({
  token: z.string().min(1),
  name: z.string().min(1, 'Họ tên không được để trống').max(100),
  password: z.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự'),
});

const acceptSchema = z.object({
  token: z.string().min(1),
});

// GET /api/invite?token=xxx - validate token, return info
router.get('/', async (req: Request, res: Response): Promise<void> => {
  const { token } = req.query as { token?: string };
  if (!token) {
    res.status(400).json({ success: false, error: 'Token không hợp lệ.' });
    return;
  }

  try {
    const invite = await prisma.inviteToken.findUnique({
      where: { token },
      include: { workspace: true },
    });

    if (!invite) {
      res.status(404).json({ success: false, error: 'Link mời không tồn tại.' });
      return;
    }

    if (invite.acceptedAt) {
      res.status(400).json({ success: false, error: 'Link mời đã được sử dụng.' });
      return;
    }

    if (isTokenExpired(invite.expiresAt)) {
      res.status(410).json({ success: false, error: 'Link mời đã hết hạn. Vui lòng liên hệ Admin để được mời lại.' });
      return;
    }

    // Check if the email already has an account
    const existingUser = await prisma.user.findUnique({ where: { email: invite.email } });
    const hasAccount = !!existingUser;

    res.json({
      success: true,
      data: {
        email: invite.email,
        role: invite.role,
        workspaceName: invite.workspace.name,
        workspaceId: invite.workspaceId,
        hasAccount,
        expiresAt: invite.expiresAt,
      },
    });
  } catch (err) {
    console.error('Validate invite error:', err);
    res.status(500).json({ success: false, error: 'Có lỗi xảy ra. Thử lại?' });
  }
});

// POST /api/invite/accept - accept invite (logged in user)
router.post('/accept', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const parse = acceptSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ success: false, error: parse.error.errors[0]?.message });
    return;
  }

  const { token } = parse.data;
  const userId = req.user!.userId;

  try {
    const invite = await prisma.inviteToken.findUnique({
      where: { token },
      include: { workspace: true },
    });

    if (!invite) {
      res.status(404).json({ success: false, error: 'Link mời không tồn tại.' });
      return;
    }

    if (invite.acceptedAt) {
      res.status(400).json({ success: false, error: 'Link mời đã được sử dụng.' });
      return;
    }

    if (isTokenExpired(invite.expiresAt)) {
      res.status(410).json({ success: false, error: 'Link mời đã hết hạn.' });
      return;
    }

    // Verify that the logged-in user's email matches the invite
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.email !== invite.email) {
      res.status(403).json({
        success: false,
        error: 'Email đăng nhập không khớp với email được mời. Vui lòng đăng nhập bằng tài khoản đúng.',
      });
      return;
    }

    // Check if user is already a member
    const existingMember = await prisma.workspaceMember.findFirst({
      where: { workspaceId: invite.workspaceId, userId },
    });
    if (existingMember) {
      res.status(400).json({ success: false, error: 'Bạn đã là thành viên của workspace này.' });
      return;
    }

    // Add to workspace
    await prisma.workspaceMember.create({
      data: { workspaceId: invite.workspaceId, userId, role: invite.role },
    });

    // Mark invite as accepted
    await prisma.inviteToken.update({
      where: { token },
      data: { acceptedAt: new Date() },
    });

    // Notify all Admins of the workspace
    const admins = await prisma.workspaceMember.findMany({
      where: { workspaceId: invite.workspaceId, role: 'Admin' },
      select: { userId: true },
    });
    for (const admin of admins) {
      await createNotification({
        userId: admin.userId,
        type: 'invite_accepted',
        message: `${user.name} đã tham gia workspace "${invite.workspace.name}".`,
      });
    }

    res.json({
      success: true,
      data: { workspaceId: invite.workspaceId, workspaceName: invite.workspace.name },
    });
  } catch (err) {
    console.error('Accept invite error:', err);
    res.status(500).json({ success: false, error: 'Có lỗi xảy ra. Thử lại?' });
  }
});

// POST /api/invite/register-and-accept - register new account and join workspace
router.post('/register-and-accept', async (req: Request, res: Response): Promise<void> => {
  const parse = registerAndAcceptSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ success: false, error: parse.error.errors[0]?.message });
    return;
  }

  const { token, name, password } = parse.data;

  try {
    const invite = await prisma.inviteToken.findUnique({
      where: { token },
      include: { workspace: true },
    });

    if (!invite) {
      res.status(404).json({ success: false, error: 'Link mời không tồn tại.' });
      return;
    }

    if (invite.acceptedAt) {
      res.status(400).json({ success: false, error: 'Link mời đã được sử dụng.' });
      return;
    }

    if (isTokenExpired(invite.expiresAt)) {
      res.status(410).json({ success: false, error: 'Link mời đã hết hạn.' });
      return;
    }

    // Ensure the email doesn't already have an account
    const existingUser = await prisma.user.findUnique({ where: { email: invite.email } });
    if (existingUser) {
      res.status(409).json({
        success: false,
        error: 'Email này đã có tài khoản. Vui lòng đăng nhập và accept invite.',
      });
      return;
    }

    // Create user
    const passwordHash = await bcrypt.hash(password, 12);
    const newUser = await prisma.user.create({
      data: { email: invite.email, name, passwordHash },
    });

    // Add to workspace
    await prisma.workspaceMember.create({
      data: { workspaceId: invite.workspaceId, userId: newUser.id, role: invite.role },
    });

    // Mark invite as accepted
    await prisma.inviteToken.update({
      where: { token },
      data: { acceptedAt: new Date() },
    });

    // Notify admins
    const admins = await prisma.workspaceMember.findMany({
      where: { workspaceId: invite.workspaceId, role: 'Admin' },
      select: { userId: true },
    });
    for (const admin of admins) {
      if (admin.userId !== newUser.id) {
        await createNotification({
          userId: admin.userId,
          type: 'invite_accepted',
          message: `${newUser.name} đã tham gia workspace "${invite.workspace.name}".`,
        });
      }
    }

    // Issue JWT for auto-login
    const jwtSecret = process.env.JWT_SECRET || 'changeme';
    const jwtToken = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      jwtSecret,
      { expiresIn: '7d' }
    );

    const { passwordHash: _ph, ...userSafe } = newUser;

    res.status(201).json({
      success: true,
      data: {
        token: jwtToken,
        user: userSafe,
        workspaceId: invite.workspaceId,
        workspaceName: invite.workspace.name,
      },
    });
  } catch (err) {
    console.error('Register-and-accept invite error:', err);
    res.status(500).json({ success: false, error: 'Có lỗi xảy ra. Thử lại?' });
  }
});

export default router;
