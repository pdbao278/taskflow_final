import { generateInviteToken, isTokenExpired, getInviteExpiry } from '../../src/services/invite.service';
import { validateWorkspaceName } from '../../src/services/workspace.service';

describe('invite.service — Unit Tests', () => {
  describe('generateInviteToken()', () => {
    it('generates a non-empty string', () => {
      const token = generateInviteToken();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('generates unique tokens', () => {
      const t1 = generateInviteToken();
      const t2 = generateInviteToken();
      expect(t1).not.toBe(t2);
    });

    it('generates a 64-char hex string (32 bytes)', () => {
      const token = generateInviteToken();
      expect(token).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('isTokenExpired()', () => {
    it('returns true when date is in the past', () => {
      const past = new Date(Date.now() - 1000);
      expect(isTokenExpired(past)).toBe(true);
    });

    it('returns false when date is in the future', () => {
      const future = new Date(Date.now() + 60000);
      expect(isTokenExpired(future)).toBe(false);
    });

    it('returns true exactly at the 48h threshold (slightly past)', () => {
      const past48h = new Date(Date.now() - 48 * 60 * 60 * 1000 - 1);
      expect(isTokenExpired(past48h)).toBe(true);
    });
  });

  describe('getInviteExpiry()', () => {
    it('returns a date approximately 48 hours in the future', () => {
      const expiry = getInviteExpiry();
      const diffMs = expiry.getTime() - Date.now();
      const diffHours = diffMs / (1000 * 60 * 60);
      // Should be between 47.9 and 48.1 hours
      expect(diffHours).toBeGreaterThan(47.9);
      expect(diffHours).toBeLessThan(48.1);
    });
  });
});

describe('workspace.service — Unit Tests', () => {
  describe('validateWorkspaceName()', () => {
    it('accepts a valid name', () => {
      const result = validateWorkspaceName('My Workspace');
      expect(result.valid).toBe(true);
      if (result.valid) expect(result.value).toBe('My Workspace');
    });

    it('trims whitespace', () => {
      const result = validateWorkspaceName('  Trimmed  ');
      expect(result.valid).toBe(true);
      if (result.valid) expect(result.value).toBe('Trimmed');
    });

    it('rejects empty string', () => {
      const result = validateWorkspaceName('');
      expect(result.valid).toBe(false);
      if (!result.valid) expect(result.error).toContain('không được để trống');
    });

    it('rejects whitespace-only string', () => {
      const result = validateWorkspaceName('   ');
      expect(result.valid).toBe(false);
    });

    it('rejects name over 100 chars', () => {
      const longName = 'a'.repeat(101);
      const result = validateWorkspaceName(longName);
      expect(result.valid).toBe(false);
      if (!result.valid) expect(result.error).toContain('100 ký tự');
    });

    it('accepts exactly 100 chars', () => {
      const maxName = 'a'.repeat(100);
      const result = validateWorkspaceName(maxName);
      expect(result.valid).toBe(true);
    });
  });
});
