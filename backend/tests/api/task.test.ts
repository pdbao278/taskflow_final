import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/lib/prisma';

const ts = Date.now();
const ADMIN_EMAIL = `task_admin_${ts}@taskflow-test.com`;
const MANAGER_EMAIL = `task_mgr_${ts}@taskflow-test.com`;
const MEMBER_EMAIL = `task_member_${ts}@taskflow-test.com`;
const OUTSIDER_EMAIL = `task_outsider_${ts}@taskflow-test.com`;
const PASSWORD = 'testpassword123';

let adminToken: string;
let managerToken: string;
let memberToken: string;
let outsiderToken: string;
let workspaceId: string;
let projectId: string;
let archivedProjectId: string;
let taskId: string;
let adminUserId: string;
let memberUserId: string;

describe('Task API — Integration Tests (FR-04)', () => {
  beforeAll(async () => {
    // Register users
    const adminRes = await request(app)
      .post('/api/auth/register')
      .send({ email: ADMIN_EMAIL, password: PASSWORD, name: 'Task Admin' });
    adminToken = adminRes.body.data.token;

    const mgrRes = await request(app)
      .post('/api/auth/register')
      .send({ email: MANAGER_EMAIL, password: PASSWORD, name: 'Task Manager' });
    managerToken = mgrRes.body.data.token;

    const memRes = await request(app)
      .post('/api/auth/register')
      .send({ email: MEMBER_EMAIL, password: PASSWORD, name: 'Task Member' });
    memberToken = memRes.body.data.token;

    const outRes = await request(app)
      .post('/api/auth/register')
      .send({ email: OUTSIDER_EMAIL, password: PASSWORD, name: 'Outsider' });
    outsiderToken = outRes.body.data.token;

    // Get user IDs
    adminUserId = (await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } }))!.id;
    memberUserId = (await prisma.user.findUnique({ where: { email: MEMBER_EMAIL } }))!.id;
    const mgrUserId = (await prisma.user.findUnique({ where: { email: MANAGER_EMAIL } }))!.id;

    // Create workspace
    const wsRes = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Task Test WS' });
    workspaceId = wsRes.body.data.workspace.id;

    // Add members
    await prisma.workspaceMember.create({
      data: { workspaceId, userId: mgrUserId, role: 'Manager' },
    });
    await prisma.workspaceMember.create({
      data: { workspaceId, userId: memberUserId, role: 'Member' },
    });

    // Create active project
    const projRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-workspace-id', workspaceId)
      .send({ name: 'Active Project', description: 'For task tests', color: '#3B82F6' });
    projectId = projRes.body.data.project.id;

    // Create archived project
    const archRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-workspace-id', workspaceId)
      .send({ name: 'Archived Project', description: '', color: '#EF4444' });
    archivedProjectId = archRes.body.data.project.id;

    await request(app)
      .patch(`/api/projects/${archivedProjectId}/archive`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-workspace-id', workspaceId);
  });

  afterAll(async () => {
    try {
      const testUsers = await prisma.user.findMany({
        where: { email: { contains: 'taskflow-test.com' } },
        select: { id: true },
      });
      const userIds = testUsers.map(u => u.id);
      await prisma.activityLog.deleteMany({ where: { task: { workspaceId } } });
      await prisma.notification.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.task.deleteMany({ where: { workspaceId } });
      await prisma.workspace.deleteMany({ where: { createdBy: { in: userIds } } });
      await prisma.user.deleteMany({ where: { email: { contains: 'taskflow-test.com' } } });
    } catch {}
  });

  // ── 1. POST /api/tasks — happy path ─────────────────────────────────────────
  it('1. POST /api/tasks — happy path — 201', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-workspace-id', workspaceId)
      .send({
        title: 'First Task',
        project_id: projectId,
        description: 'Test description',
        priority: 'High',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.task.title).toBe('First Task');
    expect(res.body.data.task.status).toBe('ToDo');
    expect(res.body.data.task.priority).toBe('High');
    expect(res.body.data.task.project.name).toBe('Active Project');
    taskId = res.body.data.task.id;
  });

  // ── 2. POST /api/tasks — no title — 400 ────────────────────────────────────
  it('2. POST /api/tasks — no title — 400', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-workspace-id', workspaceId)
      .send({ title: '', project_id: projectId });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // ── 3. POST /api/tasks — title > 200 chars — 400 ───────────────────────────
  it('3. POST /api/tasks — title > 200 chars — 400', async () => {
    const longTitle = 'A'.repeat(201);
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-workspace-id', workspaceId)
      .send({ title: longTitle, project_id: projectId });

    expect(res.status).toBe(400);
  });

  // ── 4. POST /api/tasks — XSS title — 201, sanitized ────────────────────────
  it('4. POST /api/tasks — XSS title — 201, sanitized plain text', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-workspace-id', workspaceId)
      .send({ title: '<script>alert("xss")</script>Test', project_id: projectId });

    expect(res.status).toBe(201);
    expect(res.body.data.task.title).not.toContain('<script>');
    expect(res.body.data.task.title).toContain('Test');
  });

  // ── 5. POST /api/tasks — past due date — 201, isOverdue=true ───────────────
  it('5. POST /api/tasks — past due date — 201, isOverdue=true', async () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-workspace-id', workspaceId)
      .send({ title: 'Overdue Task', project_id: projectId, due_date: yesterday });

    expect(res.status).toBe(201);
    expect(res.body.data.task.isOverdue).toBe(true);
  });

  // ── 6. POST /api/tasks — invalid assignee — 400 ────────────────────────────
  it('6. POST /api/tasks — invalid assignee (not in workspace) — 400', async () => {
    const outsiderUser = await prisma.user.findUnique({ where: { email: OUTSIDER_EMAIL } });
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-workspace-id', workspaceId)
      .send({ title: 'Bad Assignee', project_id: projectId, assignee_id: outsiderUser!.id });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('workspace');
  });

  // ── 7. PATCH /api/tasks/:id — invalid assignee — 400 ───────────────────────
  it('7. PATCH /api/tasks/:id — invalid assignee — 400', async () => {
    const outsiderUser = await prisma.user.findUnique({ where: { email: OUTSIDER_EMAIL } });
    const res = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-workspace-id', workspaceId)
      .send({ assignee_id: outsiderUser!.id });

    expect(res.status).toBe(400);
  });

  // ── 8. GET /api/tasks/:id — 200, full detail ───────────────────────────────
  it('8. GET /api/tasks/:id — 200, full task detail', async () => {
    const res = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-workspace-id', workspaceId);

    expect(res.status).toBe(200);
    expect(res.body.data.task.id).toBe(taskId);
    expect(res.body.data.task.title).toBe('First Task');
    expect(res.body.data.task.project).toBeTruthy();
    expect(res.body.data.task.creator).toBeTruthy();
  });

  // ── 9. PATCH /api/tasks/:id — update — 200, activity log ──────────────────
  it('9. PATCH /api/tasks/:id — update title — 200, activity log created', async () => {
    const res = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-workspace-id', workspaceId)
      .send({ title: 'Updated First Task' });

    expect(res.status).toBe(200);
    expect(res.body.data.task.title).toBe('Updated First Task');

    // Verify activity log was created
    const logs = await prisma.activityLog.findMany({
      where: { taskId, actionType: 'field_edited' },
    });
    expect(logs.length).toBeGreaterThanOrEqual(1);
    const editLog = logs.find(l => l.fieldChanged === 'title');
    expect(editLog).toBeTruthy();
    expect(editLog!.oldValue).toBe('First Task');
    expect(editLog!.newValue).toBe('Updated First Task');
  });

  // ── 10. DELETE /api/tasks/:id — soft delete — 200 ──────────────────────────
  it('10. DELETE /api/tasks/:id — soft delete — 200, deleted_at set', async () => {
    // Create a task to delete
    const createRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-workspace-id', workspaceId)
      .send({ title: 'To Be Deleted', project_id: projectId });
    const deleteTaskId = createRes.body.data.task.id;

    const res = await request(app)
      .delete(`/api/tasks/${deleteTaskId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-workspace-id', workspaceId);

    expect(res.status).toBe(200);

    // Verify soft delete
    const task = await prisma.task.findUnique({ where: { id: deleteTaskId } });
    expect(task!.deletedAt).not.toBeNull();
  });

  // ── 11. GET /api/projects/:id/tasks — 200, project tasks ──────────────────
  it('11. GET /api/projects/:id/tasks — 200, lists project tasks', async () => {
    const res = await request(app)
      .get(`/api/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-workspace-id', workspaceId);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.tasks)).toBe(true);
    // Should contain the task we created but not the deleted one
    const titles = res.body.data.tasks.map((t: any) => t.title);
    expect(titles).toContain('Updated First Task');
    expect(titles).not.toContain('To Be Deleted');
  });

  // ── 12. GET /api/tasks/trash — Admin — 200 ────────────────────────────────
  it('12. GET /api/tasks/trash — Admin — 200, lists soft-deleted tasks', async () => {
    const res = await request(app)
      .get('/api/tasks/trash')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-workspace-id', workspaceId);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.tasks)).toBe(true);
    const titles = res.body.data.tasks.map((t: any) => t.title);
    expect(titles).toContain('To Be Deleted');
  });

  // ── 13. GET /api/tasks/trash — non-Admin — 403 ─────────────────────────────
  it('13. GET /api/tasks/trash — Manager — 403', async () => {
    const res = await request(app)
      .get('/api/tasks/trash')
      .set('Authorization', `Bearer ${managerToken}`)
      .set('x-workspace-id', workspaceId);

    expect(res.status).toBe(403);
  });

  // ── 14. GET /api/tasks/trash — task > 30 days not shown ────────────────────
  it('14. GET /api/tasks/trash — task > 30 days does NOT appear', async () => {
    // Create a task and set deletedAt > 30 days ago
    const oldTask = await prisma.task.create({
      data: {
        workspaceId,
        projectId,
        title: 'Very Old Deleted Task',
        status: 'ToDo',
        priority: 'Medium',
        createdBy: adminUserId,
        deletedAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000),
      },
    });

    const res = await request(app)
      .get('/api/tasks/trash')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-workspace-id', workspaceId);

    expect(res.status).toBe(200);
    const ids = res.body.data.tasks.map((t: any) => t.id);
    expect(ids).not.toContain(oldTask.id);

    // Cleanup
    await prisma.task.delete({ where: { id: oldTask.id } });
  });

  // ── 15. POST /api/tasks/:id/restore — happy path — 200 ────────────────────
  it('15. POST /api/tasks/:id/restore — happy path — 200', async () => {
    // Create and soft-delete a task
    const createRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-workspace-id', workspaceId)
      .send({ title: 'Restore Me', project_id: projectId });
    const restoreTaskId = createRes.body.data.task.id;

    await request(app)
      .delete(`/api/tasks/${restoreTaskId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-workspace-id', workspaceId);

    // Restore
    const res = await request(app)
      .post(`/api/tasks/${restoreTaskId}/restore`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-workspace-id', workspaceId);

    expect(res.status).toBe(200);
    expect(res.body.data.task.deletedAt).toBeNull();

    // Activity log check
    const logs = await prisma.activityLog.findMany({
      where: { taskId: restoreTaskId, actionType: 'restored' },
    });
    expect(logs.length).toBe(1);
  });

  // ── 16. POST /api/tasks/:id/restore — expired (> 30 days) — 410 ───────────
  it('16. POST /api/tasks/:id/restore — task > 30 days — 410 Gone', async () => {
    const expiredTask = await prisma.task.create({
      data: {
        workspaceId,
        projectId,
        title: 'Expired Restore',
        status: 'ToDo',
        priority: 'Medium',
        createdBy: adminUserId,
        deletedAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000),
      },
    });

    const res = await request(app)
      .post(`/api/tasks/${expiredTask.id}/restore`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-workspace-id', workspaceId);

    expect(res.status).toBe(410);

    // Cleanup
    await prisma.task.delete({ where: { id: expiredTask.id } });
  });

  // ── 17. POST /api/tasks/:id/restore — archived project — 400 ──────────────
  it('17. POST /api/tasks/:id/restore — archived project — 400', async () => {
    // Create task in archived project, then soft delete
    const archTask = await prisma.task.create({
      data: {
        workspaceId,
        projectId: archivedProjectId,
        title: 'Archived Project Task',
        status: 'ToDo',
        priority: 'Medium',
        createdBy: adminUserId,
        deletedAt: new Date(),
      },
    });

    const res = await request(app)
      .post(`/api/tasks/${archTask.id}/restore`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-workspace-id', workspaceId);

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('archive');

    // Cleanup
    await prisma.task.delete({ where: { id: archTask.id } });
  });

  // ── 18. POST /api/tasks/:id/restore — assignee kicked — 200, assignee=null ─
  it('18. POST /api/tasks/:id/restore — assignee kicked — 200, assignee=null', async () => {
    // Create a temp user that will be removed from workspace
    const kickRes = await request(app)
      .post('/api/auth/register')
      .send({ email: `kick_${ts}@taskflow-test.com`, password: PASSWORD, name: 'Kicked User' });
    const kickedUser = await prisma.user.findUnique({ where: { email: `kick_${ts}@taskflow-test.com` } });

    // Add to workspace temporarily
    await prisma.workspaceMember.create({
      data: { workspaceId, userId: kickedUser!.id, role: 'Member' },
    });

    // Create task assigned to this user
    const taskRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-workspace-id', workspaceId)
      .send({ title: 'Kick Assignee Task', project_id: projectId, assignee_id: kickedUser!.id });
    const kickTaskId = taskRes.body.data.task.id;

    // Soft delete task
    await request(app)
      .delete(`/api/tasks/${kickTaskId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-workspace-id', workspaceId);

    // Remove user from workspace
    const memberRecord = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: kickedUser!.id },
    });
    if (memberRecord) {
      await prisma.workspaceMember.delete({ where: { id: memberRecord.id } });
    }

    // Restore — assignee should be null
    const res = await request(app)
      .post(`/api/tasks/${kickTaskId}/restore`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-workspace-id', workspaceId);

    expect(res.status).toBe(200);
    expect(res.body.data.task.assigneeId).toBeNull();
  });

  // ── 19. POST /api/tasks/:id/restore — double restore — 400 ────────────────
  it('19. POST /api/tasks/:id/restore — double restore — 400', async () => {
    // Create, delete, restore
    const createRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-workspace-id', workspaceId)
      .send({ title: 'Double Restore', project_id: projectId });
    const drTaskId = createRes.body.data.task.id;

    await request(app)
      .delete(`/api/tasks/${drTaskId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-workspace-id', workspaceId);

    // First restore
    await request(app)
      .post(`/api/tasks/${drTaskId}/restore`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-workspace-id', workspaceId);

    // Second restore should fail
    const res = await request(app)
      .post(`/api/tasks/${drTaskId}/restore`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-workspace-id', workspaceId);

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('thùng rác');
  });
});
