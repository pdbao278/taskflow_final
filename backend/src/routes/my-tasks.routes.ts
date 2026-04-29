import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { isOverdue } from '../services/task.service';

const router = Router();

router.use(authMiddleware);

// Helper
async function getWorkspaceMember(workspaceId: string, userId: string) {
  return prisma.workspaceMember.findFirst({
    where: { workspaceId, userId },
  });
}

async function attachAssigneeStatus<T extends { assigneeId: string | null }>(
  workspaceId: string,
  tasks: T[]
): Promise<(T & { isAssigneeRemoved: boolean })[]> {
  if (tasks.length === 0) return tasks as any;
  const workspaceMembers = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    select: { userId: true },
  });
  const memberIds = new Set(workspaceMembers.map((m) => m.userId));
  return tasks.map((t) => ({
    ...t,
    isAssigneeRemoved: t.assigneeId ? !memberIds.has(t.assigneeId) : false,
  }));
}

// GET /api/my-tasks
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

    const { status } = req.query;
    
    // Base where: workspace, assigned to user, not deleted, not Done
    const whereClause: any = {
      workspaceId,
      assigneeId: req.user!.userId,
      deletedAt: null,
      status: { not: 'Done' }
    };

    if (status && status !== 'All') {
      whereClause.status = status;
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        project: { select: { id: true, name: true, color: true } },
        creator: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
    });

    // Process tasks: add isOverdue, then sort
    const tasksWithOverdue = tasks.map((t) => ({
      ...t,
      isOverdue: isOverdue(t.dueDate),
    }));

    // Sorting logic:
    // 1. Overdue first (isOverdue === true)
    // 2. due date ascending
    // 3. no due date (null) at the end
    tasksWithOverdue.sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;

      if (a.dueDate && b.dueDate) {
        return a.dueDate.getTime() - b.dueDate.getTime();
      }
      
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;

      // Fallback: createdAt desc
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    const finalTasks = await attachAssigneeStatus(workspaceId, tasksWithOverdue);

    res.json({ success: true, data: { tasks: finalTasks } });
  } catch (err) {
    console.error('List my tasks error:', err);
    res.status(500).json({ success: false, error: 'Có lỗi xảy ra. Thử lại?' });
  }
});

export default router;
