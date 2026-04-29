import { processMentionsAndNotify } from '../../src/services/comment.service';
import { prisma } from '../../src/lib/prisma';
import * as notificationService from '../../src/services/notification.service';

jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    workspaceMember: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('../../src/services/notification.service', () => ({
  createNotification: jest.fn(),
}));

describe('comment.service — Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('processMentionsAndNotify()', () => {
    it('notifies mentioned users and assignee', async () => {
      (prisma.workspaceMember.findMany as jest.Mock).mockResolvedValue([
        { userId: 'u1', user: { id: 'u1', name: 'Alice' } },
        { userId: 'u2', user: { id: 'u2', name: 'Bob' } },
        { userId: 'u3', user: { id: 'u3', name: 'Charlie' } },
      ]);

      await processMentionsAndNotify(
        'task1',
        'ws1',
        'Hello @Alice and @Bob!',
        'u3', // author is Charlie
        'Charlie',
        'Test Task',
        'u4' // assignee is someone else
      );

      // Alice and Bob should get mention notifications
      // Assignee (u4) should get comment_added notification
      expect(notificationService.createNotification).toHaveBeenCalledTimes(3);

      expect(notificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'u1',
          type: 'mention',
        })
      );
      expect(notificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'u2',
          type: 'mention',
        })
      );
      expect(notificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'u4',
          type: 'comment_added',
        })
      );
    });

    it('does not notify author if they mention themselves', async () => {
      (prisma.workspaceMember.findMany as jest.Mock).mockResolvedValue([
        { userId: 'u1', user: { id: 'u1', name: 'Alice' } },
      ]);

      await processMentionsAndNotify(
        'task1',
        'ws1',
        'Testing @Alice',
        'u1', // author is Alice
        'Alice',
        'Test Task',
        null
      );

      expect(notificationService.createNotification).not.toHaveBeenCalled();
    });

    it('matches longest names first to prevent partial matches', async () => {
      (prisma.workspaceMember.findMany as jest.Mock).mockResolvedValue([
        { userId: 'u1', user: { id: 'u1', name: 'John Doe' } },
        { userId: 'u2', user: { id: 'u2', name: 'John' } },
      ]);

      await processMentionsAndNotify(
        'task1',
        'ws1',
        'Hey @John Doe',
        'u3',
        'Charlie',
        'Test Task',
        null
      );

      // Should only notify John Doe, not John
      expect(notificationService.createNotification).toHaveBeenCalledTimes(1);
      expect(notificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'u1',
        })
      );
    });
  });
});
