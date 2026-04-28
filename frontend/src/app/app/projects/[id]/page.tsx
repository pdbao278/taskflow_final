'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Archive, Pencil, Plus, CheckCircle2,
  Loader2, AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { projectApi, useProjectStore, type Project } from '@/features/projects/stores/project.store';
import { useWorkspaceStore } from '@/features/workspace/stores/workspace.store';
import { useTaskStore, type Task } from '@/features/tasks/stores/task.store';
import EditProjectDialog from '@/features/projects/components/EditProjectDialog';
import TaskCard from '@/features/tasks/components/TaskCard';
import CreateTaskSheet from '@/features/tasks/components/CreateTaskSheet';
import TaskDetailSheet from '@/features/tasks/components/TaskDetailSheet';

const STATUS_COLUMNS = [
  { key: 'ToDo', label: 'To Do', color: 'var(--status-todo)' },
  { key: 'InProgress', label: 'In Progress', color: 'var(--status-in-progress)' },
  { key: 'InReview', label: 'In Review', color: 'var(--status-in-review)' },
  { key: 'Done', label: 'Done', color: 'var(--status-done)' },
] as const;

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const { currentProject, isLoading, error, loadProject, updateProject } = useProjectStore();
  const { currentRole, currentWorkspaceId } = useWorkspaceStore();
  const { tasks, loadProjectTasks } = useTaskStore();

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showDetailSheet, setShowDetailSheet] = useState(false);

  const canEdit = currentRole === 'Admin' || currentRole === 'Manager';
  const isArchived = currentProject?.archivedAt !== null;

  const reloadTasks = useCallback(() => {
    if (projectId && currentWorkspaceId) {
      loadProjectTasks(projectId);
    }
  }, [projectId, currentWorkspaceId, loadProjectTasks]);

  useEffect(() => {
    if (projectId && currentWorkspaceId) {
      loadProject(projectId);
      reloadTasks();
    }
  }, [projectId, currentWorkspaceId, loadProject, reloadTasks]);

  const handleArchive = async () => {
    if (!currentProject) return;
    setIsArchiving(true);
    try {
      const result = await projectApi.archive(currentProject.id);
      if (result.success) {
        updateProject(result.data.project);
        toast.success('Dự án đã được archive thành công');
        setShowArchiveConfirm(false);
      }
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Có lỗi xảy ra. Thử lại?';
      toast.error(message);
    } finally {
      setIsArchiving(false);
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setShowDetailSheet(true);
  };

  // Loading state
  if (isLoading && !currentProject) {
    return (
      <div>
        <div style={{ height: '20px', background: 'var(--muted)', borderRadius: '6px', width: '200px', marginBottom: '24px' }} />
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
          <div style={{ height: '24px', background: 'var(--muted)', borderRadius: '6px', width: '40%', marginBottom: '12px' }} />
          <div style={{ height: '14px', background: 'var(--muted)', borderRadius: '6px', width: '70%', marginBottom: '16px' }} />
          <div style={{ height: '8px', background: 'var(--muted)', borderRadius: '4px', width: '100%' }} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 24px' }}>
        <AlertTriangle size={48} color="var(--destructive)" style={{ marginBottom: '16px' }} />
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Có lỗi xảy ra</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>{error}</p>
        <button onClick={() => loadProject(projectId)}
          style={{ padding: '8px 20px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
          Thử lại
        </button>
      </div>
    );
  }

  if (!currentProject) return null;

  const { taskCount } = currentProject;
  const percentage = taskCount.total > 0 ? Math.round((taskCount.done / taskCount.total) * 100) : 0;
  const getTasksByStatus = (status: string) => tasks.filter(t => t.status === status);

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
        <button onClick={() => router.push('/app/projects')}
          style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontSize: '14px', fontWeight: 500, padding: '4px 0' }}>
          <ArrowLeft size={16} />Dự án
        </button>
        <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>/</span>
        <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>{currentProject.name}</span>
      </div>

      {/* Project Info Card */}
      <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', marginBottom: '28px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: currentProject.color, flexShrink: 0 }} />
            <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>{currentProject.name}</h1>
            {isArchived && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'var(--muted)', color: 'var(--muted-foreground)', fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px' }}>
                <Archive size={12} />Archived
              </span>
            )}
          </div>
          {canEdit && !isArchived && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setShowEditDialog(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', border: '1px solid var(--border)', borderRadius: '6px', background: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', transition: 'background 0.15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}>
                <Pencil size={14} />Chỉnh sửa
              </button>
              <button onClick={() => setShowArchiveConfirm(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', border: '1px solid hsl(0 84% 60% / 0.3)', borderRadius: '6px', background: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 500, color: 'var(--destructive)', transition: 'background 0.15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--destructive-bg)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}>
                <Archive size={14} />Archive
              </button>
            </div>
          )}
        </div>
        {currentProject.description && (
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 16px', lineHeight: 1.6, wordBreak: 'break-word', overflowWrap: 'anywhere', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as const }}>
            {currentProject.description}
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <CheckCircle2 size={18} color="var(--success)" />
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500, whiteSpace: 'nowrap' }}>
            {taskCount.done} / {taskCount.total} tasks hoàn thành
          </span>
          <div style={{ flex: 1, height: '8px', background: 'var(--muted)', borderRadius: '9999px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${percentage}%`, background: 'linear-gradient(90deg, hsl(142 71% 45%), hsl(142 76% 55%))', borderRadius: '9999px', transition: 'width 0.5s ease' }} />
          </div>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600, minWidth: '36px', textAlign: 'right' }}>{percentage}%</span>
        </div>
      </div>

      {/* Section header: Task list */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Danh sách Task</h2>
          <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{tasks.length}</span>
        </div>
        <button
          disabled={!!isArchived}
          title={isArchived ? 'Dự án đã archive. Không thể tạo task mới.' : undefined}
          onClick={() => !isArchived && setShowCreateSheet(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px',
            background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px',
            fontSize: '14px', fontWeight: 500, transition: 'background 0.15s',
            opacity: isArchived ? 0.5 : 1, cursor: isArchived ? 'not-allowed' : 'pointer',
          }}
          onMouseEnter={(e) => { if (!isArchived) e.currentTarget.style.background = 'var(--primary-hover)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--primary)'; }}
        >
          <Plus size={16} />Thêm task
        </button>
      </div>

      {/* Kanban 4 columns */}
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

      {/* Edit Project Dialog */}
      {currentProject && <EditProjectDialog open={showEditDialog} onClose={() => setShowEditDialog(false)} project={currentProject} />}

      {/* Create Task Sheet */}
      <CreateTaskSheet
        open={showCreateSheet}
        onClose={() => setShowCreateSheet(false)}
        prefilledProjectId={projectId}
        onCreated={() => {
          reloadTasks();
          loadProject(projectId);
        }}
      />

      {/* Task Detail Sheet */}
      <TaskDetailSheet
        open={showDetailSheet}
        onClose={() => { setShowDetailSheet(false); setSelectedTask(null); }}
        task={selectedTask}
        onUpdated={() => {
          reloadTasks();
          loadProject(projectId);
        }}
        onDeleted={() => {
          reloadTasks();
          loadProject(projectId);
        }}
      />

      {/* Archive Confirm Dialog */}
      {showArchiveConfirm && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300 }} onClick={() => setShowArchiveConfirm(false)} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'white', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '420px', zIndex: 300, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>Archive dự án</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.6 }}>
              Bạn chắc chắn muốn archive dự án <strong>{currentProject.name}</strong>? Sau khi archive, không thể tạo task mới trong dự án này.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={() => setShowArchiveConfirm(false)}
                style={{ padding: '8px 16px', border: '1px solid var(--border)', borderRadius: '6px', background: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>Hủy</button>
              <button onClick={handleArchive} disabled={isArchiving}
                style={{ padding: '8px 16px', border: 'none', borderRadius: '6px', background: 'var(--primary)', color: 'white', cursor: isArchiving ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px', opacity: isArchiving ? 0.7 : 1 }}>
                {isArchiving ? (<><Loader2 size={16} className="animate-spin" />Đang xử lý...</>) : 'Archive dự án'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
