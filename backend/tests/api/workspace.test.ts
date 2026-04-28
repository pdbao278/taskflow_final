import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/lib/prisma';

const ts = Date.now();
const ADMIN_EMAIL = `ws_admin_${ts}@taskflow-test.com`;
const MANAGER_EMAIL = `ws_mgr_${ts}@taskflow-test.com`;
const MEMBER_EMAIL = `ws_member_${ts}@taskflow-test.com`;
const OUTSIDER_EMAIL = `ws_outside_${ts}@taskflow-test.com`;
const INVITE_EMAIL = `ws_invite_${ts}@taskflow-test.com`;
const PASSWORD = 'testpassword123';

let adminToken: string;
let managerToken: string;
let memberToken: string;
let outsiderToken: string;
let workspaceId: string;
let workspace2Id: string;
let memberMemberId: string; // WorkspaceMember.id for the Member user

describe('Workspace API — Integration Tests', () => {
  beforeAll(async () => {
    // Register all users
    const adminRes = await request(app)
      .post('/api/auth/register')
      .send({ email: ADMIN_EMAIL, password: PASSWORD, name: 'WS Admin' });
    adminToken = adminRes.body.data.token;

    const mgrRes = await request(app)
      .post('/api/auth/register')
      .send({ email: MANAGER_EMAIL, password: PASSWORD, name: 'WS Manager' });
    managerToken = mgrRes.body.data.token;

    const memberRes = await request(app)
      .post('/api/auth/register')
      .send({ email: MEMBER_EMAIL, password: PASSWORD, name: 'WS Member' });
    memberToken = memberRes.body.data.token;

    const outsiderRes = await request(app)
      .post('/api/auth/register')
      .send({ email: OUTSIDER_EMAIL, password: PASSWORD, name: 'WS Outsider' });
    outsiderToken = outsiderRes.body.data.token;
  });

  afterAll(async () => {
    try {
      // Delete workspaces first to satisfy FK constraints (created_by)
      const testUsers = await prisma.user.findMany({
        where: { email: { contains: 'taskflow-test.com' } },
        select: { id: true },
      });
      const userIds = testUsers.map(u => u.id);
      await prisma.workspace.deleteMany({ where: { createdBy: { in: userIds } } });
      await prisma.user.deleteMany({ where: { email: { contains: 'taskflow-test.com' } } });
    } catch {}
  });

  // ── Create Workspace ─────────────────────────────────────────────────────────
  describe('POST /api/workspaces', () => {
    it('should create workspace and return creator as Admin', async () => {
      const res = await request(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test Workspace 1' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.workspace.name).toBe('Test Workspace 1');
      workspaceId = res.body.data.workspace.id;

      // Verify creator is Admin
      const member = await prisma.workspaceMember.findFirst({
        where: { workspaceId },
      });
      expect(member?.role).toBe('Admin');
    });

    it('should reject empty name', async () => {
      const res = await request(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: '' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ── List Workspaces ──────────────────────────────────────────────────────────
  describe('GET /api/workspaces', () => {
    it('should list workspaces user is a member of', async () => {
      const res = await request(app)
        .get('/api/workspaces')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.workspaces)).toBe(true);
      const found = res.body.data.workspaces.find((w: { id: string }) => w.id === workspaceId);
      expect(found).toBeTruthy();
    });
  });

  // ── Get Workspace Detail ─────────────────────────────────────────────────────
  describe('GET /api/workspaces/:id', () => {
    it('member can get workspace detail', async () => {
      const res = await request(app)
        .get(`/api/workspaces/${workspaceId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.workspace.id).toBe(workspaceId);
    });

    it('non-member gets 403', async () => {
      const res = await request(app)
        .get(`/api/workspaces/${workspaceId}`)
        .set('Authorization', `Bearer ${outsiderToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ── Rename Workspace ─────────────────────────────────────────────────────────
  describe('PATCH /api/workspaces/:id', () => {
    it('Admin can rename workspace', async () => {
      const res = await request(app)
        .patch(`/api/workspaces/${workspaceId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Renamed Workspace' });

      expect(res.status).toBe(200);
      expect(res.body.data.workspace.name).toBe('Renamed Workspace');
    });

    it('non-Admin gets 403', async () => {
      // Manager not yet added, so this tests outsider → 403
      const res = await request(app)
        .patch(`/api/workspaces/${workspaceId}`)
        .set('Authorization', `Bearer ${outsiderToken}`)
        .send({ name: 'Hack' });

      expect(res.status).toBe(403);
    });

    it('empty name returns 400', async () => {
      const res = await request(app)
        .patch(`/api/workspaces/${workspaceId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: '' });

      expect(res.status).toBe(400);
    });
  });

  // ── Invite ───────────────────────────────────────────────────────────────────
  describe('POST /api/workspaces/invite', () => {
    it('Admin can invite a new email', async () => {
      const res = await request(app)
        .post('/api/workspaces/invite')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-workspace-id', workspaceId)
        .send({ email: INVITE_EMAIL, role: 'Member' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify invite token created
      const invite = await prisma.inviteToken.findFirst({
        where: { workspaceId, email: INVITE_EMAIL },
      });
      expect(invite).toBeTruthy();
      expect(invite?.role).toBe('Member');
    });

    it('Re-invite same email updates existing invite (upsert)', async () => {
      const res = await request(app)
        .post('/api/workspaces/invite')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-workspace-id', workspaceId)
        .send({ email: INVITE_EMAIL, role: 'Manager' });

      expect(res.status).toBe(200);

      // Should still be 1 invite record, not 2
      const invites = await prisma.inviteToken.findMany({
        where: { workspaceId, email: INVITE_EMAIL, acceptedAt: null },
      });
      expect(invites).toHaveLength(1);
      expect(invites[0].role).toBe('Manager');
    });

    it('Cannot invite existing member — 409', async () => {
      // Admin itself is already a member
      const res = await request(app)
        .post('/api/workspaces/invite')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-workspace-id', workspaceId)
        .send({ email: ADMIN_EMAIL, role: 'Member' });

      expect(res.status).toBe(409);
      expect(res.body.error).toContain('đã là thành viên');
    });
  });

  // ── Invite Token Validation ──────────────────────────────────────────────────
  describe('GET /api/invite?token=', () => {
    let validToken: string;

    beforeAll(async () => {
      const inv = await prisma.inviteToken.findFirst({
        where: { workspaceId, email: INVITE_EMAIL, acceptedAt: null },
      });
      validToken = inv!.token;
    });

    it('valid token returns invite info', async () => {
      const res = await request(app).get(`/api/invite?token=${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe(INVITE_EMAIL);
      expect(res.body.data.workspaceId).toBe(workspaceId);
    });

    it('expired token returns 410', async () => {
      // Create an expired invite
      const expiredToken = 'expired_token_test_' + Date.now();
      await prisma.inviteToken.create({
        data: {
          workspaceId,
          email: `expired_${ts}@taskflow-test.com`,
          role: 'Member',
          token: expiredToken,
          expiresAt: new Date(Date.now() - 1000), // 1 second in the past
        },
      });

      const res = await request(app).get(`/api/invite?token=${expiredToken}`);
      expect(res.status).toBe(410);
    });

    it('invalid token returns 404', async () => {
      const res = await request(app).get('/api/invite?token=nonexistenttoken999');
      expect(res.status).toBe(404);
    });
  });

  // ── Member Management ─────────────────────────────────────────────────────────
  describe('Member Management', () => {
    beforeAll(async () => {
      // Manually add manager and member to workspace for further tests
      const managerUser = await prisma.user.findUnique({ where: { email: MANAGER_EMAIL } });
      const memberUser = await prisma.user.findUnique({ where: { email: MEMBER_EMAIL } });

      await prisma.workspaceMember.create({
        data: { workspaceId, userId: managerUser!.id, role: 'Manager' },
      });

      const mem = await prisma.workspaceMember.create({
        data: { workspaceId, userId: memberUser!.id, role: 'Member' },
      });
      memberMemberId = mem.id;
    });

    it('GET /api/workspaces/members — returns members list', async () => {
      const res = await request(app)
        .get('/api/workspaces/members')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-workspace-id', workspaceId);

      expect(res.status).toBe(200);
      expect(res.body.data.members.length).toBeGreaterThanOrEqual(3);
    });

    it('PATCH /api/workspaces/members/:id/role — Admin can change role', async () => {
      const res = await request(app)
        .patch(`/api/workspaces/members/${memberMemberId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-workspace-id', workspaceId)
        .send({ role: 'Manager' });

      expect(res.status).toBe(200);
      expect(res.body.data.member.role).toBe('Manager');

      // Reset role
      await prisma.workspaceMember.update({
        where: { id: memberMemberId },
        data: { role: 'Member' },
      });
    });

    it('PATCH /api/workspaces/members/:id/role — non-Admin gets 403', async () => {
      const res = await request(app)
        .patch(`/api/workspaces/members/${memberMemberId}/role`)
        .set('Authorization', `Bearer ${managerToken}`)
        .set('x-workspace-id', workspaceId)
        .send({ role: 'Manager' });

      expect(res.status).toBe(403);
    });

    it('DELETE /api/workspaces/members/:id — Admin cannot self-delete', async () => {
      const adminMember = await prisma.workspaceMember.findFirst({
        where: { workspaceId, role: 'Admin' },
      });

      const res = await request(app)
        .delete(`/api/workspaces/members/${adminMember!.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-workspace-id', workspaceId);

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Không thể xóa Admin đang đăng nhập');
    });

    it('DELETE /api/workspaces/members/:id — Admin can remove other member', async () => {
      const res = await request(app)
        .delete(`/api/workspaces/members/${memberMemberId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-workspace-id', workspaceId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify member removed from DB
      const check = await prisma.workspaceMember.findUnique({ where: { id: memberMemberId } });
      expect(check).toBeNull();
    });

    it('Cross-workspace isolation — outsider gets 403', async () => {
      const res = await request(app)
        .get('/api/workspaces/members')
        .set('Authorization', `Bearer ${outsiderToken}`)
        .set('x-workspace-id', workspaceId);

      expect(res.status).toBe(403);
    });
  });

  // ── Delete Workspace ──────────────────────────────────────────────────────────
  describe('DELETE /api/workspaces/:id', () => {
    it('Admin can delete workspace when has 2+', async () => {
      // Create second workspace for admin first
      const ws2Res = await request(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test Workspace 2' });
      workspace2Id = ws2Res.body.data.workspace.id;

      const res = await request(app)
        .delete(`/api/workspaces/${workspaceId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify cascade: workspace deleted
      const ws = await prisma.workspace.findUnique({ where: { id: workspaceId } });
      expect(ws).toBeNull();
    });

    it('Cannot delete last workspace — 400', async () => {
      // Now admin only has workspace2Id
      const res = await request(app)
        .delete(`/api/workspaces/${workspace2Id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Không thể xóa workspace cuối cùng');
    });

    it('non-Admin gets 403', async () => {
      const res = await request(app)
        .delete(`/api/workspaces/${workspace2Id}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(403);
    });
  });
});
