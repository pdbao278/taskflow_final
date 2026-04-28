import { prisma } from '../lib/prisma';
import { createNotification } from './notification.service';
import { createActivityLog } from './task.service';

export async function processMentionsAndNotify(
  taskId: string,
  workspaceId: string,
  content: string,
  authorId: string,
  authorName: string,
  taskTitle: string,
  assigneeId: string | null
) {
  // Get all members of the workspace
  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    include: { user: { select: { id: true, name: true } } },
  });

  const mentionedUserIds = new Set<string>();

  // Sort members by name length descending to match longest names first
  const sortedMembers = members.sort((a, b) => b.user.name.length - a.user.name.length);

  let remainingContent = content;

  for (const member of sortedMembers) {
    const mentionString = `@${member.user.name}`;
    if (remainingContent.includes(mentionString)) {
      if (member.userId !== authorId) {
        mentionedUserIds.add(member.userId);
      }
      // Replace all occurrences of this mention so shorter names don't match substrings of this name
      remainingContent = remainingContent.split(mentionString).join('');
    }
  }

  // Send notifications for mentions
  for (const userId of mentionedUserIds) {
    await createNotification({
      userId,
      type: 'mention',
      message: `${authorName} đã nhắc đến bạn trong task "${taskTitle}"`,
      referenceId: taskId,
    });
  }

  // Notify assignee if not author and not already mentioned
  if (assigneeId && assigneeId !== authorId && !mentionedUserIds.has(assigneeId)) {
    await createNotification({
      userId: assigneeId,
      type: 'comment_added',
      message: `${authorName} đã comment vào task "${taskTitle}"`,
      referenceId: taskId,
    });
  }
}
