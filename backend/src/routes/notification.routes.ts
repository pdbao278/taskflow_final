import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// All notification routes require auth
router.use(authMiddleware);

// ─── Helper: get workspace member ─────────────────────────────────────────────
async function getWorkspaceMember(workspaceId: string, userId: string) {
  return prisma.workspaceMember.findFirst({
    where: { workspaceId, userId },
  });
}

// ─── GET /api/notifications — list all notifications for current user ──────────
// Sorted by created_at DESC (newest first)
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const workspaceId = req.headers['x-workspace-id'] as string;
  if (!workspaceId) {
    res.status(400).json({ success: false, error: 'x-workspace-id header required' });
    return;
  }

  try {
    const member = await getWorkspaceMember(workspaceId, req.user!.userId);
    if (!member) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json({ success: true, data: { notifications } });
  } catch (err) {
    console.error('List notifications error:', err);
    res.status(500).json({ success: false, error: 'Có lỗi xảy ra. Thử lại?' });
  }
});

// ─── GET /api/notifications/unread-count — lightweight polling endpoint ────────
// IMPORTANT: This route MUST be defined BEFORE /:id to avoid routing conflict
router.get('/unread-count', async (req: AuthRequest, res: Response): Promise<void> => {
  const workspaceId = req.headers['x-workspace-id'] as string;
  if (!workspaceId) {
    res.status(400).json({ success: false, error: 'x-workspace-id header required' });
    return;
  }

  try {
    const member = await getWorkspaceMember(workspaceId, req.user!.userId);
    if (!member) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    const unreadCount = await prisma.notification.count({
      where: {
        userId: req.user!.userId,
        readAt: null,
      },
    });

    res.json({ success: true, data: { unreadCount } });
  } catch (err) {
    console.error('Unread count error:', err);
    res.status(500).json({ success: false, error: 'Có lỗi xảy ra. Thử lại?' });
  }
});

// ─── PATCH /api/notifications/read-all — mark all as read ─────────────────────
// IMPORTANT: This route MUST be defined BEFORE /:id/read to avoid routing conflict
router.patch('/read-all', async (req: AuthRequest, res: Response): Promise<void> => {
  const workspaceId = req.headers['x-workspace-id'] as string;
  if (!workspaceId) {
    res.status(400).json({ success: false, error: 'x-workspace-id header required' });
    return;
  }

  try {
    const member = await getWorkspaceMember(workspaceId, req.user!.userId);
    if (!member) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    await prisma.notification.updateMany({
      where: {
        userId: req.user!.userId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    res.json({ success: true, data: { message: 'Đã đánh dấu tất cả thông báo là đã đọc.' } });
  } catch (err) {
    console.error('Mark all read error:', err);
    res.status(500).json({ success: false, error: 'Có lỗi xảy ra. Thử lại?' });
  }
});

// ─── PATCH /api/notifications/:id/read — toggle read/unread ───────────────────
// If readAt is null → mark as read (set readAt = now)
// If readAt is set  → mark as unread (set readAt = null)
router.patch('/:id/read', async (req: AuthRequest, res: Response): Promise<void> => {
  const workspaceId = req.headers['x-workspace-id'] as string;
  if (!workspaceId) {
    res.status(400).json({ success: false, error: 'x-workspace-id header required' });
    return;
  }

  try {
    const member = await getWorkspaceMember(workspaceId, req.user!.userId);
    if (!member) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    // Find notification and verify ownership
    const notification = await prisma.notification.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.userId,
      },
    });

    if (!notification) {
      res.status(404).json({ success: false, error: 'Thông báo không tồn tại.' });
      return;
    }

    // Toggle: if unread → mark read; if read → mark unread
    const updated = await prisma.notification.update({
      where: { id: notification.id },
      data: {
        readAt: notification.readAt === null ? new Date() : null,
      },
    });

    res.json({ success: true, data: { notification: updated } });
  } catch (err) {
    console.error('Toggle read error:', err);
    res.status(500).json({ success: false, error: 'Có lỗi xảy ra. Thử lại?' });
  }
});

export default router;
