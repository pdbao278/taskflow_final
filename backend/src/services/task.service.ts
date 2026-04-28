import { prisma } from '../lib/prisma';
import xss from 'xss';

/**
 * Sanitize user input — strip all HTML tags.
 */
export function sanitizeInput(text: string): string {
  return xss(text, { whiteList: {}, stripIgnoreTag: true });
}

/**
 * Check if a due date is in the past (overdue).
 */
export function isOverdue(dueDate: Date | string | null): boolean {
  if (!dueDate) return false;
  const d = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  return d < new Date();
}

/**
 * Soft delete a task — set deleted_at + create activity log.
 */
export async function softDeleteTask(
  taskId: string,
  userId: string
): Promise<void> {
  await prisma.task.update({
    where: { id: taskId },
    data: { deletedAt: new Date() },
  });

  await createActivityLog({
    taskId,
    userId,
    actionType: 'deleted',
  });
}

/**
 * Create an activity log entry for a task.
 */
export async function createActivityLog(params: {
  taskId: string;
  userId: string;
  actionType: string;
  fieldChanged?: string;
  oldValue?: string | null;
  newValue?: string | null;
}): Promise<void> {
  await prisma.activityLog.create({
    data: {
      taskId: params.taskId,
      userId: params.userId,
      actionType: params.actionType,
      fieldChanged: params.fieldChanged ?? null,
      oldValue: params.oldValue ?? null,
      newValue: params.newValue ?? null,
    },
  });
}

/**
 * Validate that an assignee belongs to a workspace.
 */
export async function isAssigneeInWorkspace(
  assigneeId: string,
  workspaceId: string
): Promise<boolean> {
  const member = await prisma.workspaceMember.findFirst({
    where: { userId: assigneeId, workspaceId },
  });
  return !!member;
}

/**
 * Check if restore is allowed:
 * - Task must be soft-deleted
 * - Task must be < 30 days old
 * - Project must not be archived
 */
export async function validateRestore(taskId: string): Promise<{
  valid: boolean;
  error?: string;
  statusCode?: number;
  task?: any;
}> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: { select: { id: true, archivedAt: true } },
    },
  });

  if (!task) {
    return { valid: false, error: 'Task không tồn tại.', statusCode: 404 };
  }

  if (!task.deletedAt) {
    return { valid: false, error: 'Task không nằm trong thùng rác.', statusCode: 400 };
  }

  // Check 30-day window
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const deletedTime = new Date(task.deletedAt).getTime();
  if (Date.now() - deletedTime > thirtyDaysMs) {
    return { valid: false, error: 'Task đã quá 30 ngày, không thể khôi phục.', statusCode: 410 };
  }

  // Check if project is archived
  if (task.project.archivedAt) {
    return {
      valid: false,
      error: 'Project đã archive. Không thể khôi phục task vào project này.',
      statusCode: 400,
    };
  }

  return { valid: true, task };
}
