import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { z } from 'zod';
import { canDeleteWorkspace } from '../services/workspace.service';
import { generateInviteToken, getInviteExpiry } from '../services/invite.service';
import { sendInviteEmail } from '../services/email.service';
import { createNotification, notifyWorkspaceMembers } from '../services/notification.service';

const router = Router();

// All workspace routes require auth
router.use(authMiddleware);

const workspaceNameSchema = z.object({
  name: z.string().min(1, 'Tên workspace không được để trống').max(100, 'Tên workspace tối đa 100 ký tự'),
});

const inviteSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  role: z.enum(['Manager', 'Member'], { errorMap: () => ({ message: 'Vai trò phải là Manager hoặc Member' }) }),
});

const changeRoleSchema = z.object({
  role: z.enum(['Manager', 'Member'], { errorMap: () => ({ message: 'Vai trò phải là Manager hoặc Member' }) }),
});

// ─── Workspace CRUD ────────────────────────────────────────────────────────────

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

// GET /api/workspaces/members - list members + pending invites for current workspace
// Note: workspaceId from x-workspace-id header
router.get('/members', async (req: AuthRequest, res: Response): Promise<void> => {
  const workspaceId = req.headers['x-workspace-id'] as string;
  if (!workspaceId) {
    res.status(400).json({ success: false, error: 'x-workspace-id header required' });
    return;
  }

  try {
    // Verify user is a member
    const actor = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: req.user!.userId },
    });
    if (!actor) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    // Fetch active members
    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { joinedAt: 'asc' },
    });

    // Fetch pending invites (not yet accepted, not expired)
    const pendingInvites = await prisma.inviteToken.findMany({
      where: {
        workspaceId,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: {
        members: members.map(m => ({
          id: m.id,
          userId: m.userId,
          name: m.user.name,
          email: m.user.email,
          role: m.role,
          joinedAt: m.joinedAt,
        })),
        pendingInvites: pendingInvites.map(inv => ({
          id: inv.id,
          email: inv.email,
          role: inv.role,
          expiresAt: inv.expiresAt,
          createdAt: inv.createdAt,
        })),
      },
    });
  } catch (err) {
    console.error('List members error:', err);
    res.status(500).json({ success: false, error: 'Có lỗi xảy ra. Thử lại?' });
  }
});

// POST /api/workspaces/invite - send invite email (Admin only), upsert
router.post('/invite', async (req: AuthRequest, res: Response): Promise<void> => {
  const workspaceId = req.headers['x-workspace-id'] as string;
  if (!workspaceId) {
    res.status(400).json({ success: false, error: 'x-workspace-id header required' });
    return;
  }

  const parse = inviteSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ success: false, error: parse.error.errors[0]?.message });
    return;
  }

  const { email, role } = parse.data;
  const userId = req.user!.userId;

  try {
    // Check actor is Admin
    const actor = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId },
      include: { user: true },
    });
    if (!actor || actor.role !== 'Admin') {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    // Check if email is already a member
    const existingMember = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        user: { email },
      },
    });
    if (existingMember) {
      res.status(409).json({ success: false, error: 'Email này đã là thành viên của workspace.' });
      return;
    }

    // Get workspace info for email
    const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!workspace) {
      res.status(404).json({ success: false, error: 'Workspace không tồn tại.' });
      return;
    }

    // Upsert invite token
    const token = generateInviteToken();
    const expiresAt = getInviteExpiry();

    // Check for existing pending invite for this email in this workspace
    const existingInvite = await prisma.inviteToken.findFirst({
      where: { workspaceId, email, acceptedAt: null },
    });

    let isReinvite = false;
    if (existingInvite) {
      // Update existing invite with new token/role/expires
      await prisma.inviteToken.update({
        where: { id: existingInvite.id },
        data: { token, role, expiresAt },
      });
      isReinvite = true;
    } else {
      await prisma.inviteToken.create({
        data: { workspaceId, email, role, token, expiresAt },
      });
    }

    // Send invite email
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const inviteLink = `${frontendUrl}/invite?token=${token}`;

    try {
      await sendInviteEmail({
        recipientEmail: email,
        inviterName: actor.user.name,
        workspaceName: workspace.name,
        role: role as 'Manager' | 'Member',
        inviteLink,
      });
    } catch (emailErr) {
      console.error('[Invite] Email send failed (non-fatal):', emailErr);
    }

    const message = isReinvite ? 'Đã gửi lại lời mời thành công' : 'Đã gửi lời mời thành công';
    res.json({ success: true, data: { message } });
  } catch (err) {
    console.error('Invite error:', err);
    res.status(500).json({ success: false, error: 'Có lỗi xảy ra. Thử lại?' });
  }
});

