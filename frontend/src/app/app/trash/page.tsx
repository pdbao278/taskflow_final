'use client';

import { useEffect, useState } from 'react';
import { Trash2, RotateCcw, Loader2, Clock, FolderOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTaskStore, type TrashTask } from '@/features/tasks/stores/task.store';
import { useWorkspaceStore } from '@/features/workspace/stores/workspace.store';
import { useRouter } from 'next/navigation';

function CountdownTimer({ deadline }: { deadline: string }) {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    const update = () => {
      const ms = new Date(deadline).getTime() - Date.now();
      if (ms <= 0) { setRemaining('Hết hạn'); return; }
      const days = Math.floor(ms / (1000 * 60 * 60 * 24));
      const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      setRemaining(`${days}d ${hours}h`);
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
  const [restoringId, setRestoringId] = useState<string | null>(null);

  // Redirect non-admins
  useEffect(() => {
    if (currentRole && currentRole !== 'Admin') {
      router.push('/app/my-tasks');
    }
  }, [currentRole, router]);

  useEffect(() => {
    if (currentRole === 'Admin') {
      loadTrash();
    }
  }, [currentRole, loadTrash]);

  const handleRestore = async (taskId: string) => {
    setRestoringId(taskId);
    try {
      const ok = await restoreTask(taskId);
      if (ok) {
        toast.success('Task đã được khôi phục');
      } else {
        toast.error('Không thể khôi phục task');
      }
    } catch {
      toast.error('Có lỗi xảy ra');
    } finally {
      setRestoringId(null);
    }
  };

  if (currentRole !== 'Admin') return null;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
        <Trash2 size={22} color="var(--text-secondary)" />
        <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Thùng rác</h1>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>
          Task đã xóa sẽ tự động bị xóa vĩnh viễn sau 30 ngày
        </span>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <Loader2 size={24} className="animate-spin" color="var(--primary)" />
        </div>
      ) : trashTasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 24px' }}>
          <Trash2 size={48} color="var(--text-muted)" style={{ marginBottom: '16px', opacity: 0.4 }} />
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Thùng rác trống</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Không có task nào đã xóa</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Header row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 120px 100px 80px', gap: '12px', padding: '8px 16px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)' }}>
            <span>Task</span>
            <span>Dự án</span>
            <span>Xóa bởi</span>
            <span>Còn lại</span>
            <span></span>
          </div>

          {trashTasks.map((task: TrashTask) => (
            <div key={task.id}
              style={{ display: 'grid', gridTemplateColumns: '1fr 140px 120px 100px 80px', gap: '12px', padding: '12px 16px', alignItems: 'center', background: 'white', border: '1px solid var(--border)', borderRadius: '8px', transition: 'box-shadow 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
              {/* Title */}
              <div>
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {task.title}
                </p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                  Xóa lúc {new Date(task.deletedAt!).toLocaleDateString('vi-VN')}
                </p>
              </div>

              {/* Project */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {task.project && (
                  <>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: task.project.color, flexShrink: 0 }} />
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {task.project.name}
                    </span>
                  </>
                )}
              </div>

              {/* Deleted by */}
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{task.deletedBy}</span>

              {/* Countdown */}
              {task.restoreDeadline && <CountdownTimer deadline={task.restoreDeadline} />}

              {/* Restore button */}
              <button
                onClick={() => handleRestore(task.id)}
                disabled={restoringId === task.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px',
                  border: '1px solid var(--border)', borderRadius: '6px', background: 'white',
                  cursor: restoringId === task.id ? 'not-allowed' : 'pointer',
                  fontSize: '12px', fontWeight: 500, color: 'var(--primary)',
                  transition: 'background 0.15s', opacity: restoringId === task.id ? 0.7 : 1,
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'hsl(221 83% 53% / 0.06)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'white')}
              >
                {restoringId === task.id ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                Khôi phục
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
