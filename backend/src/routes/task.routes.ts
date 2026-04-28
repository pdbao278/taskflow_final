import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { createTaskSchema, updateTaskSchema, updateTaskStatusSchema } from '../schemas/task.schema';
import { canCreateTask } from '../services/project.service';
import {
  createActivityLog,
  softDeleteTask,
  isAssigneeInWorkspace,
  isOverdue,
  validateRestore,
} from '../services/task.service';
import { createNotification } from '../services/notification.service';
import commentRoutes from './comment.routes';

const router = Router();

// All task routes require auth
router.use(authMiddleware);

// Mount comment routes
router.use('/:taskId/comments', commentRoutes);

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

// ─── GET /api/tasks/my — tasks assigned to or created by current user ──────────
router.get('/my', async (req: AuthRequest, res: Response): Promise<void> => {
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

    const tasks = await prisma.task.findMany({
      where: {
        workspaceId,
        deletedAt: null,
        OR: [
          { assigneeId: req.user!.userId },
          { createdBy: req.user!.userId },
        ],
      },
      include: {
        project: { select: { id: true, name: true, color: true } },
        creator: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const tasksWithOverdue = tasks.map(t => ({
      ...t,
      isOverdue: isOverdue(t.dueDate),
    }));

    const finalTasks = await attachAssigneeStatus(workspaceId, tasksWithOverdue);

    res.json({ success: true, data: { tasks: finalTasks } });
  } catch (err) {
    console.error('List my tasks error:', err);
    res.status(500).json({ success: false, error: 'Có lỗi xảy ra. Thử lại?' });
  }
});

// ─── GET /api/tasks/trash — list soft-deleted tasks (Admin only, < 30 days) ───
router.get('/trash', async (req: AuthRequest, res: Response): Promise<void> => {
  const workspaceId = req.headers['x-workspace-id'] as string;
  if (!workspaceId) {
    res.status(400).json({ success: false, error: 'x-workspace-id header required' });
    return;
  }

  try {
    const member = await getWorkspaceMember(workspaceId, req.user!.userId);
    if (!member || member.role !== 'Admin') {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Build where clause
    const where: any = {
      workspaceId,
      deletedAt: {
        not: null,
        gte: thirtyDaysAgo,
      },
    };

    // Optional project filter
    const projectFilter = req.query.project as string | undefined;
    if (projectFilter) {
      where.projectId = projectFilter;
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        project: { select: { id: true, name: true, color: true } },
        creator: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
      orderBy: { deletedAt: 'desc' },
    });

    // Find who deleted each task (from activity log)
    const taskIds = tasks.map(t => t.id);
    const deleteLogs = await prisma.activityLog.findMany({
      where: {
        taskId: { in: taskIds },
        actionType: 'deleted',
      },
      include: {
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const deleteLogMap: Record<string, { name: string; deletedAt: string }> = {};
    for (const log of deleteLogs) {
      if (!deleteLogMap[log.taskId]) {
        deleteLogMap[log.taskId] = {
          name: log.user.name,
          deletedAt: log.createdAt.toISOString(),
        };
      }
    }

    const tasksWithMeta = tasks.map(t => ({
      ...t,
      deletedBy: deleteLogMap[t.id]?.name ?? 'Unknown',
      // Calculate remaining time in ms
      restoreDeadline: t.deletedAt
        ? new Date(t.deletedAt.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
        : null,
    }));

    const finalTasks = await attachAssigneeStatus(workspaceId, tasksWithMeta);

    res.json({ success: true, data: { tasks: finalTasks } });
  } catch (err) {
    console.error('List trash error:', err);
    res.status(500).json({ success: false, error: 'Có lỗi xảy ra. Thử lại?' });
  }
});

// ─── POST /api/tasks — create task ─────────────────────────────────────────────
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const workspaceId = req.headers['x-workspace-id'] as string;
  if (!workspaceId) {
    res.status(400).json({ success: false, error: 'x-workspace-id header required' });
    return;
  }

  const parse = createTaskSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ success: false, error: parse.error.errors[0]?.message });
    return;
  }

  try {
    // Verify user is a member
    const member = await getWorkspaceMember(workspaceId, req.user!.userId);
    if (!member) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    const { title, description, project_id, assignee_id, priority, due_date } = parse.data;

    // Verify project belongs to workspace and is not archived
    const project = await prisma.project.findFirst({
      where: { id: project_id, workspaceId },
    });
    if (!project) {
      res.status(400).json({ success: false, error: 'Dự án không tồn tại trong workspace này.' });
      return;
    }

    const canCreate = await canCreateTask(project_id);
    if (!canCreate) {
      res.status(400).json({ success: false, error: 'Dự án đã archive, không thể tạo task mới.' });
      return;
    }

    // Validate assignee if provided
    if (assignee_id) {
      const validAssignee = await isAssigneeInWorkspace(assignee_id, workspaceId);
      if (!validAssignee) {
        res.status(400).json({ success: false, error: 'Người thực hiện phải thuộc workspace hiện tại.' });
        return;
      }
    }

    // Create task
    const task = await prisma.task.create({
      data: {
        workspaceId,
        projectId: project_id,
        title, // already sanitized by global middleware
        description: description || null,
        status: 'ToDo',
        priority: priority || 'Medium',
        assigneeId: assignee_id || null,
        dueDate: due_date ? new Date(due_date) : null,
        createdBy: req.user!.userId,
      },
      include: {
        project: { select: { id: true, name: true, color: true } },
        creator: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
    });

    // Create activity log
    await createActivityLog({
      taskId: task.id,
      userId: req.user!.userId,
      actionType: 'created',
    });

    // Notify assignee if different from creator
    if (task.assigneeId && task.assigneeId !== req.user!.userId) {
      await createNotification({
        userId: task.assigneeId,
        type: 'task_assigned',
        message: `Bạn được assign task mới: "${task.title}"`,
        referenceId: task.id,
      });
    }

    // Add isOverdue flag
    const taskResponse = {
      ...task,
      isOverdue: isOverdue(task.dueDate),
    };

    const [finalTask] = await attachAssigneeStatus(workspaceId, [taskResponse]);

    res.status(201).json({ success: true, data: { task: finalTask } });
  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).json({ success: false, error: 'Có lỗi xảy ra. Thử lại?' });
  }
});

// ─── GET /api/tasks/:id — task detail ──────────────────────────────────────────
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
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

    const task = await prisma.task.findFirst({
      where: { id: req.params.id, workspaceId, deletedAt: null },
      include: {
        project: { select: { id: true, name: true, color: true, archivedAt: true } },
        creator: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
    });

    if (!task) {
      res.status(404).json({ success: false, error: 'Task không tồn tại.' });
      return;
    }

    const taskResponse = {
      ...task,
      isOverdue: isOverdue(task.dueDate),
    };

    const [finalTask] = await attachAssigneeStatus(workspaceId, [taskResponse]);

    res.json({ success: true, data: { task: finalTask } });
  } catch (err) {
    console.error('Get task error:', err);
    res.status(500).json({ success: false, error: 'Có lỗi xảy ra. Thử lại?' });
  }
});

