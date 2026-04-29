import { createNotification, notifyWorkspaceMembers } from '../../src/services/notification.service';
import { prisma } from '../../src/lib/prisma';

jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    notification: {
      create: jest.fn(),
      createMany: jest.fn(),
    },
    workspaceMember: {
      findMany: jest.fn(),
    },
  },
}));

describe('notification.service — Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createNotification()', () => {
    it('creates a single notification in the database', async () => {
      await createNotification({
        userId: 'u1',
        type: 'test_type',
        message: 'Test message',
        referenceId: 'ref1',
      });

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'u1',
          type: 'test_type',
          message: 'Test message',
          referenceId: 'ref1',
        },
      });
    });

    it('handles null referenceId', async () => {
      await createNotification({
        userId: 'u1',
        type: 'test_type',
        message: 'Test message',
      });

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'u1',
          type: 'test_type',
          message: 'Test message',
          referenceId: null,
        },
      });
    });
  });

  describe('notifyWorkspaceMembers()', () => {
    it('sends notifications to all members except excluded ones', async () => {
      (prisma.workspaceMember.findMany as jest.Mock).mockResolvedValue([
        { userId: 'u1' },
        { userId: 'u2' },
        { userId: 'u3' },
      ]);

      await notifyWorkspaceMembers({
        workspaceId: 'ws1',
        type: 'broadcast',
        message: 'Hello everyone',
        excludeUserIds: ['u2'],
      });

      expect(prisma.workspaceMember.findMany).toHaveBeenCalledWith({
        where: { workspaceId: 'ws1' },
        select: { userId: true },
      });

      expect(prisma.notification.createMany).toHaveBeenCalledWith({
        data: [
          { userId: 'u1', type: 'broadcast', message: 'Hello everyone', referenceId: null },
          { userId: 'u3', type: 'broadcast', message: 'Hello everyone', referenceId: null },
        ],
      });
    });

    it('does not call createMany if target array is empty', async () => {
      (prisma.workspaceMember.findMany as jest.Mock).mockResolvedValue([
        { userId: 'u1' },
      ]);

      await notifyWorkspaceMembers({
        workspaceId: 'ws1',
        type: 'broadcast',
        message: 'Hello everyone',
        excludeUserIds: ['u1'], // everyone is excluded
      });

      expect(prisma.notification.createMany).not.toHaveBeenCalled();
    });
  });
});
