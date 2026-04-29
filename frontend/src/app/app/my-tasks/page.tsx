'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ClipboardList, Loader2 } from 'lucide-react';
import { useTaskStore, type Task } from '@/features/tasks/stores/task.store';
import { useWorkspaceStore } from '@/features/workspace/stores/workspace.store';
import TaskDetailSheet from '@/features/tasks/components/TaskDetailSheet';
import CreateTaskSheet from '@/features/tasks/components/CreateTaskSheet';
import KanbanBoardView from '@/features/tasks/components/KanbanBoardView';
import apiClient from '@/lib/api-client';

// Inner component that uses useSearchParams (must be wrapped in Suspense)
function MyTasksContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { tasks, isLoading, loadMyTasks, updateTaskStatus } = useTaskStore();
  const { currentWorkspaceId } = useWorkspaceStore();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    if (currentWorkspaceId) {
      loadMyTasks();
    }
  }, [currentWorkspaceId, loadMyTasks]);

  // Handle taskId query param from notification click
  useEffect(() => {
    const taskId = searchParams.get('taskId');
    if (!taskId || !currentWorkspaceId) return;

    // Load task detail and open sheet
    apiClient
      .get(`/tasks/${taskId}`)
      .then((res) => {
        const task = res.data?.data?.task;
        if (task) {
          setSelectedTask(task);
          setShowDetail(true);
          // Clean up URL without reload
          const url = new URL(window.location.href);
          url.searchParams.delete('taskId');
          router.replace(url.pathname + (url.search ? url.search : ''));
        }
      })
      .catch(() => {
        // Task not found or access denied — silently ignore
      });
  // Only run when taskId changes and tasks are available
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, currentWorkspaceId]);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setShowDetail(true);
  };

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

// Page wrapper with Suspense boundary (required for useSearchParams in Next.js)
export default function MyTasksPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
        <Loader2 size={28} className="animate-spin" color="var(--primary)" />
      </div>
    }>
      <MyTasksContent />
    </Suspense>
  );
}
