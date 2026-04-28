import crypto from 'crypto';

/**
 * Generates a cryptographically secure unique invite token.
 */
export function generateInviteToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Returns true if the given expiresAt timestamp is in the past.
 */
export function isTokenExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}

/**
 * Computes the expiry date for a new invite token (48 hours from now).
 */
export function getInviteExpiry(): Date {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 48);
  return expiry;
}