// ─── PATCH /api/tasks/:id/status — update task status (FR-05) ──────────────────
router.patch('/:id/status', async (req: AuthRequest, res: Response): Promise<void> => {
  const workspaceId = req.headers['x-workspace-id'] as string;
  if (!workspaceId) {
    res.status(400).json({ success: false, error: 'x-workspace-id header required' });
    return;
  }

  const parse = updateTaskStatusSchema.safeParse(req.body);
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
      where: { id: req.params.id, workspaceId, deletedAt: null },
    });
    if (!task) {
      res.status(404).json({ success: false, error: 'Task không tồn tại.' });
      return;
    }

    // FR-05 Permission: Only Assignee, Manager, Admin can change status
    const isAssignee = task.assigneeId === req.user!.userId;
    const isAdminOrManager = member.role === 'Admin' || member.role === 'Manager';

    if (!isAssignee && !isAdminOrManager) {
      res.status(403).json({ success: false, error: 'Chỉ assignee hoặc Manager mới có thể đổi trạng thái' });
      return;
    }

    if (task.status === parse.data.status) {
      const [finalTask] = await attachAssigneeStatus(workspaceId, [{ ...task, isOverdue: isOverdue(task.dueDate) }]);
      res.json({ success: true, data: { task: finalTask } });
      return;
    }

    const oldStatus = task.status;

    const updated = await prisma.task.update({
      where: { id: task.id },
      data: { status: parse.data.status },
      include: {
        project: { select: { id: true, name: true, color: true, archivedAt: true } },
        creator: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
    });

    // Activity log ghi "[Tên Member] changed status from To Do → In Progress at [timestamp]"
    // The format is dictated by how activity logs are fetched, but we record the field change here
    await createActivityLog({
      taskId: task.id,
      userId: req.user!.userId,
      actionType: 'field_edited',
      fieldChanged: 'status',
      oldValue: oldStatus,
      newValue: parse.data.status,
    });

    const taskResponse = {
      ...updated,
      isOverdue: isOverdue(updated.dueDate),
    };

    const [finalTask] = await attachAssigneeStatus(workspaceId, [taskResponse]);

    res.json({ success: true, data: { task: finalTask } });
  } catch (err) {
    console.error('Update task status error:', err);
    res.status(500).json({ success: false, error: 'Có lỗi xảy ra. Thử lại?' });
  }
});

