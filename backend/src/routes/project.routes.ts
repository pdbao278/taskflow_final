import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { createProjectSchema, updateProjectSchema } from '../schemas/project.schema';
import { getTaskCountsForProjects, getTaskCount, canCreateTask } from '../services/project.service';

const router = Router();

// All project routes require auth
router.use(authMiddleware);

// ─── Helper: get workspace member + role ──────────────────────────────────────
async function getWorkspaceMember(workspaceId: string, userId: string) {
  return prisma.workspaceMember.findFirst({
    where: { workspaceId, userId },
  });
}

// ─── GET /api/projects — list projects for current workspace ───────────────────
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const workspaceId = req.headers['x-workspace-id'] as string;
  if (!workspaceId) {
    res.status(400).json({ success: false, error: 'x-workspace-id header required' });
    return;
  }

  try {
    // Verify user is a member
    const member = await getWorkspaceMember(workspaceId, req.user!.userId);
    if (!member) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    const projects = await prisma.project.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });

    // Get task counts for all projects efficiently
    const projectIds = projects.map(p => p.id);
    const taskCounts = await getTaskCountsForProjects(projectIds);

    const projectsWithCounts = projects.map(p => ({
      ...p,
      taskCount: taskCounts[p.id] || { total: 0, done: 0 },
    }));

    res.json({ success: true, data: { projects: projectsWithCounts } });
  } catch (err) {
    console.error('List projects error:', err);
    res.status(500).json({ success: false, error: 'Có lỗi xảy ra. Thử lại?' });
  }
});

// ─── POST /api/projects — create project (Admin/Manager only) ──────────────────
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const workspaceId = req.headers['x-workspace-id'] as string;
  if (!workspaceId) {
    res.status(400).json({ success: false, error: 'x-workspace-id header required' });
    return;
  }

  const parse = createProjectSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ success: false, error: parse.error.errors[0]?.message });
    return;
  }

  try {
    // Check role — only Admin/Manager can create projects
    const member = await getWorkspaceMember(workspaceId, req.user!.userId);
    if (!member) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }
    if (member.role === 'Member') {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    const { name, description, color } = parse.data;

    const project = await prisma.project.create({
      data: {
        workspaceId,
        name,
        description: description || null,
        color,
        createdBy: req.user!.userId,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        project: {
          ...project,
          taskCount: { total: 0, done: 0 },
        },
      },
    });
  } catch (err) {
    console.error('Create project error:', err);
    res.status(500).json({ success: false, error: 'Có lỗi xảy ra. Thử lại?' });
  }
});

// ─── GET /api/projects/:id — project detail ────────────────────────────────────
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

    const project = await prisma.project.findFirst({
      where: { id: req.params.id, workspaceId },
    });

    if (!project) {
      res.status(404).json({ success: false, error: 'Dự án không tồn tại.' });
      return;
    }

    const taskCount = await getTaskCount(project.id);

    res.json({
      success: true,
      data: {
        project: { ...project, taskCount },
      },
    });
  } catch (err) {
    console.error('Get project error:', err);
    res.status(500).json({ success: false, error: 'Có lỗi xảy ra. Thử lại?' });
  }
});

// ─── PATCH /api/projects/:id — update project (Admin/Manager) ──────────────────
router.patch('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const workspaceId = req.headers['x-workspace-id'] as string;
  if (!workspaceId) {
    res.status(400).json({ success: false, error: 'x-workspace-id header required' });
    return;
  }

  const parse = updateProjectSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ success: false, error: parse.error.errors[0]?.message });
    return;
  }

  try {
    const member = await getWorkspaceMember(workspaceId, req.user!.userId);
    if (!member || member.role === 'Member') {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    // Verify project belongs to this workspace
    const existing = await prisma.project.findFirst({
      where: { id: req.params.id, workspaceId },
    });
    if (!existing) {
      res.status(404).json({ success: false, error: 'Dự án không tồn tại.' });
      return;
    }

    const updateData: Record<string, unknown> = {};
    if (parse.data.name !== undefined) updateData.name = parse.data.name;
    if (parse.data.description !== undefined) updateData.description = parse.data.description || null;
    if (parse.data.color !== undefined) updateData.color = parse.data.color;

    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: updateData,
    });

    const taskCount = await getTaskCount(project.id);

    res.json({
      success: true,
      data: { project: { ...project, taskCount } },
    });
  } catch (err) {
    console.error('Update project error:', err);
    res.status(500).json({ success: false, error: 'Có lỗi xảy ra. Thử lại?' });
  }
});

// ─── PATCH /api/projects/:id/archive — archive project (Admin/Manager) ─────────
router.patch('/:id/archive', async (req: AuthRequest, res: Response): Promise<void> => {
  const workspaceId = req.headers['x-workspace-id'] as string;
  if (!workspaceId) {
    res.status(400).json({ success: false, error: 'x-workspace-id header required' });
    return;
  }

  try {
    const member = await getWorkspaceMember(workspaceId, req.user!.userId);
    if (!member || member.role === 'Member') {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    // Verify project belongs to this workspace
    const existing = await prisma.project.findFirst({
      where: { id: req.params.id, workspaceId },
    });
    if (!existing) {
      res.status(404).json({ success: false, error: 'Dự án không tồn tại.' });
      return;
    }

    if (existing.archivedAt) {
      res.status(400).json({ success: false, error: 'Dự án đã được archive.' });
      return;
    }

    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: { archivedAt: new Date() },
    });

    const taskCount = await getTaskCount(project.id);

    res.json({
      success: true,
      data: { project: { ...project, taskCount } },
    });
  } catch (err) {
    console.error('Archive project error:', err);
    res.status(500).json({ success: false, error: 'Có lỗi xảy ra. Thử lại?' });
  }
});

// ─── GET /api/projects/:id/tasks — list tasks in project ────────────────────────
router.get('/:id/tasks', async (req: AuthRequest, res: Response): Promise<void> => {
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
      where: { id: req.params.id, workspaceId },
    });
    if (!project) {
      res.status(404).json({ success: false, error: 'Dự án không tồn tại.' });
      return;
    }

    const tasks = await prisma.task.findMany({
      where: {
        projectId: req.params.id,
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

    const tasksWithOverdue = tasks.map(t => {
      const isOverdue = t.dueDate && t.dueDate < new Date() && t.status !== 'Done';
      return { ...t, isOverdue: !!isOverdue };
    });

    res.json({ success: true, data: { tasks: tasksWithOverdue } });
  } catch (err) {
    console.error('List project tasks error:', err);
    res.status(500).json({ success: false, error: 'Có lỗi xảy ra. Thử lại?' });
  }
});

export default router;
