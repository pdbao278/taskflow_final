import request from 'supertest';
jest.setTimeout(30000);
import app from '../../src/app';
import { prisma } from '../../src/lib/prisma';

const ts = Date.now();
const ADMIN_EMAIL = `team_admin_${ts}@test.com`;
const MANAGER_EMAIL = `team_mgr_${ts}@test.com`;
const MEMBER_EMAIL = `team_member_${ts}@test.com`;
const PASSWORD = 'password123';

let adminToken: string;
let managerToken: string;
let memberToken: string;
let workspaceId: string;
let projectId: string;

describe('Team Kanban API (FR-08)', () => {
  beforeAll(async () => {
    // 1. Setup Users
    const adminRes = await request(app).post('/api/auth/register').send({ email: ADMIN_EMAIL, password: PASSWORD, name: 'Admin' });
    adminToken = adminRes.body.data.token;

    const mgrRes = await request(app).post('/api/auth/register').send({ email: MANAGER_EMAIL, password: PASSWORD, name: 'Manager' });
    managerToken = mgrRes.body.data.token;

    const memRes = await request(app).post('/api/auth/register').send({ email: MEMBER_EMAIL, password: PASSWORD, name: 'Member' });
    memberToken = memRes.body.data.token;

    // 2. Setup Workspace
    const wsRes = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Team Test WS' });
    workspaceId = wsRes.body.data.workspace.id;

    // Add members
    const mgrId = (await prisma.user.findUnique({ where: { email: MANAGER_EMAIL } }))!.id;
    const memId = (await prisma.user.findUnique({ where: { email: MEMBER_EMAIL } }))!.id;

    await prisma.workspaceMember.create({ data: { workspaceId, userId: mgrId, role: 'Manager' } });
    await prisma.workspaceMember.create({ data: { workspaceId, userId: memId, role: 'Member' } });

    // 3. Setup Project
    const projRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-workspace-id', workspaceId)
      .send({ name: 'Team Proj', color: '#123456' });
    projectId = projRes.body.data.project.id;

    // 4. Create some tasks
    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-workspace-id', workspaceId)
      .send({ title: 'Task 1', project_id: projectId });

    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-workspace-id', workspaceId)
      .send({ title: 'Task 2', project_id: projectId, assignee_id: memId });
  });

  afterAll(async () => {
    try {
      const users = await prisma.user.findMany({ where: { email: { contains: 'team_' } } });
      const ids = users.map(u => u.id);
      await prisma.activityLog.deleteMany({ where: { task: { workspaceId } } });
      await prisma.notification.deleteMany({ where: { userId: { in: ids } } });
      await prisma.task.deleteMany({ where: { workspaceId } });
      await prisma.workspace.deleteMany({ where: { createdBy: { in: ids } } });
      await prisma.user.deleteMany({ where: { id: { in: ids } } });
    } catch {}
  });

  it('1. GET /api/tasks/team — Admin can access — 200', async () => {
    const res = await request(app)
      .get('/api/tasks/team')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-workspace-id', workspaceId);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.tasks)).toBe(true);
    expect(res.body.data.tasks.length).toBeGreaterThanOrEqual(2);
  });

  it('2. GET /api/tasks/team — Manager can access — 200', async () => {
    const res = await request(app)
      .get('/api/tasks/team')
      .set('Authorization', `Bearer ${managerToken}`)
      .set('x-workspace-id', workspaceId);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.tasks)).toBe(true);
  });

  it('3. GET /api/tasks/team — Member CANNOT access — 403', async () => {
    const res = await request(app)
      .get('/api/tasks/team')
      .set('Authorization', `Bearer ${memberToken}`)
      .set('x-workspace-id', workspaceId);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
