import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { searchTasks } from '../services/search.service';

const router = Router();

// All search routes require auth
router.use(authMiddleware);

// ─── Helper: get workspace member + role ──────────────────────────────────────
async function getWorkspaceMember(workspaceId: string, userId: string) {
  return prisma.workspaceMember.findFirst({
    where: { workspaceId, userId },
  });
}

// ─── Helper: attach isAssigneeRemoved flag to tasks ──────────────────────────
async function attachAssigneeStatus<T extends { assigneeId: string | null }>(workspaceId: string, tasks: T[]): Promise<(T & { isAssigneeRemoved: boolean })[]> {
  if (tasks.length === 0) return tasks as any;
  const workspaceMembers = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    select: { userId: true },
  });
  const memberIds = new Set(workspaceMembers.map(m => m.userId));
  return tasks.map(t => ({
    ...t,
    isAssigneeRemoved: t.assigneeId ? !memberIds.has(t.assigneeId) : false,
  }));
}

// ─── GET /api/search?q=keyword ────────────────────────────────────────────────
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const workspaceId = req.headers['x-workspace-id'] as string;
  if (!workspaceId) {
    res.status(400).json({ success: false, error: 'x-workspace-id header required' });
    return;
  }

  const keyword = req.query.q as string;
  if (!keyword || keyword.trim().length === 0) {
    res.status(400).json({ success: false, error: 'Keyword is required' });
    return;
  }

  try {
    const member = await getWorkspaceMember(workspaceId, req.user!.userId);
    if (!member) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    const tasks = await searchTasks(workspaceId, keyword, 10);

    const finalTasks = await attachAssigneeStatus(workspaceId, tasks);

    res.json({ success: true, data: { tasks: finalTasks } });
  } catch (err) {
    console.error('Search tasks error:', err);
    res.status(500).json({ success: false, error: 'Có lỗi xảy ra. Thử lại?' });
  }
});

export default router;
