import { prisma } from '../lib/prisma';

/**
 * Check if a task can be created in the given project.
 * Returns false if the project is archived.
 */
export async function canCreateTask(projectId: string): Promise<boolean> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { archivedAt: true },
  });
  if (!project) return false;
  return project.archivedAt === null;
}

/**
 * Get task count for a project: { total, done }
 */
export async function getTaskCount(projectId: string): Promise<{ total: number; done: number }> {
  const [total, done] = await Promise.all([
    prisma.task.count({
      where: { projectId, deletedAt: null },
    }),
    prisma.task.count({
      where: { projectId, deletedAt: null, status: 'Done' },
    }),
  ]);
  return { total, done };
}

/**
 * Get task counts for multiple projects at once.
 */
export async function getTaskCountsForProjects(
  projectIds: string[]
): Promise<Record<string, { total: number; done: number }>> {
  if (projectIds.length === 0) return {};

  // Get total counts grouped by project
  const totalCounts = await prisma.task.groupBy({
    by: ['projectId'],
    where: { projectId: { in: projectIds }, deletedAt: null },
    _count: true,
  });

  // Get done counts grouped by project
  const doneCounts = await prisma.task.groupBy({
    by: ['projectId'],
    where: { projectId: { in: projectIds }, deletedAt: null, status: 'Done' },
    _count: true,
  });

  const result: Record<string, { total: number; done: number }> = {};
  for (const id of projectIds) {
    result[id] = { total: 0, done: 0 };
  }
  for (const tc of totalCounts) {
    result[tc.projectId] = { ...result[tc.projectId], total: tc._count };
  }
  for (const dc of doneCounts) {
    result[dc.projectId] = { ...result[dc.projectId], done: dc._count };
  }

  return result;
}
