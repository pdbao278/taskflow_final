import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

// All workspace routes require auth
router.use(authMiddleware);

const workspaceNameSchema = z.object({
  name: z.string().min(1, 'Tên workspace không được để trống').max(100, 'Tên workspace tối đa 100 ký tự'),
});

// GET /api/workspaces - list workspaces user is a member of
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const members = await prisma.workspaceMember.findMany({
      where: { userId: req.user!.userId },
      include: { workspace: true },
      orderBy: { joinedAt: 'asc' },
    });
    res.json({
      success: true,
      data: { workspaces: members.map(m => ({ ...m.workspace, role: m.role })) },
    });
  } catch (err) {
    console.error('List workspaces error:', err);
    res.status(500).json({ success: false, error: 'Có lỗi xảy ra. Thử lại?' });
  }
});

// POST /api/workspaces - create a new workspace (creator becomes Admin)
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const parse = workspaceNameSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ success: false, error: parse.error.errors[0]?.message });
    return;
  }

  const { name } = parse.data;
  const userId = req.user!.userId;

  try {
    const workspace = await prisma.workspace.create({
      data: {
        name,
        createdBy: userId,
        members: {
          create: { userId, role: 'Admin' },
        },
      },
    });
    res.status(201).json({ success: true, data: { workspace } });
  } catch (err) {
    console.error('Create workspace error:', err);
    res.status(500).json({ success: false, error: 'Có lỗi xảy ra. Thử lại?' });
  }
});

// GET /api/workspaces/:id - workspace detail
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const member = await prisma.workspaceMember.findFirst({
      where: { workspaceId: req.params.id, userId: req.user!.userId },
    });
    if (!member) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }
    const workspace = await prisma.workspace.findUnique({ where: { id: req.params.id } });
    res.json({ success: true, data: { workspace, role: member.role } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Có lỗi xảy ra. Thử lại?' });
  }
});

// PATCH /api/workspaces/:id - rename (Admin only)
router.patch('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const parse = workspaceNameSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ success: false, error: parse.error.errors[0]?.message });
    return;
  }

  try {
    const member = await prisma.workspaceMember.findFirst({
      where: { workspaceId: req.params.id, userId: req.user!.userId },
    });
    if (!member || member.role !== 'Admin') {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }
    const workspace = await prisma.workspace.update({
      where: { id: req.params.id },
      data: { name: parse.data.name },
    });
    res.json({ success: true, data: { workspace } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Có lỗi xảy ra. Thử lại?' });
  }
});

// DELETE /api/workspaces/:id - delete (Admin only, not last workspace)
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  try {
    const member = await prisma.workspaceMember.findFirst({
      where: { workspaceId: req.params.id, userId },
    });
    if (!member || member.role !== 'Admin') {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    const workspaceCount = await prisma.workspaceMember.count({ where: { userId } });
    if (workspaceCount <= 1) {
      res.status(400).json({
        success: false,
        error: 'Bạn phải có ít nhất 1 workspace. Không thể xóa workspace cuối cùng.',
      });
      return;
    }

    await prisma.workspace.delete({ where: { id: req.params.id } });
    res.json({ success: true, data: { message: 'Workspace đã được xóa.' } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Có lỗi xảy ra. Thử lại?' });
  }
});

export default router;
