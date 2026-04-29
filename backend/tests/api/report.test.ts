import request from 'supertest';
jest.setTimeout(30000);
import app from '../../src/app';
import { prisma } from '../../src/lib/prisma';

const ts = Date.now();
const ADMIN_EMAIL = `report_admin_${ts}@test.com`;
const MEMBER_EMAIL = `report_member_${ts}@test.com`;
const PASSWORD = 'password123';

let adminToken: string;
let memberToken: string;
let workspaceId: string;
let projectId: string;

describe('Reports API (FR-11)', () => {
  beforeAll(async () => {
    // 1. Setup Users
    const adminRes = await request(app).post('/api/auth/register').send({ email: ADMIN_EMAIL, password: PASSWORD, name: 'Report Admin' });
    adminToken = adminRes.body.data.token;

    const memRes = await request(app).post('/api/auth/register').send({ email: MEMBER_EMAIL, password: PASSWORD, name: 'Report Member' });
    memberToken = memRes.body.data.token;

    // 2. Setup Workspace
    const wsRes = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Report Test WS' });
    workspaceId = wsRes.body.data.workspace.id;

    // Add member
    const memId = (await prisma.user.findUnique({ where: { email: MEMBER_EMAIL } }))!.id;
    await prisma.workspaceMember.create({ data: { workspaceId, userId: memId, role: 'Member' } });

    // 3. Setup Project
    const projRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-workspace-id', workspaceId)
      .send({ name: 'Report Proj', color: '#123456' });
    projectId = projRes.body.data.project.id;

    // 4. Create some tasks
    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-workspace-id', workspaceId)
      .send({ title: 'Task 1', project_id: projectId });

    const task2Res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-workspace-id', workspaceId)
      .send({ title: 'Task 2', project_id: projectId, assignee_id: memId });

    // Mark task 2 as Done
    await request(app)
      .patch(`/api/tasks/${task2Res.body.data.task.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-workspace-id', workspaceId)
      .send({ status: 'Done' });
  });

  afterAll(async () => {
    try {
      const users = await prisma.user.findMany({ where: { email: { contains: 'report_' } } });
      const ids = users.map(u => u.id);
      await prisma.activityLog.deleteMany({ where: { task: { workspaceId } } });
      await prisma.notification.deleteMany({ where: { userId: { in: ids } } });
      await prisma.task.deleteMany({ where: { workspaceId } });
      await prisma.workspace.deleteMany({ where: { createdBy: { in: ids } } });
      await prisma.user.deleteMany({ where: { id: { in: ids } } });
    } catch {}
  });

  it('1. GET /api/reports/workspace — Admin can access — 200', async () => {
    const res = await request(app)
      .get('/api/reports/workspace')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-workspace-id', workspaceId);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    
    expect(res.body.data.weeklyStats).toBeTruthy();
    expect(res.body.data.weeklyStats.length).toBe(4);
    
    expect(res.body.data.memberStats).toBeTruthy();
    expect(res.body.data.memberStats.length).toBe(2); // Admin and Member
    
    const memberStat = res.body.data.memberStats.find((m: any) => m.name === 'Report Member');
    expect(memberStat.assigned).toBe(1);
    expect(memberStat.completed).toBe(1);
    expect(memberStat.completionRate).toBe(100);
  });

  it('2. GET /api/reports/workspace — Member CANNOT access — 403', async () => {
    const res = await request(app)
      .get('/api/reports/workspace')
      .set('Authorization', `Bearer ${memberToken}`)
      .set('x-workspace-id', workspaceId);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
