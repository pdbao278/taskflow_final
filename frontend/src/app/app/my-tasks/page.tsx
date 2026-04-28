'use client';

import { useEffect, useState } from 'react';
import { ClipboardList, Loader2 } from 'lucide-react';
import { useTaskStore, type Task } from '@/features/tasks/stores/task.store';
import { useWorkspaceStore } from '@/features/workspace/stores/workspace.store';
import TaskCard from '@/features/tasks/components/TaskCard';
import TaskDetailSheet from '@/features/tasks/components/TaskDetailSheet';
import CreateTaskSheet from '@/features/tasks/components/CreateTaskSheet';

const STATUS_COLUMNS = [
  { key: 'ToDo', label: 'To Do', color: 'var(--status-todo)' },
  { key: 'InProgress', label: 'In Progress', color: 'var(--status-in-progress)' },
  { key: 'InReview', label: 'In Review', color: 'var(--status-in-review)' },
  { key: 'Done', label: 'Done', color: 'var(--status-done)' },
] as const;

export default function MyTasksPage() {
  const { tasks, isLoading, loadMyTasks } = useTaskStore();
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', minHeight: '300px' }}>
          {STATUS_COLUMNS.map((col) => {
            const columnTasks = getTasksByStatus(col.key);
            return (
              <div key={col.key} style={{ background: 'var(--surface)', borderRadius: '8px', padding: '12px', minHeight: '200px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: col.color }} />
                  <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                    {col.label}
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', background: 'var(--muted)', padding: '1px 6px', borderRadius: '9999px' }}>
                    {columnTasks.length}
                  </span>
                </div>
                {columnTasks.length === 0 ? (
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>Chưa có task</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {columnTasks.map(task => (
                      <TaskCard key={task.id} task={task} onClick={handleTaskClick} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <TaskDetailSheet
        open={showDetail}
        onClose={() => { setShowDetail(false); setSelectedTask(null); }}
        task={selectedTask}
        onUpdated={() => loadMyTasks()}
        onDeleted={() => loadMyTasks()}
      />
    </div>
  );
}
