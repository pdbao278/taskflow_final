import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/lib/prisma';

const ts = Date.now();
const USER_EMAIL = `notify_user_${ts}@taskflow-test.com`;
const OUTSIDER_EMAIL = `notify_outsider_${ts}@taskflow-test.com`;
const PASSWORD = 'testpassword123';

let userToken: string;
let outsiderToken: string;

let userId: string;
let workspaceId: string;
let notification1Id: string;
let notification2Id: string;

describe('Notification API — Integration Tests (FR-09)', () => {
  beforeAll(async () => {
    // 1. Register users
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({ email: USER_EMAIL, password: PASSWORD, name: 'Notify User' });
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
      .send({ name: 'Notify Workspace' });
    workspaceId = wsRes.body.data.workspace.id;

    // 3. Create dummy notifications
    const n1 = await prisma.notification.create({
      data: {
        userId,
        type: 'test_type_1',
        message: 'First test notification',
      }
    });
    notification1Id = n1.id;

    const n2 = await prisma.notification.create({
      data: {
        userId,
        type: 'test_type_2',
        message: 'Second test notification',
      }
    });
    notification2Id = n2.id;
  });

  afterAll(async () => {
    try {
      await prisma.notification.deleteMany({ where: { user: { email: { contains: 'taskflow-test.com' } } } });
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

  describe('GET /api/notifications', () => {
    it('returns notifications sorted by newest first', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-workspace-id', workspaceId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      
      const notifications = res.body.data.notifications;
      expect(Array.isArray(notifications)).toBe(true);
      expect(notifications.length).toBeGreaterThanOrEqual(2);
      
      // n2 should be before n1 because it was created later
      const n2Index = notifications.findIndex((n: any) => n.id === notification2Id);
      const n1Index = notifications.findIndex((n: any) => n.id === notification1Id);
      expect(n2Index).toBeLessThan(n1Index);
    });

    it('returns 403 for outsider', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${outsiderToken}`)
        .set('x-workspace-id', workspaceId);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/notifications/unread-count', () => {
    it('returns correct unread count', async () => {
      const res = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-workspace-id', workspaceId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.unreadCount).toBeGreaterThanOrEqual(2);
    });
  });

  describe('PATCH /api/notifications/:id/read', () => {
    it('toggles read/unread status (unread -> read)', async () => {
      const res = await request(app)
        .patch(`/api/notifications/${notification1Id}/read`)
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-workspace-id', workspaceId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.notification.readAt).not.toBeNull();
    });

    it('toggles read/unread status (read -> unread)', async () => {
      const res = await request(app)
        .patch(`/api/notifications/${notification1Id}/read`)
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-workspace-id', workspaceId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.notification.readAt).toBeNull();
    });
  });

  describe('PATCH /api/notifications/read-all', () => {
    it('marks all unread notifications as read', async () => {
      const res = await request(app)
        .patch('/api/notifications/read-all')
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-workspace-id', workspaceId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify unread count is 0
      const countRes = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${userToken}`)
        .set('x-workspace-id', workspaceId);

      expect(countRes.body.data.unreadCount).toBe(0);
    });
  });
});
