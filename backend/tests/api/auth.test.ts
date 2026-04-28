import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/lib/prisma';
import { resetLoginAttempt } from '../../src/services/auth.service';

const TEST_EMAIL = `test_${Date.now()}@taskflow-test.com`;
const TEST_PASSWORD = 'testpassword123';
const TEST_NAME = 'Test User';

let authToken: string;
let userId: string;

describe('Auth API — Integration Tests', () => {
  afterAll(async () => {
    // Cleanup test user
    try {
      await prisma.user.deleteMany({ where: { email: { contains: 'taskflow-test.com' } } });
    } catch {}
  });

  // ── Register ─────────────────────────────────────────────────────────────
  describe('POST /api/auth/register', () => {
    it('happy path — should register and return JWT', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD, name: TEST_NAME });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeTruthy();
      expect(res.body.data.user.email).toBe(TEST_EMAIL);
      expect(res.body.data.user.passwordHash).toBeUndefined();
      expect(res.body.data.user.password).toBeUndefined();

      authToken = res.body.data.token;
      userId = res.body.data.user.id;
    });

    it('duplicate email — should return 409', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD, name: TEST_NAME });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('đã được đăng ký');
    });

    it('invalid email — should return 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'notanemail', password: TEST_PASSWORD, name: TEST_NAME });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('bcrypt check — hash should start with $2b$12$', async () => {
      const user = await prisma.user.findUnique({ where: { email: TEST_EMAIL } });
      // bcryptjs uses $2a$ which is equivalent to $2b$ at cost factor 12
      expect(user?.passwordHash).toMatch(/^\$2[ab]\$12\$/);
    });
  });

  // ── Login ────────────────────────────────────────────────────────────────
  describe('POST /api/auth/login', () => {
    it('correct credentials — should return JWT', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeTruthy();
    });

    it('wrong password — should return 401', async () => {
      const email = `wrongpw_${Date.now()}@taskflow-test.com`;
      // First register
      await request(app).post('/api/auth/register').send({
        email, password: TEST_PASSWORD, name: TEST_NAME,
      });
      resetLoginAttempt(email);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email, password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('5 failed attempts — should lock (429)', async () => {
      const email = `locktest_${Date.now()}@taskflow-test.com`;
      await request(app).post('/api/auth/register').send({
        email, password: TEST_PASSWORD, name: TEST_NAME,
      });
      resetLoginAttempt(email);

      // 5 failed attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({ email, password: 'wrong' });
      }

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email, password: 'wrong' });

      expect(res.status).toBe(429);
      expect(res.body.remainingMs).toBeGreaterThan(0);
    });
  });

  // ── Logout ───────────────────────────────────────────────────────────────
  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ── Me ──────────────────────────────────────────────────────────────────
  describe('GET /api/auth/me', () => {
    it('should return current user without password', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(TEST_EMAIL);
      expect(res.body.data.user.passwordHash).toBeUndefined();
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('no token — should return 401', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('expired/invalid token — should return 401', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.here');
      expect(res.status).toBe(401);
    });
  });
});
