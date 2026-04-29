'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useMyTasks } from '@/features/tasks/hooks/useMyTasks';
import TaskCard from '@/features/tasks/components/TaskCard';
import TaskDetailSheet from '@/features/tasks/components/TaskDetailSheet';
import type { Task } from '@/features/tasks/stores/task.store';
import { useWorkspaceStore } from '@/features/workspace/stores/workspace.store';
import { Search, Loader2, CheckCircle2 } from 'lucide-react';
import apiClient from '@/lib/api-client';

function MyTasksContent() {
  const [filter, setFilter] = useState<'All' | 'ToDo' | 'InProgress'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();
  const { currentWorkspaceId } = useWorkspaceStore();

  const { data: tasks, isLoading, refetch } = useMyTasks(filter);

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
          // Clean up URL without reload
          const url = new URL(window.location.href);
          url.searchParams.delete('taskId');
          router.replace(url.pathname + (url.search ? url.search : ''));
        }
      })
      .catch(() => {
        // Task not found or access denied — silently ignore
      });
  // Only run when taskId changes and currentWorkspaceId is available
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, currentWorkspaceId]);

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    if (!searchQuery.trim()) return tasks;
    const lowerQuery = searchQuery.toLowerCase();
    return tasks.filter((t: Task) => t.title.toLowerCase().includes(lowerQuery));
  }, [tasks, searchQuery]);

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 16px 0' }}>
          Công việc của tôi
        </h1>
        
        {/* Filters and Search */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '8px', background: 'var(--surface)', padding: '4px', borderRadius: '8px' }}>
            {(['All', 'ToDo', 'InProgress'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                style={{
                  padding: '6px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  background: filter === tab ? 'white' : 'transparent',
                  color: filter === tab ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontSize: '14px',
                  fontWeight: filter === tab ? 600 : 500,
                  cursor: 'pointer',
                  boxShadow: filter === tab ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                {tab === 'All' ? 'Tất cả' : tab === 'ToDo' ? 'To Do' : 'In Progress'}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', width: '280px' }}>
            <Search 
              size={16} 
              color="var(--text-muted)" 
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} 
            />
            <input
              type="text"
              placeholder="Tìm kiếm công việc..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--primary)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
            />
          </div>
        </div>
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0', color: 'var(--text-muted)', gap: '12px' }}>
            <Loader2 size={24} className="animate-spin" />
            <span style={{ fontSize: '14px' }}>Đang tải công việc...</span>
          </div>
        ) : filteredTasks.length > 0 ? (
          filteredTasks.map((task: Task) => (
            <TaskCard 
              key={task.id} 
              task={task} 
              variant="list-row"
              onClick={setSelectedTask} 
            />
          ))
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0', color: 'var(--text-muted)', gap: '16px', background: 'var(--surface)', borderRadius: '12px', border: '1px dashed var(--border)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <CheckCircle2 size={24} color="var(--primary)" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>Không có công việc nào</h3>
              <p style={{ fontSize: '14px', margin: 0 }}>
                {searchQuery ? 'Không tìm thấy công việc phù hợp với từ khóa.' : 'Tuyệt vời! Bạn không có công việc nào cần xử lý.'}
              </p>
            </div>
          </div>
        )}
      </div>

      <TaskDetailSheet
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        task={selectedTask}
        onUpdated={() => {
          refetch();
          setSelectedTask(null);
        }}
        onDeleted={() => {
          refetch();
          setSelectedTask(null);
        }}
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