// PATCH /api/workspaces/members/:id/role - Admin changes member role
router.patch('/members/:id/role', async (req: AuthRequest, res: Response): Promise<void> => {
  const workspaceId = req.headers['x-workspace-id'] as string;
  if (!workspaceId) {
    res.status(400).json({ success: false, error: 'x-workspace-id header required' });
    return;
  }

  const parse = changeRoleSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ success: false, error: parse.error.errors[0]?.message });
    return;
  }

  try {
    // Check actor is Admin
    const actor = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: req.user!.userId },
    });
    if (!actor || actor.role !== 'Admin') {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    // Find target member record
    const target = await prisma.workspaceMember.findFirst({
      where: { id: req.params.id, workspaceId },
    });
    if (!target) {
      res.status(404).json({ success: false, error: 'Thành viên không tìm thấy.' });
      return;
    }

    const updated = await prisma.workspaceMember.update({
      where: { id: req.params.id },
      data: { role: parse.data.role },
    });
    res.json({ success: true, data: { member: updated } });
  } catch (err) {
    console.error('Change role error:', err);
    res.status(500).json({ success: false, error: 'Có lỗi xảy ra. Thử lại?' });
  }
});

// DELETE /api/workspaces/members/:id - Admin removes member (no self-delete)
router.delete('/members/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const workspaceId = req.headers['x-workspace-id'] as string;
  if (!workspaceId) {
    res.status(400).json({ success: false, error: 'x-workspace-id header required' });
    return;
  }

  try {
    // Check actor is Admin
    const actor = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: req.user!.userId },
    });
    if (!actor || actor.role !== 'Admin') {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    // Find target member record
    const target = await prisma.workspaceMember.findFirst({
      where: { id: req.params.id, workspaceId },
      include: { user: true },
    });
    if (!target) {
      res.status(404).json({ success: false, error: 'Thành viên không tìm thấy.' });
      return;
    }

    // Prevent self-delete
    if (target.userId === req.user!.userId) {
      res.status(403).json({ success: false, error: 'Không thể xóa Admin đang đăng nhập.' });
      return;
    }

    // Delete the member
    await prisma.workspaceMember.delete({ where: { id: req.params.id } });

    // Unassign tasks in this workspace that were assigned to removed user
    await prisma.task.updateMany({
      where: { workspaceId, assigneeId: target.userId, deletedAt: null },
      data: { assigneeId: null },
    });

    // Notify managers about unassigned tasks
    const managers = await prisma.workspaceMember.findMany({
      where: { workspaceId, role: { in: ['Admin', 'Manager'] } },
      select: { userId: true },
    });
    for (const mgr of managers) {
      if (mgr.userId !== req.user!.userId) {
        await createNotification({
          userId: mgr.userId,
          type: 'assignee_removed',
          message: `Assignee ${target.user.name} đã rời workspace. Các task của họ hiện là chưa giao.`,
        });
      }
    }

    res.json({ success: true, data: { message: 'Đã xóa thành viên.' } });
  } catch (err) {
    console.error('Delete member error:', err);
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

    const canDelete = await canDeleteWorkspace(userId);
    if (!canDelete) {
      res.status(400).json({
        success: false,
        error: 'Bạn phải có ít nhất 1 workspace. Không thể xóa workspace cuối cùng.',
      });
      return;
    }

    // Get workspace details before deleting
    const workspace = await prisma.workspace.findUnique({ where: { id: req.params.id } });
    if (!workspace) {
      res.status(404).json({ success: false, error: 'Workspace không tồn tại.' });
      return;
    }

    // Get all other members to notify them
    const otherMembers = await prisma.workspaceMember.findMany({
      where: { workspaceId: req.params.id, userId: { not: userId } },
      select: { userId: true },
    });

    // Hard delete workspace (cascades to projects, tasks, members, invites, etc.)
    await prisma.workspace.delete({ where: { id: req.params.id } });

    // Notify all other members (notifications are cascade-deleted, so we create for other workspaces)
    // NOTE: Since notifications are in the workspace context and cascade deleted, 
    // this is best-effort after deletion — we can only notify users who may still be in the system
    for (const m of otherMembers) {
      try {
        // Create notification in a different context (no workspace reference)
        await prisma.notification.create({
          data: {
            userId: m.userId,
            type: 'workspace_deleted',
            message: `Workspace "${workspace.name}" đã bị xóa bởi Admin.`,
          },
        });
      } catch {
        // Non-fatal if notification creation fails after deletion
      }
    }

    res.json({ success: true, data: { message: `Workspace "${workspace.name}" đã được xóa.` } });
  } catch (err) {
    console.error('Delete workspace error:', err);
    res.status(500).json({ success: false, error: 'Có lỗi xảy ra. Thử lại?' });
  }
});

export default router;
