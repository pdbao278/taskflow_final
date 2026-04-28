import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/lib/prisma';
import { canCreateTask, getTaskCount } from '../../src/services/project.service';

const ts = Date.now();
const ADMIN_EMAIL = `proj_admin_${ts}@taskflow-test.com`;
const MANAGER_EMAIL = `proj_mgr_${ts}@taskflow-test.com`;
const MEMBER_EMAIL = `proj_member_${ts}@taskflow-test.com`;
const PASSWORD = 'testpassword123';

let adminToken: string;
let managerToken: string;
let memberToken: string;
let workspaceId: string;
let projectId: string;

describe('Project API — Integration Tests', () => {
  beforeAll(async () => {
    // Register all users
    const adminRes = await request(app)
      .post('/api/auth/register')
      .send({ email: ADMIN_EMAIL, password: PASSWORD, name: 'Proj Admin' });
    adminToken = adminRes.body.data.token;

    const mgrRes = await request(app)
      .post('/api/auth/register')
      .send({ email: MANAGER_EMAIL, password: PASSWORD, name: 'Proj Manager' });
    managerToken = mgrRes.body.data.token;

    const memberRes = await request(app)
      .post('/api/auth/register')
      .send({ email: MEMBER_EMAIL, password: PASSWORD, name: 'Proj Member' });
    memberToken = memberRes.body.data.token;

    // Create workspace (admin)
    const wsRes = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Project Test WS' });
    workspaceId = wsRes.body.data.workspace.id;

    // Add manager and member to workspace
    const mgrUser = await prisma.user.findUnique({ where: { email: MANAGER_EMAIL } });
    const memUser = await prisma.user.findUnique({ where: { email: MEMBER_EMAIL } });

    await prisma.workspaceMember.create({
      data: { workspaceId, userId: mgrUser!.id, role: 'Manager' },
    });
    await prisma.workspaceMember.create({
      data: { workspaceId, userId: memUser!.id, role: 'Member' },
    });
  });

  afterAll(async () => {
    try {
      const testUsers = await prisma.user.findMany({
        where: { email: { contains: 'taskflow-test.com' } },
        select: { id: true },
      });
      const userIds = testUsers.map(u => u.id);
      await prisma.workspace.deleteMany({ where: { createdBy: { in: userIds } } });
      await prisma.user.deleteMany({ where: { email: { contains: 'taskflow-test.com' } } });
    } catch {}
  });

  // ── POST /api/projects — Manager creates ───────────────────────────────────
  describe('POST /api/projects', () => {
    it('Manager can create project — 201', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${managerToken}`)
        .set('x-workspace-id', workspaceId)
        .send({ name: 'Website Redesign', description: 'Redesign the main website', color: '#3B82F6' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.project.name).toBe('Website Redesign');
      expect(res.body.data.project.color).toBe('#3B82F6');
      expect(res.body.data.project.taskCount).toEqual({ total: 0, done: 0 });
      projectId = res.body.data.project.id;
    });

    it('Member cannot create project — 403', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${memberToken}`)
        .set('x-workspace-id', workspaceId)
        .send({ name: 'Member Project', description: '', color: '#EF4444' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('Empty project name — 400', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${managerToken}`)
        .set('x-workspace-id', workspaceId)
        .send({ name: '', color: '#10B981' });

      expect(res.status).toBe(400);
    });
  });

  // ── GET /api/projects — list projects ─────────────────────────────────────
  describe('GET /api/projects', () => {
    it('returns projects with task counts', async () => {
      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-workspace-id', workspaceId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.projects)).toBe(true);
      expect(res.body.data.projects.length).toBeGreaterThanOrEqual(1);

      const found = res.body.data.projects.find((p: { id: string }) => p.id === projectId);
      expect(found).toBeTruthy();
      expect(found.taskCount).toEqual({ total: 0, done: 0 });
    });
  });

  // ── PATCH /api/projects/:id — update ──────────────────────────────────────
  describe('PATCH /api/projects/:id', () => {
    it('Admin/Manager can update project', async () => {
      const res = await request(app)
        .patch(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-workspace-id', workspaceId)
        .send({ name: 'Updated Website', description: 'Updated description', color: '#F59E0B' });

      expect(res.status).toBe(200);
      expect(res.body.data.project.name).toBe('Updated Website');
      expect(res.body.data.project.color).toBe('#F59E0B');
    });

    it('Member cannot update project — 403', async () => {
      const res = await request(app)
        .patch(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .set('x-workspace-id', workspaceId)
        .send({ name: 'Hacked' });

      expect(res.status).toBe(403);
    });
  });

  // ── PATCH /api/projects/:id/archive — archive ─────────────────────────────
  describe('PATCH /api/projects/:id/archive', () => {
    it('Manager can archive project — 200', async () => {
      const res = await request(app)
        .patch(`/api/projects/${projectId}/archive`)
        .set('Authorization', `Bearer ${managerToken}`)
        .set('x-workspace-id', workspaceId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.project.archivedAt).toBeTruthy();
    });

    it('Cannot archive already archived project — 400', async () => {
      const res = await request(app)
        .patch(`/api/projects/${projectId}/archive`)
        .set('Authorization', `Bearer ${managerToken}`)
        .set('x-workspace-id', workspaceId);

      expect(res.status).toBe(400);
    });

    it('Member cannot archive — 403', async () => {
      // Create a fresh project to test member archive
      const createRes = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-workspace-id', workspaceId)
        .send({ name: 'Member Archive Test', description: '', color: '#8B5CF6' });
      const newProjectId = createRes.body.data.project.id;

      const res = await request(app)
        .patch(`/api/projects/${newProjectId}/archive`)
        .set('Authorization', `Bearer ${memberToken}`)
        .set('x-workspace-id', workspaceId);

      expect(res.status).toBe(403);
    });
  });

  // ── Unit Tests: canCreateTask & getTaskCount ──────────────────────────────
  describe('Unit Tests — project.service', () => {
    it('canCreateTask returns false when project is archived', async () => {
      const result = await canCreateTask(projectId);
      expect(result).toBe(false);
    });

    it('canCreateTask returns true when project is active', async () => {
      // Create a fresh non-archived project
      const proj = await prisma.project.create({
        data: {
          workspaceId,
          name: 'Active Test',
          color: '#14B8A6',
          createdBy: (await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } }))!.id,
        },
      });
      const result = await canCreateTask(proj.id);
      expect(result).toBe(true);

      // Cleanup
      await prisma.project.delete({ where: { id: proj.id } });
    });

    it('getTaskCount returns correct counts', async () => {
      const counts = await getTaskCount(projectId);
      expect(counts).toEqual({ total: 0, done: 0 });
    });
  });
});
