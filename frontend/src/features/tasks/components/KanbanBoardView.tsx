'use client';

import { useState } from 'react';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragStartEvent, 
  DragEndEvent,
  useDroppable
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { type Task } from '../stores/task.store';
import TaskCard from './TaskCard';
import { useWorkspaceStore } from '@/features/workspace/stores/workspace.store';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import toast from 'react-hot-toast';

const STATUS_COLUMNS = [
  { key: 'ToDo', label: 'To Do', color: 'var(--status-todo)' },
  { key: 'InProgress', label: 'In Progress', color: 'var(--status-in-progress)' },
  { key: 'InReview', label: 'In Review', color: 'var(--status-in-review)' },
  { key: 'Done', label: 'Done', color: 'var(--status-done)' },
] as const;

interface KanbanBoardViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onStatusChange: (taskId: string, newStatus: string) => Promise<boolean>;
  isArchived?: boolean;
}

function SortableTaskCard({ task, onTaskClick, disabled }: { task: Task; onTaskClick: (task: Task) => void; disabled: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'Task', task },
    disabled,
  });

  const dragStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={dragStyle}
      {...attributes}
      {...(disabled ? {} : listeners)}
      title={disabled ? 'Chỉ assignee hoặc Manager mới có thể đổi trạng thái' : undefined}
    >
      <TaskCard task={task} onClick={onTaskClick} dragDisabled={disabled} />
    </div>
  );
}

function DroppableColumn({ id, title, color, count, children }: { id: string; title: string; color: string; count: number; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        background: isOver ? 'var(--surface-hover)' : 'var(--surface)',
        borderRadius: '8px',
        padding: '12px',
        minHeight: '200px',
        display: 'flex',
        flexDirection: 'column',
        border: isOver ? `1px dashed ${color}` : '1px solid transparent',
        transition: 'background 0.2s, border 0.2s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
        <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
          {title}
        </span>
        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', background: 'var(--muted)', padding: '1px 6px', borderRadius: '9999px' }}>
          {count}
        </span>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {children}
      </div>
    </div>
  );
}

export default function KanbanBoardView({ tasks, onTaskClick, onStatusChange, isArchived }: KanbanBoardViewProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const { currentRole } = useWorkspaceStore();
  const { user } = useAuthStore();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const getTasksByStatus = (status: string) => tasks.filter(t => t.status === status);

  const canDragTask = (task: Task) => {
    if (currentRole === 'Admin' || currentRole === 'Manager') return true;
    return task.assigneeId === user?.id;
  };

  const handleDragStart = (e: DragStartEvent) => {
    const { active } = e;
    setActiveTask(active.data.current?.task as Task);
  };

  const handleDragEnd = async (e: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = e;
    if (!over) return;

    const activeTask = active.data.current?.task as Task;
    const overId = over.id;

    let newStatus = overId as string;
    const isOverColumn = STATUS_COLUMNS.some(c => c.key === overId);
    
    if (!isOverColumn) {
      const overTask = tasks.find(t => t.id === overId);
      if (overTask) newStatus = overTask.status;
    }

    if (!newStatus || activeTask.status === newStatus) return;

    const newStatusLabel = STATUS_COLUMNS.find(c => c.key === newStatus)?.label;

    try {
      await onStatusChange(activeTask.id, newStatus);
      toast.success(`Đã đổi trạng thái thành ${newStatusLabel}`);
    } catch (err) {
      // rollback handled by optimistic update logic in caller
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', minHeight: '300px' }}>
        {STATUS_COLUMNS.map((col) => {
          const columnTasks = getTasksByStatus(col.key);
          return (
            <DroppableColumn key={col.key} id={col.key} title={col.label} color={col.color} count={columnTasks.length}>
              {columnTasks.length === 0 ? (
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0', margin: 0 }}>Chưa có task</p>
              ) : (
                <SortableContext id={col.key} items={columnTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                  {columnTasks.map(task => (
                    <SortableTaskCard key={task.id} task={task} onTaskClick={onTaskClick} disabled={!canDragTask(task)} />
                  ))}
                </SortableContext>
              )}
            </DroppableColumn>
          );
        })}
      </div>
      
      <DragOverlay>
        {activeTask ? (
          <div style={{ transform: 'rotate(2deg)', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)' }}>
            <TaskCard task={activeTask} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
