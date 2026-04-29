'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspaceStore } from '@/features/workspace/stores/workspace.store';
import TeamKanbanBoard from '@/features/tasks/components/TeamKanbanBoard';
import TaskDetailSheet from '@/features/tasks/components/TaskDetailSheet';
import CreateTaskSheet from '@/features/tasks/components/CreateTaskSheet';
import type { Task } from '@/features/tasks/stores/task.store';
import { Loader2 } from 'lucide-react';

function TeamPageContent() {
  const router = useRouter();
  const { currentRole, currentWorkspaceId } = useWorkspaceStore();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreateSheet, setShowCreateSheet] = useState(false);

  // Check permissions: Member is not allowed here
  useEffect(() => {
    if (currentRole === 'Member') {
      router.replace('/app/my-tasks');
    }
  }, [currentRole, router]);

  if (!currentWorkspaceId) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
        <Loader2 size={28} className="animate-spin" color="var(--primary)" />
      </div>
    );
  }

  // Prevent render if Member
  if (currentRole === 'Member') {
    return null;
  }

  return (
    <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>
      {/* Header */}
      <div style={{ marginBottom: '8px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
          Team Kanban
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
          Xem và quản lý tất cả công việc của team trong workspace này.
        </p>
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        <TeamKanbanBoard 
          onTaskClick={setSelectedTask} 
          onAddTaskClick={() => setShowCreateSheet(true)} 
        />
      </div>

      <TaskDetailSheet
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        task={selectedTask}
        onUpdated={() => {
          setSelectedTask(null);
          window.dispatchEvent(new CustomEvent('refetch-team-tasks'));
        }}
        onDeleted={() => {
          setSelectedTask(null);
          window.dispatchEvent(new CustomEvent('refetch-team-tasks'));
        }}
      />

      <CreateTaskSheet
        open={showCreateSheet}
        onClose={() => setShowCreateSheet(false)}
        onCreated={() => {
          window.dispatchEvent(new CustomEvent('refetch-team-tasks'));
        }}
      />
    </div>
  );
}

export default function TeamPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
        <Loader2 size={28} className="animate-spin" color="var(--primary)" />
      </div>
    }>
      <TeamPageContent />
    </Suspense>
  );
}
