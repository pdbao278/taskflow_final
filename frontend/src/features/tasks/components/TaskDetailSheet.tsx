'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Pencil, Trash2, Loader2, AlertCircle, Calendar, User, Flag, CheckCircle2, ChevronDown, Search } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import toast from 'react-hot-toast';
import { useTaskStore, type Task, type UpdateTaskData } from '../stores/task.store';
import { useWorkspaceStore } from '@/features/workspace/stores/workspace.store';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import apiClient from '@/lib/api-client';
import { CommentThread } from '@/features/comments/components/CommentThread';

interface TaskDetailSheetProps {
  open: boolean;
  onClose: () => void;
  task: Task | null;
  onUpdated?: () => void;
  onDeleted?: () => void;
}

interface Member { id: string; userId: string; name: string; email: string; role: string; }

const STATUS_OPTIONS = [
  { value: 'ToDo', label: 'To Do', color: 'var(--status-todo)', bg: 'hsl(215 16% 47% / 0.1)' },
  { value: 'InProgress', label: 'In Progress', color: 'var(--status-in-progress)', bg: 'hsl(221 83% 53% / 0.1)' },
  { value: 'InReview', label: 'In Review', color: 'var(--status-in-review)', bg: 'hsl(38 92% 50% / 0.1)' },
  { value: 'Done', label: 'Done', color: 'var(--status-done)', bg: 'hsl(142 71% 45% / 0.1)' },
];

const PRIORITY_OPTIONS = [
  { value: 'Low', label: 'Low', bg: 'hsl(210 40% 96%)', color: 'hsl(215 16% 47%)' },
  { value: 'Medium', label: 'Medium', bg: 'hsl(38 92% 50% / 0.12)', color: 'hsl(38 92% 40%)' },
  { value: 'High', label: 'High', bg: 'hsl(48 96% 95%)', color: 'hsl(38 92% 50%)' },
  { value: 'Urgent', label: 'Urgent', bg: 'hsl(0 86% 97%)', color: 'hsl(0 84% 60%)' },
];

