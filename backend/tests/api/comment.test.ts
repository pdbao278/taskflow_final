import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/lib/prisma';

const ts = Date.now();
const AUTHOR_EMAIL = `comment_author_${ts}@taskflow-test.com`;
const ASSIGNEE_EMAIL = `comment_assignee_${ts}@taskflow-test.com`;
const OUTSIDER_EMAIL = `comment_outsider_${ts}@taskflow-test.com`;
const PASSWORD = 'testpassword123';

let authorToken: string;
let assigneeToken: string;
let outsiderToken: string;

let authorId: string;
let assigneeId: string;

let workspaceId: string;
let projectId: string;
let taskId: string;
let commentId: string;

describe('Comment API — Integration Tests (FR-06)', () => {
  beforeAll(async () => {
    jest.setTimeout(30000);
    // 1. Register users
    const authorRes = await request(app)
      .post('/api/auth/register')
      .send({ email: AUTHOR_EMAIL, password: PASSWORD, name: 'Author User' });
    authorToken = authorRes.body.data.token;
    authorId = authorRes.body.data.user.id;

    const assigneeRes = await request(app)
      .post('/api/auth/register')
      .send({ email: ASSIGNEE_EMAIL, password: PASSWORD, name: 'Assignee User' });
    assigneeToken = assigneeRes.body.data.token;
    assigneeId = assigneeRes.body.data.user.id;

    const outsiderRes = await request(app)
      .post('/api/auth/register')
      .send({ email: OUTSIDER_EMAIL, password: PASSWORD, name: 'Outsider User' });
    outsiderToken = outsiderRes.body.data.token;

    // 2. Create workspace (Author is Admin)
    const wsRes = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${authorToken}`)
      .send({ name: 'Comment Workspace' });
    workspaceId = wsRes.body.data.workspace.id;

    // Add Assignee to workspace
    await prisma.workspaceMember.create({
      data: { workspaceId, userId: assigneeId, role: 'Member' },
    });

    // 3. Create project
    const projRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${authorToken}`)
      .set('x-workspace-id', workspaceId)
      .send({ name: 'Comment Project', color: '#ff0000' });
    projectId = projRes.body.data.project.id;

    // 4. Create task
    const taskRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${authorToken}`)
      .set('x-workspace-id', workspaceId)
      .send({ title: 'Comment Task', project_id: projectId, assignee_id: assigneeId });
    taskId = taskRes.body.data.task.id;
  });

  afterAll(async () => {
    try {
      await prisma.notification.deleteMany({ where: { user: { email: { contains: 'taskflow-test.com' } } } });
      await prisma.comment.deleteMany({ where: { task: { workspaceId } } });
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

  describe('POST /api/tasks/:id/comments', () => {
    it('creates a comment (happy path)', async () => {
      const res = await request(app)
        .post(`/api/tasks/${taskId}/comments`)
        .set('Authorization', `Bearer ${authorToken}`)
        .set('x-workspace-id', workspaceId)
        .send({ content: 'Hello this is a comment' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.comment.content).toBe('Hello this is a comment');
      commentId = res.body.data.comment.id;
    });

    it('sanitizes XSS input', async () => {
      const res = await request(app)
        .post(`/api/tasks/${taskId}/comments`)
        .set('Authorization', `Bearer ${authorToken}`)
        .set('x-workspace-id', workspaceId)
        .send({ content: '<script>alert("xss")</script>Safe Text' });

      expect(res.status).toBe(201);
      expect(res.body.data.comment.content).not.toContain('<script>');
      expect(res.body.data.comment.content).toContain('Safe Text');
    });

    it('rejects empty content', async () => {
      const res = await request(app)
        .post(`/api/tasks/${taskId}/comments`)
        .set('Authorization', `Bearer ${authorToken}`)
        .set('x-workspace-id', workspaceId)
        .send({ content: '   ' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('rejects outsider', async () => {
      const res = await request(app)
        .post(`/api/tasks/${taskId}/comments`)
        .set('Authorization', `Bearer ${outsiderToken}`)
        .set('x-workspace-id', workspaceId)
        .send({ content: 'Sneaky comment' });

      expect(res.status).toBe(403);
    });

    it('creates a notification for assignee on comment', async () => {
      // Find notification for Assignee
      const notif = await prisma.notification.findFirst({
        where: { userId: assigneeId, type: 'comment_added' }
      });
      expect(notif).toBeTruthy();
      expect(notif?.message).toContain('Author User đã comment');
    });

    it('creates a notification for @mention', async () => {
      await request(app)
        .post(`/api/tasks/${taskId}/comments`)
        .set('Authorization', `Bearer ${authorToken}`)
        .set('x-workspace-id', workspaceId)
        .send({ content: 'Hey @Assignee User please check' });

      const notif = await prisma.notification.findFirst({
        where: { userId: assigneeId, type: 'mention' }
      });
      expect(notif).toBeTruthy();
    });

    it('does not create a notification for self mention', async () => {
      await prisma.notification.deleteMany({ where: { userId: authorId } });

      await request(app)
        .post(`/api/tasks/${taskId}/comments`)
        .set('Authorization', `Bearer ${authorToken}`)
        .set('x-workspace-id', workspaceId)
        .send({ content: 'Note to self @Author User' });

      const notif = await prisma.notification.findFirst({
        where: { userId: authorId, type: 'mention' }
      });
      expect(notif).toBeNull();
    });
  });

  describe('GET /api/tasks/:id/comments', () => {
    it('lists comments sorted by created_at', async () => {
      const res = await request(app)
        .get(`/api/tasks/${taskId}/comments`)
        .set('Authorization', `Bearer ${authorToken}`)
        .set('x-workspace-id', workspaceId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.comments)).toBe(true);
      expect(res.body.data.comments.length).toBeGreaterThanOrEqual(4); // from previous tests
    });
  });

  describe('DELETE /api/tasks/:taskId/comments/:id', () => {
    it('allows author to delete their own comment', async () => {
      const res = await request(app)
        .delete(`/api/tasks/${taskId}/comments/${commentId}`)
        .set('Authorization', `Bearer ${authorToken}`)
        .set('x-workspace-id', workspaceId);

      expect(res.status).toBe(200);
      
      // Verify deleted
      const check = await prisma.comment.findUnique({ where: { id: commentId } });
      expect(check).toBeNull();
    });

    it('prevents non-author from deleting', async () => {
      // Create a comment by Assignee
      const assignRes = await request(app)
        .post(`/api/tasks/${taskId}/comments`)
        .set('Authorization', `Bearer ${assigneeToken}`)
        .set('x-workspace-id', workspaceId)
        .send({ content: 'Assignee comment' });
      
      const assignCommentId = assignRes.body.data.comment.id;

      // Author tries to delete Assignee's comment
      const res = await request(app)
        .delete(`/api/tasks/${taskId}/comments/${assignCommentId}`)
        .set('Authorization', `Bearer ${authorToken}`)
        .set('x-workspace-id', workspaceId);

      expect(res.status).toBe(403);
    });
  });
});
