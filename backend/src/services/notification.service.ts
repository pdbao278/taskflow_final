import { prisma } from '../lib/prisma';

/**
 * Creates an in-app notification for a user.
 */
export async function createNotification(params: {
  userId: string;
  type: string;
  message: string;
  referenceId?: string | null;
}): Promise<void> {
  await prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      message: params.message,
      referenceId: params.referenceId ?? null,
    },
  });
}

/**
 * Sends notifications to all workspace members (optionally excluding certain users).
 */
export async function notifyWorkspaceMembers(params: {
  workspaceId: string;
  type: string;
  message: string;
  excludeUserIds?: string[];
  referenceId?: string | null;
}): Promise<void> {
  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId: params.workspaceId },
    select: { userId: true },
  });

  const excludeSet = new Set(params.excludeUserIds ?? []);
  const targets = members.filter((m) => !excludeSet.has(m.userId));

  if (targets.length === 0) return;

  await prisma.notification.createMany({
    data: targets.map((m) => ({
      userId: m.userId,
      type: params.type,
      message: params.message,
      referenceId: params.referenceId ?? null,
    })),
  });
}
