import { prisma } from '../lib/prisma';

/**
 * Count how many workspaces a user belongs to (as any role).
 */
export async function getWorkspaceCount(userId: string): Promise<number> {
  return prisma.workspaceMember.count({ where: { userId } });
}

/**
 * Returns false if the user only has 1 workspace — deletion should be blocked.
 */
export async function canDeleteWorkspace(userId: string): Promise<boolean> {
  const count = await getWorkspaceCount(userId);
  return count > 1;
}

/**
 * Validates that a workspace name is not empty and is within length limit.
 */
export function validateWorkspaceName(name: unknown): { valid: true; value: string } | { valid: false; error: string } {
  if (typeof name !== 'string' || name.trim().length === 0) {
    return { valid: false, error: 'Tên workspace không được để trống' };
  }
  if (name.trim().length > 100) {
    return { valid: false, error: 'Tên workspace tối đa 100 ký tự' };
  }
  return { valid: true, value: name.trim() };
}
