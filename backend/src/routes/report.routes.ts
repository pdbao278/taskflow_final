import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const router = Router();

// All report routes require auth
router.use(authMiddleware);

// ─── GET /api/reports/workspace — Reports data (Admin/Manager only) ─────────
router.get('/workspace', async (req: AuthRequest, res: Response): Promise<void> => {
  const workspaceId = req.headers['x-workspace-id'] as string;
  if (!workspaceId) {
    res.status(400).json({ success: false, error: 'x-workspace-id header required' });
    return;
  }

  try {
    const member = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: req.user!.userId },
    });
    if (!member || (member.role !== 'Admin' && member.role !== 'Manager')) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    const tasks = await prisma.task.findMany({
      where: {
        workspaceId,
        deletedAt: null,
      },
      include: {
        assignee: { select: { id: true, name: true } },
      },
    });

    // 1. Weekly completion stats for the last 4 weeks
    const now = new Date();
    const startOfThisWeek = new Date(now);
    startOfThisWeek.setHours(0, 0, 0, 0);
    startOfThisWeek.setDate(now.getDate() - now.getDay()); // Sunday as start of week

    const weeklyStats = [];
    for (let i = 3; i >= 0; i--) {
      const start = new Date(startOfThisWeek);
      start.setDate(start.getDate() - i * 7);
      const end = new Date(start);
      end.setDate(start.getDate() + 7);

      const completedCount = tasks.filter(t => 
        t.status === 'Done' && 
        t.updatedAt >= start && 
        t.updatedAt < end
      ).length;

      const label = `${String(start.getDate()).padStart(2, '0')}/${String(start.getMonth() + 1).padStart(2, '0')}`;
      weeklyStats.push({
        label: i === 0 ? '(tuần này)' : label,
        completed: completedCount,
      });
    }

    // 2. Member Stats
    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    const memberStats = members.map(m => {
      const assignedTasks = tasks.filter(t => t.assigneeId === m.userId);
      const assignedCount = assignedTasks.length;
      const completedCount = assignedTasks.filter(t => t.status === 'Done').length;
      const overdueCount = assignedTasks.filter(t => 
        t.status !== 'Done' && 
        t.dueDate && 
        new Date(t.dueDate) < now
      ).length;

      const completionRate = assignedCount > 0 
        ? Math.round((completedCount / assignedCount) * 100) 
        : null;

      return {
        id: m.userId,
        name: m.user.name,
        assigned: assignedCount,
        completed: completedCount,
        overdue: overdueCount,
        completionRate,
      };
    });

    res.json({
      success: true,
      data: {
        weeklyStats,
        memberStats,
      },
    });
  } catch (err) {
    console.error('Reports error:', err);
    res.status(500).json({ success: false, error: 'Có lỗi xảy ra. Thử lại?' });
  }
});

export default router;
