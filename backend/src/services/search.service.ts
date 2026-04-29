import { prisma } from '../lib/prisma';

export async function searchTasks(workspaceId: string, keyword: string, limit: number = 10) {
  // Use Prisma's contains with insensitive mode for title search
  const tasks = await prisma.task.findMany({
    where: {
      workspaceId,
      deletedAt: null,
      title: {
        contains: keyword,
        mode: 'insensitive',
      },
    },
    include: {
      project: { select: { id: true, name: true, color: true } },
      assignee: { select: { id: true, name: true } },
    },
    take: limit,
    orderBy: { createdAt: 'desc' },
  });

  return tasks;
}
