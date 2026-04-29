'use client';

import { useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useMyTasks } from '@/features/tasks/hooks/useMyTasks';
import { useWorkspaceMembers } from '@/features/workspace/hooks/useWorkspaceMembers';
import TaskCard from '@/features/tasks/components/TaskCard';
import TaskDetailSheet from '@/features/tasks/components/TaskDetailSheet';
import { ChevronLeft, Loader2 } from 'lucide-react';
import type { Task } from '@/features/tasks/stores/task.store';

export default function MemberTasksPage() {
  const router = useRouter();
  const params = useParams();
  const memberId = params.memberId as string;
  
  const [filter, setFilter] = useState<'All' | 'ToDo' | 'InProgress'>('All');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const { data: tasks, isLoading } = useMyTasks(filter, memberId);
  const { data: members } = useWorkspaceMembers();

  const memberName = useMemo(() => {
    return members.find(m => m.userId === memberId)?.name || 'thành viên';
  }, [members, memberId]);

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    return tasks;
  }, [tasks]);

  return (
    <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Breadcrumb / Header */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button 
          onClick={() => router.push('/app/reports')}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}
        >
          <ChevronLeft size={20} />
          <span style={{ fontSize: '14px', fontWeight: 500 }}>Báo cáo</span>
        </button>
        <span style={{ color: 'var(--text-muted)' }}>/</span>
        <h1 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
          Công việc của {memberName}
        </h1>
        <span style={{ marginLeft: '12px', fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '9999px', background: 'hsl(38 92% 50% / 0.12)', color: 'hsl(38 92% 40%)', flexShrink: 0 }}>
          Chỉ xem (Read-only)
        </span>
      </div>

      <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', background: 'var(--surface)', padding: '4px', borderRadius: '8px', width: 'fit-content' }}>
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

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <Loader2 size={24} className="animate-spin" color="var(--text-muted)" />
          </div>
        ) : filteredTasks.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredTasks.map((task: Task) => (
              <TaskCard 
                key={task.id} 
                task={task} 
                variant="list-row"
                onClick={() => setSelectedTask(task)}
              />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '64px 24px', color: 'var(--text-muted)' }}>
            <p>Không có task nào trong trạng thái này.</p>
          </div>
        )}
      </div>

      <TaskDetailSheet
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        task={selectedTask}
        readOnly={true}
      />
    </div>
  );
}
