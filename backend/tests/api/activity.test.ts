import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/lib/prisma';

const ts = Date.now();
const USER_EMAIL = `activity_user_${ts}@taskflow-test.com`;
const OUTSIDER_EMAIL = `activity_outsider_${ts}@taskflow-test.com`;
const PASSWORD = 'testpassword123';

let userToken: string;
let outsiderToken: string;

let userId: string;
let workspaceId: string;
let projectId: string;
let taskId: string;

describe('Activity Log API — Integration Tests (FR-10)', () => {
  beforeAll(async () => {
    jest.setTimeout(30000);
    // 1. Register users
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({ email: USER_EMAIL, password: PASSWORD, name: 'Activity User' });
    userToken = userRes.body.data.token;
    userId = userRes.body.data.user.id;

    const outsiderRes = await request(app)
      .post('/api/auth/register')
      .send({ email: OUTSIDER_EMAIL, password: PASSWORD, name: 'Outsider User' });
    outsiderToken = outsiderRes.body.data.token;

    // 2. Create workspace
    const wsRes = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Activity Workspace' });
    workspaceId = wsRes.body.data.workspace.id;

    // 3. Create project
    const projRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${userToken}`)
      .set('x-workspace-id', workspaceId)
      .send({ name: 'Activity Project', color: '#00ff00' });
    projectId = projRes.body.data.project.id;

    // 4. Create task (this should generate a 'created' activity log)
    const taskRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${userToken}`)
      .set('x-workspace-id', workspaceId)
      .send({ title: 'Activity Task', project_id: projectId });
    taskId = taskRes.body.data.task.id;

    // 5. Update task (this should generate a 'field_edited' log)
    await request(app)
      .patch(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .set('x-workspace-id', workspaceId)
      .send({ title: 'Activity Task Updated' });

    // 6. Update task status (this should generate a 'status_changed' log)
    await request(app)
      .patch(`/api/tasks/${taskId}/status`)
      .set('Authorization', `Bearer ${userToken}`)
      .set('x-workspace-id', workspaceId)
      .send({ status: 'InProgress' });
  });

  afterAll(async () => {
    try {
      await prisma.activityLog.deleteMany({ where: { task: { workspaceId } } });
      await prisma.task.deleteMany({ where: { workspaceId } });
      await prisma.project.deleteMany({ where: { workspaceId } });
      
      const testUsers = await prisma.user.findMany({
        where: { email: { contains: 'taskflow-test.com' } },
        select: { id: true },
      });
      const userIds = testUsers.map(u => u.id);
      
      await prisma.workspaceMember.deleteMany({ where: { workspaceId } });
      await prisma.workspace.deleteMany({ where: { createdBy: { in: userIds } } });
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    } catch (e) {
      console.error(e);
    }
  });

  describe('GET /api/tasks/:id/activity', () => {
    it('returns activity logs sorted by newest first', async () => {
      const res = await request(app)
        .get(`/api/tasks/${taskId}/activity`)
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-workspace-id', workspaceId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      
      const activities = res.body.data.activities;
      expect(Array.isArray(activities)).toBe(true);
      expect(activities.length).toBeGreaterThanOrEqual(3);
      
      // Verify descending order by createdAt
      for (let i = 0; i < activities.length - 1; i++) {
        const time1 = new Date(activities[i].createdAt).getTime();
        const time2 = new Date(activities[i + 1].createdAt).getTime();
        expect(time1).toBeGreaterThanOrEqual(time2);
      }

      // Verify the latest action is status_changed or field_edited
      const latestAction = activities[0].actionType;
      expect(['status_changed', 'field_edited']).toContain(latestAction);
      
      // Verify the oldest action is 'created'
      const oldestAction = activities[activities.length - 1].actionType;
      expect(oldestAction).toBe('created');
    });

    it('returns 403 for outsider', async () => {
      const res = await request(app)
        .get(`/api/tasks/${taskId}/activity`)
        .set('Authorization', `Bearer ${outsiderToken}`)
        .set('x-workspace-id', workspaceId);

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/tasks/:id/activity (Verify absence of endpoint)', () => {
    it('returns 404/405 as there is no delete endpoint for activity logs', async () => {
      // Find an activity id
      const activitiesRes = await request(app)
        .get(`/api/tasks/${taskId}/activity`)
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-workspace-id', workspaceId);
      
      const activityId = activitiesRes.body.data.activities[0].id;

      const res = await request(app)
        .delete(`/api/tasks/${taskId}/activity/${activityId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-workspace-id', workspaceId);

      // Should be 404 because route does not exist
      expect(res.status).toBe(404);
    });
  });
});