// ─── PATCH /api/tasks/:id — update task ────────────────────────────────────────
router.patch('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const workspaceId = req.headers['x-workspace-id'] as string;
  if (!workspaceId) {
    res.status(400).json({ success: false, error: 'x-workspace-id header required' });
    return;
  }

  const parse = updateTaskSchema.safeParse(req.body);
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

    const existing = await prisma.task.findFirst({
      where: { id: req.params.id, workspaceId, deletedAt: null },
      include: {
        assignee: { select: { id: true, name: true } },
      },
    });
    if (!existing) {
      res.status(404).json({ success: false, error: 'Task không tồn tại.' });
      return;
    }

    // Permission: Creator, Assignee, Admin, Manager can edit
    const isCreator = existing.createdBy === req.user!.userId;
    const isAssignee = existing.assigneeId === req.user!.userId;
    const isAdminOrManager = member.role === 'Admin' || member.role === 'Manager';

    if (!isCreator && !isAssignee && !isAdminOrManager) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    // Validate assignee if being changed
    if (parse.data.assignee_id !== undefined && parse.data.assignee_id !== null) {
      const validAssignee = await isAssigneeInWorkspace(parse.data.assignee_id, workspaceId);
      if (!validAssignee) {
        res.status(400).json({ success: false, error: 'Người thực hiện phải thuộc workspace hiện tại.' });
        return;
      }
    }

    // Build update data and track changes for activity log
    const updateData: Record<string, unknown> = {};
    const changes: { field: string; old: string | null; new_val: string | null }[] = [];

    if (parse.data.title !== undefined && parse.data.title !== existing.title) {
      updateData.title = parse.data.title;
      changes.push({ field: 'title', old: existing.title, new_val: parse.data.title });
    }
    if (parse.data.description !== undefined && parse.data.description !== existing.description) {
      updateData.description = parse.data.description ?? null;
      changes.push({ field: 'description', old: existing.description, new_val: parse.data.description ?? null });
    }
    if (parse.data.assignee_id !== undefined) {
      const newAssigneeId = parse.data.assignee_id ?? null;
      if (newAssigneeId !== existing.assigneeId) {
        updateData.assigneeId = newAssigneeId;
        const oldName = existing.assignee?.name ?? '(chưa assign)';
        // Get new assignee name
        let newName = '(chưa assign)';
        if (newAssigneeId) {
          const newAssignee = await prisma.user.findUnique({
            where: { id: newAssigneeId },
            select: { name: true },
          });
          newName = newAssignee?.name ?? '(chưa assign)';
        }
        changes.push({ field: 'assignee', old: oldName, new_val: newName });
      }
    }
    if (parse.data.status !== undefined && parse.data.status !== existing.status) {
      updateData.status = parse.data.status;
      changes.push({ field: 'status', old: existing.status, new_val: parse.data.status });
    }
    if (parse.data.priority !== undefined && parse.data.priority !== existing.priority) {
      updateData.priority = parse.data.priority;
      changes.push({ field: 'priority', old: existing.priority, new_val: parse.data.priority });
    }
    if (parse.data.due_date !== undefined) {
      const newDueDate = parse.data.due_date ? new Date(parse.data.due_date) : null;
      const oldDueStr = existing.dueDate ? existing.dueDate.toISOString() : '(không có)';
      const newDueStr = newDueDate ? newDueDate.toISOString() : '(không có)';
      if (oldDueStr !== newDueStr) {
        updateData.dueDate = newDueDate;
        changes.push({ field: 'due_date', old: oldDueStr, new_val: newDueStr });
      }
    }

    if (Object.keys(updateData).length === 0) {
      // No actual changes
      const task = await prisma.task.findFirst({
        where: { id: req.params.id },
        include: {
          project: { select: { id: true, name: true, color: true, archivedAt: true } },
          creator: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true } },
        },
      });
      const tRes = { ...task!, isOverdue: isOverdue(task?.dueDate ?? null) };
      const [fTask] = await attachAssigneeStatus(workspaceId, [tRes]);
      res.json({ success: true, data: { task: fTask } });
      return;
    }

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        project: { select: { id: true, name: true, color: true, archivedAt: true } },
        creator: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
    });

    // Create activity log for each changed field
    for (const change of changes) {
      await createActivityLog({
        taskId: task.id,
        userId: req.user!.userId,
        actionType: 'field_edited',
        fieldChanged: change.field,
        oldValue: change.old,
        newValue: change.new_val,
      });
    }

    // If assignee was changed, notify the new assignee
    if (updateData.assigneeId && updateData.assigneeId !== req.user!.userId) {
      await createNotification({
        userId: updateData.assigneeId as string,
        type: 'task_assigned',
        message: `Bạn được assign task mới: "${task.title}"`,
        referenceId: task.id,
      });
    }

    const taskResponse = {
      ...task,
      isOverdue: isOverdue(task.dueDate),
    };

    const [finalTask] = await attachAssigneeStatus(workspaceId, [taskResponse]);

    res.json({ success: true, data: { task: finalTask } });
  } catch (err) {
    console.error('Update task error:', err);
    res.status(500).json({ success: false, error: 'Có lỗi xảy ra. Thử lại?' });
  }
});