function formatDate(d: string | null) {
  if (!d) return '—';
  const date = new Date(d);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export default function TaskDetailSheet({ open, onClose, task, onUpdated, onDeleted }: TaskDetailSheetProps) {
  const { updateTask, deleteTask, updateTaskStatus } = useTaskStore();
  const { currentRole } = useWorkspaceStore();
  const { user } = useAuthStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPriority, setEditPriority] = useState('Medium');
  const [editStatus, setEditStatus] = useState('ToDo');
  const [editAssignee, setEditAssignee] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [activeTab, setActiveTab] = useState<'activity' | 'comments'>('comments');
  const [activities, setActivities] = useState<any[]>([]);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const assigneeRef = useRef<HTMLDivElement>(null);

  const canEdit = task && (
    currentRole === 'Admin' || currentRole === 'Manager' ||
    task.createdBy === user?.id || task.assigneeId === user?.id
  );
  const canDelete = currentRole === 'Admin' || currentRole === 'Manager';

  const canChangeStatus = currentRole === 'Admin' || currentRole === 'Manager' || task?.assigneeId === user?.id;

  const handleStatusChange = async (newStatus: string) => {
    if (!task) return;
    try {
      await updateTaskStatus(task.id, newStatus);
      toast.success(`Đã đổi trạng thái thành ${STATUS_OPTIONS.find(s => s.value === newStatus)?.label}`);
      onUpdated?.();
    } catch (err: unknown) {
      // rollback is handled by the store
    }
  };

  useEffect(() => {
    if (open && task) {
      setIsEditing(false);
      setEditTitle(task.title);
      setEditDesc(task.description || '');
      setEditPriority(task.priority);
      setEditStatus(task.status);
      setEditAssignee(task.assigneeId || '');
      setEditDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
      setShowDeleteConfirm(false);
      loadMembers();
      loadActivity(task.id);
      setShowAssigneeDropdown(false);
      setMemberSearch('');
    }
  }, [open, task]);

  // Click outside assignee dropdown
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (assigneeRef.current && !assigneeRef.current.contains(e.target as Node)) {
        setShowAssigneeDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const loadMembers = async () => {
    try {
      const res = await apiClient.get('/workspaces/members');
      setMembers(res.data?.data?.members ?? []);
    } catch { setMembers([]); }
  };

  const loadActivity = async (taskId: string) => {
    try {
      const res = await apiClient.get(`/tasks/${taskId}/activity`);
      setActivities(res.data?.data?.activities ?? []);
    } catch { setActivities([]); }
  };

  const handleSave = async () => {
    if (!task) return;
    setIsSaving(true);
    try {
      const data: UpdateTaskData = {};
      if (editTitle !== task.title) data.title = editTitle;
      if (editDesc !== (task.description || '')) data.description = editDesc || null;
      if (editPriority !== task.priority) data.priority = editPriority as any;
      if (editStatus !== task.status) data.status = editStatus as any;
      if ((editAssignee || null) !== task.assigneeId) data.assignee_id = editAssignee || null;
      const newDue = editDueDate ? new Date(editDueDate).toISOString() : null;
      const oldDue = task.dueDate ? new Date(task.dueDate).toISOString() : null;
      if (newDue !== oldDue) data.due_date = newDue;

      if (Object.keys(data).length > 0) {
        await updateTask(task.id, data);
        toast.success('Task đã được cập nhật');
        onUpdated?.();
      }
      setIsEditing(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally { setIsSaving(false); }
  };

  const handleDelete = async () => {
    if (!task) return;
    setIsDeleting(true);
    try {
      const ok = await deleteTask(task.id);
      if (ok) {
        toast.success('Task đã được chuyển vào thùng rác');
        onDeleted?.();
        onClose();
      } else { toast.error('Không thể xóa task'); }
    } catch { toast.error('Có lỗi xảy ra'); }
    finally { setIsDeleting(false); }
  };

  if (!open || !task) return null;

  const isOverdue = task.isOverdue && task.status !== 'Done';
  const statusOpt = STATUS_OPTIONS.find(s => s.value === (isEditing ? editStatus : task.status));
  const priorityOpt = PRIORITY_OPTIONS.find(p => p.value === (isEditing ? editPriority : task.priority));
  const isRemovedUser = task.isAssigneeRemoved;

  // Styles
  const labelStyle: React.CSSProperties = { fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' };
  const selectStyle: React.CSSProperties = { width: '100%', padding: '6px 8px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '13px', outline: 'none', background: 'white', cursor: 'pointer' };

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 400, animation: 'fadeIn 0.2s ease' }} onClick={onClose} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: '480px', background: 'white', zIndex: 401, display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)', animation: 'slideInRight 0.25s ease' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border)', minHeight: '52px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {task.project && (
              <>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: task.project.color, flexShrink: 0 }} />
                <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
                  Dự án: {task.project.name}
                </span>
              </>
            )}
          </div>
          <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
            {canEdit && !isEditing && (
              <button onClick={() => setIsEditing(true)} title="Chỉnh sửa"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '6px', color: 'var(--text-muted)', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
                <Pencil size={16} />
              </button>
            )}
            {canDelete && (
              <button onClick={() => setShowDeleteConfirm(true)} title="Xóa task"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '6px', color: 'var(--destructive)', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'hsl(0 84% 60% / 0.08)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                <Trash2 size={16} />
              </button>
            )}
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '6px', color: 'var(--text-muted)' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
          {/* Title + Overdue badge */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '4px' }}>
            {isEditing ? (
              <input value={editTitle} onChange={e => setEditTitle(e.target.value)} maxLength={200}
                style={{ flex: 1, fontSize: '18px', fontWeight: 600, border: '1px solid var(--border)', borderRadius: '8px', padding: '6px 10px', outline: 'none', boxSizing: 'border-box', color: 'var(--text-primary)' }} />
            ) : (
              <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0, color: 'var(--text-primary)', lineHeight: 1.4, flex: 1 }}>{task.title}</h2>
            )}
            {isOverdue && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '9999px', background: 'hsl(0 84% 60% / 0.1)', color: 'var(--destructive)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                <AlertCircle size={13} />Overdue
              </span>
            )}
          </div>

          {/* Creator info */}
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 16px' }}>
            Tạo bởi {task.creator?.name} lúc {formatDate(task.createdAt)}
          </p>

          {/* Meta grid 2×2 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px', padding: '16px', background: 'var(--surface)', borderRadius: '10px' }}>
            {/* Status */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px' }}>
                <CheckCircle2 size={13} color="var(--text-muted)" />
                <span style={labelStyle}>Trạng thái</span>
              </div>
              {isEditing ? (
                <select value={editStatus} onChange={e => setEditStatus(e.target.value)} style={selectStyle}>
                  {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              ) : (
                <select
                  value={task.status}
                  onChange={e => handleStatusChange(e.target.value)}
                  disabled={!canChangeStatus}
                  title={!canChangeStatus ? 'Chỉ assignee hoặc Manager mới có thể đổi trạng thái' : 'Đổi trạng thái'}
                  style={{
                    ...selectStyle,
                    background: statusOpt?.bg,
                    color: statusOpt?.color,
                    border: '1px solid transparent',
                    cursor: canChangeStatus ? 'pointer' : 'not-allowed',
                    opacity: canChangeStatus ? 1 : 0.7,
                    fontWeight: 600,
                  }}
                >
                  {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              )}
            </div>
            {/* Priority */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px' }}>
                <Flag size={13} color="var(--text-muted)" />
                <span style={labelStyle}>Độ ưu tiên</span>
              </div>
              {isEditing ? (
                <select value={editPriority} onChange={e => setEditPriority(e.target.value)} style={selectStyle}>
                  {PRIORITY_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: '12px', fontWeight: 600, padding: '3px 10px', borderRadius: '9999px', background: priorityOpt?.bg, color: priorityOpt?.color }}>
                  {priorityOpt?.label}
                </span>
              )}
            </div>
            {/* Assignee */}
            <div ref={assigneeRef} style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px' }}>
                <User size={13} color="var(--text-muted)" />
                <span style={labelStyle}>Assignee</span>
              </div>
              {isEditing ? (
                <>
                  <button type="button" onClick={() => { setShowAssigneeDropdown(v => !v); setMemberSearch(''); }}
                    style={{ ...selectStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', textAlign: 'left' as const }}>
                    <span style={{ color: editAssignee ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: '13px' }}>
                      {editAssignee ? members.find(m => m.userId === editAssignee)?.name || '[Removed User]' : 'Chưa giao'}
                    </span>
                    <ChevronDown size={13} />
                  </button>
                  {showAssigneeDropdown && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px', background: 'white', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 20, maxHeight: '220px', overflow: 'auto' }}>
                      <button onClick={() => { setEditAssignee(''); setShowAssigneeDropdown(false); }}
                        style={{ width: '100%', padding: '7px 10px', border: 'none', background: !editAssignee ? 'hsl(221 83% 53%/0.06)' : 'none', cursor: 'pointer', textAlign: 'left', fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface)')}
                        onMouseLeave={e => (e.currentTarget.style.background = !editAssignee ? 'hsl(221 83% 53%/0.06)' : 'none')}>
                        Không assign
                      </button>
                      {members.map(m => (
                        <button key={m.id} onClick={() => { setEditAssignee(m.userId); setShowAssigneeDropdown(false); }}
                          style={{ width: '100%', padding: '7px 10px', border: 'none', background: editAssignee === m.userId ? 'hsl(221 83% 53%/0.06)' : 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface)')}
                          onMouseLeave={e => (e.currentTarget.style.background = editAssignee === m.userId ? 'hsl(221 83% 53%/0.06)' : 'none')}>
                          <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 600, flexShrink: 0 }}>
                            {m.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)' }}>{m.name}</div>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{m.email}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {task.assignee ? (
                    isRemovedUser ? (
                      <>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', flexShrink: 0 }}>
                          RU
                        </div>
                        <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontStyle: 'italic' }}>[Removed User]</span>
                      </>
                    ) : (
                      <>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 600, flexShrink: 0 }}>
                          {task.assignee.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{task.assignee.name}</span>
                      </>
                    )
                  ) : (
                    <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontStyle: 'italic' }}>Chưa giao</span>
                  )}
                </div>
              )}
            </div>
            {/* Due date */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px' }}>
                <Calendar size={13} color="var(--text-muted)" />
                <span style={labelStyle}>Hạn hoàn thành</span>
              </div>
              {isEditing ? (
                <input type="date" value={editDueDate} onChange={e => setEditDueDate(e.target.value)} style={selectStyle} />
              ) : (
                <span style={{ fontSize: '14px', fontWeight: isOverdue ? 500 : 400, color: isOverdue ? 'var(--destructive)' : 'var(--text-primary)' }}>
                  {task.dueDate ? formatDate(task.dueDate) : '—'}
                </span>
              )}
            </div>
          </div>



          {/* Description */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '11px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Mô tả</h3>
            {isEditing ? (
              <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={5} maxLength={5000} placeholder="Mô tả chi tiết (tùy chọn)"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6, boxSizing: 'border-box' }} />
            ) : task.description ? (
              <div className="prose-task" style={{ fontSize: '14px', lineHeight: 1.7, color: 'var(--text-primary)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: 'var(--surface)', borderRadius: '8px', padding: '12px' }}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{task.description}</ReactMarkdown>
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>Chưa có mô tả</p>
            )}
          </div>

          {/* Edit actions — below description */}
          {isEditing && (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <button onClick={handleSave} disabled={isSaving}
                style={{ padding: '8px 16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: isSaving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', opacity: isSaving ? 0.7 : 1 }}>
                {isSaving ? <><Loader2 size={14} className="animate-spin" />Lưu...</> : 'Lưu thay đổi'}
              </button>
              <button onClick={() => setIsEditing(false)}
                style={{ padding: '8px 16px', border: '1px solid var(--border)', borderRadius: '6px', background: 'white', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
                Hủy
              </button>
            </div>
          )}

          {/* Tabs: Activity / Comments */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
            <div style={{ display: 'flex', gap: '0', marginBottom: '16px', borderBottom: '1px solid var(--border)' }}>
              {(['comments', 'activity'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  style={{ padding: '8px 16px', border: 'none', borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent', background: 'none', fontSize: '13px', fontWeight: activeTab === tab ? 600 : 400, color: activeTab === tab ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', transition: 'color 0.15s' }}>
                  {tab === 'comments' ? '💬 Bình luận' : '🕐 Lịch sử'}
                </button>
              ))}
            </div>
            {activeTab === 'activity' ? (
              activities.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {activities.map((a: any, i: number) => (
                    <div key={i} style={{ fontSize: '12px', color: 'var(--text-secondary)', padding: '8px 10px', background: 'var(--surface)', borderRadius: '6px' }}>
                      <strong>{a.user?.name}</strong> {a.actionType === 'created' ? 'đã tạo task' : a.actionType === 'field_edited' ? `đã sửa ${a.fieldChanged}` : a.actionType === 'deleted' ? 'đã xóa task' : a.actionType === 'restored' ? 'đã khôi phục task' : a.actionType}
                      {a.fieldChanged && <span style={{ color: 'var(--text-muted)' }}> ({a.oldValue} → {a.newValue})</span>}
                      <span style={{ float: 'right', color: 'var(--text-muted)' }}>{formatDate(a.createdAt)}</span>
                    </div>
                  ))}
                </div>
              ) : <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px' }}>Chưa có hoạt động</p>
            ) : (
              <div style={{ padding: '8px 0' }}>
                <CommentThread taskId={task.id} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete confirm */}
      {showDeleteConfirm && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 500 }} onClick={() => setShowDeleteConfirm(false)} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'white', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '400px', zIndex: 501, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>Xóa task</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.6 }}>
              Task <strong>{task.title}</strong> sẽ được chuyển vào thùng rác và tự động xóa sau 30 ngày.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={() => setShowDeleteConfirm(false)}
                style={{ padding: '8px 16px', border: '1px solid var(--border)', borderRadius: '6px', background: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>Hủy</button>
              <button onClick={handleDelete} disabled={isDeleting}
                style={{ padding: '8px 16px', border: 'none', borderRadius: '6px', background: 'var(--destructive)', color: 'white', cursor: isDeleting ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px', opacity: isDeleting ? 0.7 : 1 }}>
                {isDeleting ? <><Loader2 size={14} className="animate-spin" />Đang xóa...</> : 'Xóa task'}
              </button>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
      `}</style>
    </>
  );
}
