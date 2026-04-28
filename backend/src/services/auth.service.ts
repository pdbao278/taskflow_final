import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const BCRYPT_COST = parseInt(process.env.BCRYPT_COST || '12', 10);
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';

// ─── In-memory login attempt tracker ───────────────────────────────────────
interface AttemptRecord {
  count: number;
  lockedUntil: number | null;
}
const loginAttempts = new Map<string, AttemptRecord>();

const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export function getLoginAttempt(email: string): AttemptRecord {
  return loginAttempts.get(email) ?? { count: 0, lockedUntil: null };
}

export function incrementLoginAttempt(email: string): AttemptRecord {
  const record = getLoginAttempt(email);
  const now = Date.now();

  // If currently locked but lock expired, reset
  if (record.lockedUntil && now >= record.lockedUntil) {
    const fresh: AttemptRecord = { count: 1, lockedUntil: null };
    loginAttempts.set(email, fresh);
    return fresh;
  }

  const newCount = record.count + 1;
  const lockedUntil = newCount >= MAX_ATTEMPTS ? now + LOCK_DURATION_MS : record.lockedUntil;
  const updated: AttemptRecord = { count: newCount, lockedUntil };
  loginAttempts.set(email, updated);
  return updated;
}

export function resetLoginAttempt(email: string): void {
  loginAttempts.delete(email);
}

export function isLocked(email: string): { locked: boolean; remainingMs: number } {
  const record = getLoginAttempt(email);
  const now = Date.now();
  if (record.lockedUntil && now < record.lockedUntil) {
    return { locked: true, remainingMs: record.lockedUntil - now };
  }
  return { locked: false, remainingMs: 0 };
}

// ─── Password helpers ────────────────────────────────────────────────────────
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ─── JWT helpers ─────────────────────────────────────────────────────────────
export interface JwtPayload {
  userId: string;
  email: string;
}

export function generateJWT(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY as jwt.SignOptions['expiresIn'] });
}

export function verifyJWT(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}
