import { sanitizeInput, isOverdue } from '../../src/services/task.service';
import { createTaskSchema, updateTaskSchema } from '../../src/schemas/task.schema';

describe('Task Service — Unit Tests (FR-04)', () => {
  // ── 1. sanitizeInput() strips HTML tags ─────────────────────────────────────
  describe('sanitizeInput()', () => {
    it('strips <script> tags and returns plain text', () => {
      const input = '<script>alert("xss")</script>Hello World';
      const result = sanitizeInput(input);
      expect(result).not.toContain('<script>');
      expect(result).toContain('Hello World');
    });

    it('strips <img onerror> XSS attack', () => {
      const input = '<img src=x onerror=alert(1)>Normal text';
      const result = sanitizeInput(input);
      expect(result).not.toContain('<img');
      expect(result).toContain('Normal text');
    });

    it('returns same text when no HTML tags', () => {
      const input = 'Clean text without tags';
      expect(sanitizeInput(input)).toBe(input);
    });
  });

  // ── 2. isOverdue() check ────────────────────────────────────────────────────
  describe('isOverdue()', () => {
    it('returns true for past date', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      expect(isOverdue(yesterday)).toBe(true);
    });

    it('returns false for future date', () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      expect(isOverdue(tomorrow)).toBe(false);
    });

    it('returns false for null date', () => {
      expect(isOverdue(null)).toBe(false);
    });

    it('works with string date', () => {
      const pastStr = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
      expect(isOverdue(pastStr)).toBe(true);
    });
  });

  // ── 3. validateTaskInput() Zod schema ───────────────────────────────────────
  describe('Zod Task Schema', () => {
    it('createTaskSchema accepts valid input', () => {
      const result = createTaskSchema.safeParse({
        title: 'Valid Task',
        project_id: '550e8400-e29b-41d4-a716-446655440000',
        priority: 'High',
      });
      expect(result.success).toBe(true);
    });

    it('createTaskSchema rejects empty title', () => {
      const result = createTaskSchema.safeParse({
        title: '',
        project_id: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(result.success).toBe(false);
    });

    it('createTaskSchema rejects title > 200 chars', () => {
      const result = createTaskSchema.safeParse({
        title: 'A'.repeat(201),
        project_id: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(result.success).toBe(false);
    });

    it('createTaskSchema rejects description > 5000 chars', () => {
      const result = createTaskSchema.safeParse({
        title: 'Valid',
        project_id: '550e8400-e29b-41d4-a716-446655440000',
        description: 'X'.repeat(5001),
      });
      expect(result.success).toBe(false);
    });

    it('createTaskSchema requires project_id', () => {
      const result = createTaskSchema.safeParse({
        title: 'No Project',
      });
      expect(result.success).toBe(false);
    });

    it('createTaskSchema rejects invalid priority', () => {
      const result = createTaskSchema.safeParse({
        title: 'Task',
        project_id: '550e8400-e29b-41d4-a716-446655440000',
        priority: 'SuperHigh',
      });
      expect(result.success).toBe(false);
    });

    it('updateTaskSchema accepts partial update', () => {
      const result = updateTaskSchema.safeParse({
        title: 'Updated Title',
      });
      expect(result.success).toBe(true);
    });

    it('updateTaskSchema rejects title > 200', () => {
      const result = updateTaskSchema.safeParse({
        title: 'B'.repeat(201),
      });
      expect(result.success).toBe(false);
    });
  });

  // ── 4. softDelete → tested in API tests (needs DB) ─────────────────────────
  // softDelete() is tested via API tests (test #10) as it requires database access.

  // ── 5. createActivityLog → tested in API tests (needs DB) ──────────────────
  // createActivityLog() is tested via API tests (test #9) as it requires database access.
});
