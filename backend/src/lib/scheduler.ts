import { prisma } from './prisma';
import { createNotification } from '../services/notification.service';

/**
 * Due-soon scheduler: checks every hour for tasks due within 24 hours.
 * Creates a notification for the task's assignee (if any) — once per task per day.
 */
async function checkDueSoon(): Promise<void> {
  try {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Find tasks due within next 24 hours, not yet Done, not deleted, with an assignee
    const tasks = await prisma.task.findMany({
      where: {
        deletedAt: null,
        status: { not: 'Done' },
        assigneeId: { not: null },
        dueDate: {
          gte: now,
          lte: in24h,
        },
      },
      select: {
        id: true,
        title: true,
        assigneeId: true,
        dueDate: true,
      },
    });

    if (tasks.length === 0) return;

    // For each task, check if we already sent a due_soon notification today
    for (const task of tasks) {
      if (!task.assigneeId || !task.dueDate) continue;

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const existingNotif = await prisma.notification.findFirst({
        where: {
          userId: task.assigneeId,
          type: 'due_soon',
          referenceId: task.id,
          createdAt: { gte: todayStart },
        },
      });

      // Skip if already notified today
      if (existingNotif) continue;

      const dueDateStr = task.dueDate.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });

      await createNotification({
        userId: task.assigneeId,
        type: 'due_soon',
        message: `Task "${task.title}" sắp đến hạn vào ${dueDateStr}`,
        referenceId: task.id,
      });
    }

    if (tasks.length > 0) {
      console.log(`[Scheduler] Due-soon check: processed ${tasks.length} tasks`);
    }
  } catch (err) {
    console.error('[Scheduler] Due-soon check error:', err);
  }
}

/**
 * Start the due-soon scheduler.
 * Runs immediately on startup, then every hour.
 */
export function startScheduler(): void {
  // Run once immediately on server startup
  checkDueSoon();

  // Then every hour (3600 * 1000 ms)
  const INTERVAL_MS = 60 * 60 * 1000;
  setInterval(checkDueSoon, INTERVAL_MS);

  console.log('⏰ Due-soon scheduler started (runs every 1 hour)');
}
