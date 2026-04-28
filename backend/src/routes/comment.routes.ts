import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { createCommentSchema } from '../schemas/comment.schema';
import { processMentionsAndNotify } from '../services/comment.service';
import { createActivityLog } from '../services/task.service';

// mergeParams: true ensures we can access :taskId from parent router
const router = Router({ mergeParams: true });

// Helper: Verify workspace member
async function getWorkspaceMember(workspaceId: string, userId: string) {
  return prisma.workspaceMember.findFirst({
    where: { workspaceId, userId },
  });
}

// ─── GET /api/tasks/:taskId/comments ───────────────────────────────────────────
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const workspaceId = req.headers['x-workspace-id'] as string;
  const taskId = req.params.taskId;

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

    // Verify task belongs to workspace
    const task = await prisma.task.findFirst({
      where: { id: taskId, workspaceId },
    });

    if (!task) {
      res.status(404).json({ success: false, error: 'Task không tồn tại.' });
      return;
    }

    const comments = await prisma.comment.findMany({
      where: { taskId },
      include: {
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'asc' }, // Oldest first
    });

    res.json({ success: true, data: { comments } });
  } catch (err) {
    console.error('Get comments error:', err);
    res.status(500).json({ success: false, error: 'Có lỗi xảy ra. Thử lại?' });
  }
});

// ─── POST /api/tasks/:taskId/comments ──────────────────────────────────────────
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const workspaceId = req.headers['x-workspace-id'] as string;
  const taskId = req.params.taskId;

  if (!workspaceId) {
    res.status(400).json({ success: false, error: 'x-workspace-id header required' });
    return;
  }

  const parse = createCommentSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ success: false, error: parse.error.errors[0]?.message });
    return;
  }

  try {
    const member = await getWorkspaceMember(workspaceId, req.user!.userId);
    if (!member) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    const task = await prisma.task.findFirst({
      where: { id: taskId, workspaceId },
    });

    if (!task) {
      res.status(404).json({ success: false, error: 'Task không tồn tại.' });
      return;
    }

    const content = parse.data.content;

    // Create comment (Sanitization is handled by global middleware)
    const comment = await prisma.comment.create({
      data: {
        taskId,
        userId: req.user!.userId,
        content,
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    // Create activity log
    await createActivityLog({
      taskId,
      userId: req.user!.userId,
      actionType: 'commented',
    });

    // Process mentions and notify
    await processMentionsAndNotify(
      taskId,
      workspaceId,
      content,
      req.user!.userId,
      req.user!.name || comment.user.name,
      task.title,
      task.assigneeId
    );

    res.status(201).json({ success: true, data: { comment } });
  } catch (err) {
    console.error('Create comment error:', err);
    res.status(500).json({ success: false, error: 'Có lỗi xảy ra. Thử lại?' });
  }
});

// ─── DELETE /api/tasks/:taskId/comments/:commentId ─────────────────────────────
router.delete('/:commentId', async (req: AuthRequest, res: Response): Promise<void> => {
  const workspaceId = req.headers['x-workspace-id'] as string;
  const { taskId, commentId } = req.params;

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

    const comment = await prisma.comment.findFirst({
      where: { id: commentId, taskId },
    });

    if (!comment) {
      res.status(404).json({ success: false, error: 'Comment không tồn tại.' });
      return;
    }

    // Only author can delete
    if (comment.userId !== req.user!.userId) {
      res.status(403).json({ success: false, error: 'Chỉ người viết mới có thể xóa comment.' });
      return;
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    res.json({ success: true, data: { message: 'Đã xóa comment.' } });
  } catch (err) {
    console.error('Delete comment error:', err);
    res.status(500).json({ success: false, error: 'Có lỗi xảy ra. Thử lại?' });
  }
});

export default router;