// ─── DELETE /api/tasks/:id — soft delete (Admin/Manager only) ──────────────────
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const workspaceId = req.headers['x-workspace-id'] as string;
  if (!workspaceId) {
    res.status(400).json({ success: false, error: 'x-workspace-id header required' });
    return;
  }

  try {
    const member = await getWorkspaceMember(workspaceId, req.user!.userId);
    if (!member || (member.role !== 'Admin' && member.role !== 'Manager')) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    const task = await prisma.task.findFirst({
      where: { id: req.params.id, workspaceId, deletedAt: null },
    });
    if (!task) {
      res.status(404).json({ success: false, error: 'Task không tồn tại.' });
      return;
    }

    await softDeleteTask(task.id, req.user!.userId);

    res.json({ success: true, data: { message: 'Task đã được chuyển vào thùng rác.' } });
  } catch (err) {
    console.error('Delete task error:', err);
    res.status(500).json({ success: false, error: 'Có lỗi xảy ra. Thử lại?' });
  }
});

// ─── POST /api/tasks/:id/restore — restore from trash (Admin only) ─────────────
router.post('/:id/restore', async (req: AuthRequest, res: Response): Promise<void> => {
  const workspaceId = req.headers['x-workspace-id'] as string;
  if (!workspaceId) {
    res.status(400).json({ success: false, error: 'x-workspace-id header required' });
    return;
  }

  try {
    const member = await getWorkspaceMember(workspaceId, req.user!.userId);
    if (!member || member.role !== 'Admin') {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    const validation = await validateRestore(req.params.id);
    if (!validation.valid) {
      res.status(validation.statusCode!).json({ success: false, error: validation.error });
      return;
    }

    const task = validation.task;

    // Check if assignee is still in workspace
    let newAssigneeId = task.assigneeId;
    if (newAssigneeId) {
      const assigneeInWs = await isAssigneeInWorkspace(newAssigneeId, workspaceId);
      if (!assigneeInWs) {
        newAssigneeId = null;
      }
    }

    // Restore task
    const restored = await prisma.task.update({
      where: { id: task.id },
      data: {
        deletedAt: null,
        assigneeId: newAssigneeId,
      },
      include: {
        project: { select: { id: true, name: true, color: true } },
        creator: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
    });

    // Activity log
    await createActivityLog({
      taskId: task.id,
      userId: req.user!.userId,
      actionType: 'restored',
    });

    const [finalTask] = await attachAssigneeStatus(workspaceId, [restored]);

    res.json({ success: true, data: { task: finalTask } });
  } catch (err) {
    console.error('Restore task error:', err);
    res.status(500).json({ success: false, error: 'Có lỗi xảy ra. Thử lại?' });
  }
});

// ─── GET /api/tasks/project/:projectId — list tasks in project ─────────────────
router.get('/project/:projectId', async (req: AuthRequest, res: Response): Promise<void> => {
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

    // Verify project belongs to workspace
    const project = await prisma.project.findFirst({
      where: { id: req.params.projectId, workspaceId },
    });
    if (!project) {
      res.status(404).json({ success: false, error: 'Dự án không tồn tại.' });
      return;
    }

    const tasks = await prisma.task.findMany({
      where: {
        projectId: req.params.projectId,
        workspaceId,
        deletedAt: null,
      },
      include: {
        project: { select: { id: true, name: true, color: true } },
        creator: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const tasksWithOverdue = tasks.map(t => ({
      ...t,
      isOverdue: isOverdue(t.dueDate),
    }));

    const finalTasks = await attachAssigneeStatus(workspaceId, tasksWithOverdue);

    res.json({ success: true, data: { tasks: finalTasks } });
  } catch (err) {
    console.error('List project tasks error:', err);
    res.status(500).json({ success: false, error: 'Có lỗi xảy ra. Thử lại?' });
  }
});

// ─── GET /api/tasks/:id/activity — activity log for a task ─────────────────────
router.get('/:id/activity', async (req: AuthRequest, res: Response): Promise<void> => {
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

    const task = await prisma.task.findFirst({
      where: { id: req.params.id, workspaceId },
    });
    if (!task) {
      res.status(404).json({ success: false, error: 'Task không tồn tại.' });
      return;
    }

    const activities = await prisma.activityLog.findMany({
      where: { taskId: req.params.id },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: { activities } });
  } catch (err) {
    console.error('Get activity log error:', err);
    res.status(500).json({ success: false, error: 'Có lỗi xảy ra. Thử lại?' });
  }
});

export default router;
