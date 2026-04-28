'use client';

import { useEffect, useState } from 'react';
import { ClipboardList, Loader2 } from 'lucide-react';
import { useTaskStore, type Task } from '@/features/tasks/stores/task.store';
import { useWorkspaceStore } from '@/features/workspace/stores/workspace.store';
import TaskDetailSheet from '@/features/tasks/components/TaskDetailSheet';
import CreateTaskSheet from '@/features/tasks/components/CreateTaskSheet';
import KanbanBoardView from '@/features/tasks/components/KanbanBoardView';

export default function MyTasksPage() {
  const { tasks, isLoading, loadMyTasks, updateTaskStatus } = useTaskStore();
  const { currentWorkspaceId } = useWorkspaceStore();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    if (currentWorkspaceId) {
      loadMyTasks();
    }
  }, [currentWorkspaceId, loadMyTasks]);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setShowDetail(true);
  };

  const getTasksByStatus = (status: string) => tasks.filter(t => t.status === status);

  if (isLoading && tasks.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
        <Loader2 size={28} className="animate-spin" color="var(--primary)" />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>
            Công việc của tôi
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
            {tasks.length} task
          </p>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '80px 24px', color: 'var(--text-muted)', textAlign: 'center',
        }}>
          <ClipboardList size={64} color="var(--border)" style={{ marginBottom: '16px' }} />
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Chưa có công việc
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '300px' }}>
            Bạn chưa có task nào. Hãy tạo task mới hoặc liên hệ Manager để được assign công việc.
          </p>
        </div>
      ) : (
        <KanbanBoardView tasks={tasks} onTaskClick={handleTaskClick} onStatusChange={updateTaskStatus} />
      )}

      {/* Task Detail Sheet */}
      <TaskDetailSheet
        open={showDetail}
        onClose={() => { setShowDetail(false); setSelectedTask(null); }}
        task={selectedTask}
        onUpdated={loadMyTasks}
        onDeleted={loadMyTasks}
      />
    </div>
  );
}
