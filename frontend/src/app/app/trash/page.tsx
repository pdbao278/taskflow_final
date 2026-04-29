'use client';

import { useEffect, useState } from 'react';
import { Trash2, RotateCcw, Loader2, Clock, Filter, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTaskStore, type TrashTask } from '@/features/tasks/stores/task.store';
import { useWorkspaceStore } from '@/features/workspace/stores/workspace.store';
import { useProjectStore } from '@/features/projects/stores/project.store';
import { useRouter } from 'next/navigation';

function getInitials(name: string): string {
  if (!name) return '??';
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function getAvatarColor(id: string): string {
  const colors = ['#4f46e5','#0891b2','#059669','#d97706','#dc2626','#7c3aed','#db2777'];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function CountdownTimer({ deadline }: { deadline: string }) {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    const update = () => {
      const ms = new Date(deadline).getTime() - Date.now();
      if (ms <= 0) { setRemaining('Hết hạn'); return; }
      const days = Math.floor(ms / (1000 * 60 * 60 * 24));
      const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
      
      if (days >= 1) {
        setRemaining(`Còn ${days} ngày ${hours} giờ`);
      } else {
        setRemaining(`Còn ${hours} giờ ${minutes} phút`);
      }
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [deadline]);

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
      <Clock size={12} />{remaining}
    </span>
  );
}

export default function TrashPage() {
  const router = useRouter();
  const { currentRole } = useWorkspaceStore();
  const { trashTasks, isLoading, loadTrash, restoreTask } = useTaskStore();
  const { projects, loadProjects } = useProjectStore();
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [projectFilter, setProjectFilter] = useState<string>('');

  // Redirect non-admins
  useEffect(() => {
    if (currentRole && currentRole !== 'Admin') {
      router.push('/app/my-tasks');
    }
  }, [currentRole, router]);

  useEffect(() => {
    if (currentRole === 'Admin') {
      loadTrash(projectFilter);
      loadProjects();
    }
  }, [currentRole, loadTrash, loadProjects, projectFilter]);

  const handleRestore = async (taskId: string) => {
    setRestoringId(taskId);
    try {
      await restoreTask(taskId);
      toast.success('Task đã được khôi phục thành công');
    } catch (err: any) {
      toast.error(err.message || 'Không thể khôi phục task');
    } finally {
      setRestoringId(null);
    }
  };

  if (currentRole !== 'Admin') return null;

  return (
    <div style={{ width: '100%', flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Trash2 size={22} color="var(--text-secondary)" />
          <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Thùng rác</h1>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>
            Task đã xóa sẽ tự động bị xóa vĩnh viễn sau 30 ngày
          </span>
        </div>
        
        {/* Filter Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} color="var(--text-muted)" />
          <select 
            value={projectFilter} 
            onChange={e => setProjectFilter(e.target.value)}
            style={{ 
              padding: '6px 12px', 
              borderRadius: '6px', 
              border: '1px solid var(--border)', 
              fontSize: '13px', 
              outline: 'none',
              background: 'white',
              cursor: 'pointer'
            }}
          >
            <option value="">Dự án: Tất cả</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse" style={{ height: '48px', width: '100%', background: 'var(--border)', borderRadius: '8px' }} />
          ))}
        </div>
      ) : trashTasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 24px' }}>
          <Trash2 size={48} color="var(--text-muted)" style={{ marginBottom: '16px', opacity: 0.4, display: 'inline-block' }} />
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Thùng rác trống</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Không có task nào đã xóa.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Header row: 6 columns */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) 140px 140px 120px 140px 100px', gap: '12px', padding: '8px 16px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)' }}>
            <span>Tiêu đề</span>
            <span>Dự án</span>
            <span>Người xóa</span>
            <span>Ngày xóa</span>
            <span>Còn lại</span>
            <span>Actions</span>
          </div>

          {trashTasks.map((task: TrashTask) => {
            const isArchived = !!task.project?.archivedAt;
            
            return (
              <div key={task.id}
                style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) 140px 140px 120px 140px 100px', gap: '12px', padding: '12px 16px', alignItems: 'center', background: 'white', border: '1px solid var(--border)', borderRadius: '8px', transition: 'box-shadow 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
                {/* Title */}
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {task.title}
                </p>

                {/* Project */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {task.project ? (
                    <>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: task.project.color, flexShrink: 0 }} />
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={isArchived ? "Dự án đã archive" : ""}>
                        {task.project.name} {isArchived && <AlertCircle size={10} color="var(--destructive)" style={{ display: 'inline', marginLeft: '2px', position: 'relative', top: '-1px' }}/>}
                      </span>
                    </>
                  ) : (
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>-</span>
                  )}
                </div>

                {/* Deleted by */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '50%',
                    background: getAvatarColor(task.deletedBy), color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '10px', fontWeight: 600, flexShrink: 0
                  }} title={task.deletedBy}>
                    {getInitials(task.deletedBy)}
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {task.deletedBy}
                  </span>
                </div>

                {/* Date deleted */}
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {new Date(task.deletedAt!).toLocaleDateString('vi-VN')}
                </span>

                {/* Countdown */}
                {task.restoreDeadline ? <CountdownTimer deadline={task.restoreDeadline} /> : <span>-</span>}

                {/* Restore button */}
                <div title={isArchived ? "Dự án đã archive. Không thể khôi phục task." : "Khôi phục"}>
                  <button
                    onClick={() => handleRestore(task.id)}
                    disabled={restoringId === task.id || isArchived}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px',
                      border: '1px solid var(--border)', borderRadius: '6px', background: 'white',
                      cursor: (restoringId === task.id || isArchived) ? 'not-allowed' : 'pointer',
                      fontSize: '12px', fontWeight: 500, color: isArchived ? 'var(--text-muted)' : 'var(--primary)',
                      transition: 'background 0.15s', opacity: (restoringId === task.id || isArchived) ? 0.6 : 1,
                      width: 'fit-content'
                    }}
                    onMouseEnter={e => !isArchived && (e.currentTarget.style.background = 'hsl(221 83% 53% / 0.06)')}
                    onMouseLeave={e => !isArchived && (e.currentTarget.style.background = 'white')}
                  >
                    {restoringId === task.id ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                    Khôi phục
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
