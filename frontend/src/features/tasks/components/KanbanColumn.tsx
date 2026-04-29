'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TaskCard from './TaskCard';
import type { Task } from '../stores/task.store';
import { useWorkspaceStore } from '@/features/workspace/stores/workspace.store';

interface KanbanColumnProps {
  id: string;
  title: string;
  color: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

function SortableTaskCard({ task, onTaskClick, dragDisabled }: { task: Task; onTaskClick: (t: Task) => void; dragDisabled: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'Task',
      task,
    },
    disabled: dragDisabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} variant="kanban" onClick={onTaskClick} dragDisabled={dragDisabled} />
    </div>
  );
}

export default function KanbanColumn({ id, title, color, tasks, onTaskClick }: KanbanColumnProps) {
  const { currentRole } = useWorkspaceStore();
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      type: 'Column',
    },
  });

  const canDrag = currentRole === 'Admin' || currentRole === 'Manager';

  return (
    <div
      ref={setNodeRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minWidth: '280px',
        background: 'var(--surface)',
        borderRadius: '8px',
        padding: '12px',
        border: isOver ? '2px dashed var(--primary)' : '2px solid transparent',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', paddingLeft: '4px' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
        <span style={{ fontSize: '12px', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {title}
        </span>
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
          {tasks.length}
        </span>
      </div>

      {/* Task List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '150px' }}>
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <SortableTaskCard
              key={task.id}
              task={task}
              onTaskClick={onTaskClick}
              dragDisabled={!canDrag}
            />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', marginTop: '16px' }}>
            Chưa có task
          </div>
        )}
      </div>
    </div>
  );
}
