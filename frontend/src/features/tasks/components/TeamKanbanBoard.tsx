'use client';

import { useState, useMemo, useEffect } from 'react';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragStartEvent, 
  DragOverEvent, 
  DragEndEvent,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useTeamTasks } from '../hooks/useTeamTasks';
import KanbanColumn from './KanbanColumn';
import TaskCard from './TaskCard';
import type { Task } from '../stores/task.store';
import apiClient from '@/lib/api-client';
import { Loader2, Search, FilterX } from 'lucide-react';
import { useWorkspaceStore } from '@/features/workspace/stores/workspace.store';
import { useProjectStore } from '@/features/projects/stores/project.store';
import toast from 'react-hot-toast';

interface TeamKanbanBoardProps {
  onTaskClick: (task: Task) => void;
  onAddTaskClick: () => void;
}

const COLUMNS = [
  { id: 'ToDo', title: 'TO DO', color: 'var(--status-todo)' },
  { id: 'InProgress', title: 'IN PROGRESS', color: 'var(--status-in-progress)' },
  { id: 'InReview', title: 'IN REVIEW', color: 'var(--status-in-review)' },
  { id: 'Done', title: 'DONE', color: 'var(--status-done)' }
];

export default function TeamKanbanBoard({ onTaskClick, onAddTaskClick }: TeamKanbanBoardProps) {
  const { currentRole } = useWorkspaceStore();
  const { projects, loadProjects } = useProjectStore();
  const { data: initialTasks, isLoading, isRefreshing, refetch } = useTeamTasks();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Extract unique assignees for filter
  const assignees = useMemo(() => {
    const map = new Map();
    initialTasks?.forEach(t => {
      if (t.assignee) {
        map.set(t.assignee.id, t.assignee.name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [initialTasks]);

  useEffect(() => {
    if (initialTasks) {
      setTasks(initialTasks);
    }
  }, [initialTasks]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Client-side filtering
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (projectFilter !== 'all' && task.projectId !== projectFilter) return false;
      if (assigneeFilter !== 'all') {
        if (assigneeFilter === 'unassigned' && task.assigneeId !== null) return false;
        if (assigneeFilter !== 'unassigned' && task.assigneeId !== assigneeFilter) return false;
      }
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
      if (dateFrom && (!task.dueDate || new Date(task.dueDate) < new Date(dateFrom))) return false;
      if (dateTo && (!task.dueDate || new Date(task.dueDate) > new Date(dateTo))) return false;
      return true;
    });
  }, [tasks, searchQuery, projectFilter, assigneeFilter, priorityFilter, dateFrom, dateTo]);

  const hasActiveFilters = searchQuery || projectFilter !== 'all' || assigneeFilter !== 'all' || priorityFilter !== 'all' || dateFrom || dateTo;

  const clearFilters = () => {
    setSearchQuery('');
    setProjectFilter('all');
    setAssigneeFilter('all');
    setPriorityFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    if (task) setActiveTask(task);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveTask = active.data.current?.type === 'Task';
    const isOverTask = over.data.current?.type === 'Task';
    const isOverColumn = over.data.current?.type === 'Column';

    if (!isActiveTask) return;

    setTasks(tasks => {
      const activeIndex = tasks.findIndex(t => t.id === activeId);
      const activeTask = tasks[activeIndex];
      
      if (isOverTask) {
        const overIndex = tasks.findIndex(t => t.id === overId);
        const overTask = tasks[overIndex];
        
        if (activeTask.status !== overTask.status) {
          activeTask.status = overTask.status as any;
          return arrayMove(tasks, activeIndex, overIndex);
        }
        return arrayMove(tasks, activeIndex, overIndex);
      }

      if (isOverColumn) {
        activeTask.status = overId as any;
        return arrayMove(tasks, activeIndex, activeIndex);
      }

      return tasks;
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;
    
    const isOverColumn = over.data.current?.type === 'Column';
    const isOverTask = over.data.current?.type === 'Task';
    
    let targetStatus = null;
    if (isOverColumn) {
      targetStatus = overId;
    } else if (isOverTask) {
      const overTask = tasks.find(t => t.id === overId);
      targetStatus = overTask?.status;
    }

    if (targetStatus && activeTask && activeTask.status !== targetStatus) {
      try {
        await apiClient.patch(`/tasks/${activeId}/status`, { status: targetStatus });
        // Optionally refetch in background to sync
        refetch(true);
      } catch (err) {
        toast.error('Không thể cập nhật trạng thái. Thử lại?');
        // Rollback
        setTasks(initialTasks || []);
      }
    }
  };

  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }),
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0', color: 'var(--text-muted)', gap: '12px' }}>
        <Loader2 size={24} className="animate-spin" />
        <span style={{ fontSize: '14px' }}>Đang tải công việc...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Filter Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '8px', padding: '12px 0' }}>
        {/* Search */}
        <div style={{ position: 'relative', width: '200px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Tìm kiếm task..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', height: '36px', padding: '0 12px 0 32px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px' }}
          />
        </div>

        {/* Project Filter */}
        <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)} style={{ height: '36px', padding: '0 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px', background: 'white' }}>
          <option value="all">Dự án: Tất cả</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        {/* Assignee Filter */}
        <select value={assigneeFilter} onChange={e => setAssigneeFilter(e.target.value)} style={{ height: '36px', padding: '0 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px', background: 'white' }}>
          <option value="all">Assignee: Tất cả</option>
          <option value="unassigned">Chưa assign</option>
          {assignees.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>

        {/* Priority Filter */}
        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} style={{ height: '36px', padding: '0 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px', background: 'white' }}>
          <option value="all">Ưu tiên: Tất cả</option>
          <option value="Urgent">Urgent</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        {/* Date From */}
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ height: '36px', padding: '0 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px' }} />
        <span style={{ color: 'var(--text-muted)' }}>-</span>
        {/* Date To */}
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ height: '36px', padding: '0 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px' }} />

        {/* Refresh */}
        <button onClick={() => refetch(true)} style={{ height: '36px', width: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', border: '1px solid var(--border)', background: 'white', cursor: 'pointer' }}>
          {isRefreshing ? <Loader2 size={16} className="animate-spin" /> : '↻'}
        </button>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button onClick={clearFilters} style={{ display: 'flex', alignItems: 'center', gap: '4px', height: '36px', padding: '0 12px', fontSize: '13px', color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <FilterX size={14} /> Xóa bộ lọc
          </button>
        )}

        {/* Add Task Button */}
        {(currentRole === 'Admin' || currentRole === 'Manager') && (
          <button
            onClick={onAddTaskClick}
            style={{ height: '36px', padding: '0 16px', background: 'var(--text-primary)', color: 'white', borderRadius: '6px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', border: 'none' }}
          >
            + Thêm Task
          </button>
        )}
      </div>

      {hasActiveFilters && (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Đang hiển thị {filteredTasks.length} / {tasks.length} task
        </div>
      )}

      {/* Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div style={{ display: 'flex', gap: '16px', flex: 1, overflowX: 'auto', paddingBottom: '16px' }}>
          {COLUMNS.map(col => {
            const columnTasks = filteredTasks.filter(t => t.status === col.id);
            return (
              <KanbanColumn
                key={col.id}
                id={col.id}
                title={col.title}
                color={col.color}
                tasks={columnTasks}
                onTaskClick={onTaskClick}
              />
            );
          })}
        </div>
        <DragOverlay dropAnimation={dropAnimation}>
          {activeTask ? (
            <div style={{ transform: 'rotate(2deg)', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
              <TaskCard task={activeTask} variant="kanban" />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
