import { createActivityLog } from '../../src/services/task.service';
import { prisma } from '../../src/lib/prisma';

jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    activityLog: {
      create: jest.fn(),
    },
  },
}));

describe('activity.service (task.service) — Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createActivityLog()', () => {
    it('creates an activity log with all fields', async () => {
      await createActivityLog({
        taskId: 'task1',
        userId: 'u1',
        actionType: 'field_edited',
        fieldChanged: 'title',
        oldValue: 'old title',
        newValue: 'new title',
      });

      expect(prisma.activityLog.create).toHaveBeenCalledWith({
        data: {
          taskId: 'task1',
          userId: 'u1',
          actionType: 'field_edited',
          fieldChanged: 'title',
          oldValue: 'old title',
          newValue: 'new title',
        },
      });
    });

    it('creates an activity log with minimal fields', async () => {
      await createActivityLog({
        taskId: 'task1',
        userId: 'u1',
        actionType: 'created',
      });

      expect(prisma.activityLog.create).toHaveBeenCalledWith({
        data: {
          taskId: 'task1',
          userId: 'u1',
          actionType: 'created',
          fieldChanged: null,
          oldValue: null,
          newValue: null,
        },
      });
    });
  });
});
