'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Loader2, ChevronDown, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTaskStore, type CreateTaskData } from '../stores/task.store';
import { useProjectStore } from '@/features/projects/stores/project.store';
import apiClient from '@/lib/api-client';

interface CreateTaskSheetProps {
  open: boolean;
  onClose: () => void;
  prefilledProjectId?: string | null;
  onCreated?: () => void;
}

interface WorkspaceMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
}

const PRIORITIES = [
  { value: 'Low', label: 'Thấp', color: 'hsl(215 16% 47%)' },
  { value: 'Medium', label: 'Trung bình', color: 'hsl(38 92% 40%)' },
  { value: 'High', label: 'Cao', color: 'hsl(25 95% 43%)' },
  { value: 'Urgent', label: 'Gấp', color: 'hsl(0 84% 50%)' },
];

export default function CreateTaskSheet({ open, onClose, prefilledProjectId, onCreated }: CreateTaskSheetProps) {
  const { createTask } = useTaskStore();
  const { projects } = useProjectStore();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState(prefilledProjectId || '');
  const [assigneeId, setAssigneeId] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>('Medium');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Members for assignee combobox
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const memberRef = useRef<HTMLDivElement>(null);

  // Active (non-archived) projects only
  const activeProjects = projects.filter(p => !p.archivedAt);

  // Load members
  useEffect(() => {
    if (open) {
      loadMembers();
    }
  }, [open]);

  // Reset form when opening
  useEffect(() => {
    if (open) {
      setTitle('');
      setDescription('');
      setProjectId(prefilledProjectId || '');
      setAssigneeId('');
      setPriority('Medium');
      setDueDate('');
      setErrors({});
      setMemberSearch('');
    }
  }, [open, prefilledProjectId]);

  // Click outside member dropdown
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (memberRef.current && !memberRef.current.contains(e.target as Node)) {
        setShowMemberDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const loadMembers = async () => {
    try {
      const res = await apiClient.get('/workspaces/members');
      setMembers(res.data?.data?.members ?? []);
    } catch {
      setMembers([]);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Title không được để trống';
    if (title.length > 200) newErrors.title = 'Title không được vượt quá 200 ký tự';
    if (description.length > 5000) newErrors.description = 'Mô tả không được vượt quá 5000 ký tự';
    if (!projectId) newErrors.projectId = 'Vui lòng chọn dự án';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const data: CreateTaskData = {
        title: title.trim(),
        project_id: projectId,
        description: description.trim() || null,
        assignee_id: assigneeId || null,
        priority,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
      };

      await createTask(data);
      toast.success('Task đã được tạo thành công');
      onCreated?.();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Có lỗi xảy ra';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };



  const selectedMember = members.find(m => m.userId === assigneeId);

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          zIndex: 400,
          animation: 'fadeIn 0.2s ease',
        }}
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          maxWidth: '480px',
          background: 'white',
          zIndex: 401,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
          animation: 'slideInRight 0.25s ease',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            Tạo task mới
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          {/* Title */}
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px', display: 'block' }}
            >
              Tiêu đề <span style={{ color: 'var(--destructive)' }}>*</span>
            </label>
            <input
              id="task-title"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề task..."
              maxLength={200}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1px solid ${errors.title ? 'var(--destructive)' : 'var(--border)'}`,
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.15s',
                boxSizing: 'border-box',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = errors.title ? 'var(--destructive)' : 'var(--primary)')}
              onBlur={e => (e.currentTarget.style.borderColor = errors.title ? 'var(--destructive)' : 'var(--border)')}
            />
            {errors.title && (
              <p style={{ fontSize: '12px', color: 'var(--destructive)', marginTop: '4px' }}>{errors.title}</p>
            )}
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'right' }}>
              {title.length}/200
            </p>
          </div>

          {/* Project select */}
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px', display: 'block' }}
            >
              Dự án <span style={{ color: 'var(--destructive)' }}>*</span>
            </label>
            <select
              id="task-project"
              value={projectId}
              onChange={e => setProjectId(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1px solid ${errors.projectId ? 'var(--destructive)' : 'var(--border)'}`,
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                background: 'white',
                cursor: 'pointer',
                boxSizing: 'border-box',
                color: projectId ? 'var(--text-primary)' : 'var(--text-muted)',
              }}
            >
              <option value="">Chọn dự án...</option>
              {activeProjects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            {errors.projectId && (
              <p style={{ fontSize: '12px', color: 'var(--destructive)', marginTop: '4px' }}>{errors.projectId}</p>
            )}
          </div>

          {/* Assignee combobox */}
          <div style={{ marginBottom: '20px' }} ref={memberRef}>
            <label
              style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px', display: 'block' }}
            >
              Người thực hiện
            </label>
            <div style={{ position: 'relative' }}>
              <button
                id="task-assignee"
                type="button"
                onClick={() => setShowMemberDropdown(v => !v)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  color: selectedMember ? 'var(--text-primary)' : 'var(--text-muted)',
                  boxSizing: 'border-box',
                }}
              >
                <span>{selectedMember ? selectedMember.name : 'Chọn người thực hiện...'}</span>
                <ChevronDown size={14} />
              </button>

              {showMemberDropdown && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    right: 0,
                    background: 'white',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    zIndex: 10,
                    maxHeight: '200px',
                    overflow: 'auto',
                  }}
                >
                  {/* Unassign option */}
                  <button
                    onClick={() => {
                      setAssigneeId('');
                      setShowMemberDropdown(false);
                      setMemberSearch('');
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: 'none',
                      background: !assigneeId ? 'hsl(221 83% 53% / 0.06)' : 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: '13px',
                      color: 'var(--text-muted)',
                      fontStyle: 'italic',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface)')}
                    onMouseLeave={e => (e.currentTarget.style.background = !assigneeId ? 'hsl(221 83% 53% / 0.06)' : 'none')}
                  >
                    Không assign
                  </button>

                  {/* Member list */}
                  {members.map(m => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setAssigneeId(m.userId);
                        setShowMemberDropdown(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: 'none',
                        background: assigneeId === m.userId ? 'hsl(221 83% 53% / 0.06)' : 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface)')}
                      onMouseLeave={e => (e.currentTarget.style.background = assigneeId === m.userId ? 'hsl(221 83% 53% / 0.06)' : 'none')}
                    >
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: 'var(--primary)',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          fontWeight: 600,
                          flexShrink: 0,
                        }}
                      >
                        {m.name
                          .split(' ')
                          .map((w: string) => w[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>
                          {m.name}
                        </p>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                          {m.email}
                        </p>
                      </div>
                    </button>
                  ))}

                </div>
              )}
            </div>
          </div>

          {/* Priority + Due date row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            {/* Priority */}
            <div>
              <label
                style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px', display: 'block' }}
              >
                Mức ưu tiên
              </label>
              <select
                id="task-priority"
                value={priority}
                onChange={e => setPriority(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  background: 'white',
                  cursor: 'pointer',
                  boxSizing: 'border-box',
                }}
              >
                {PRIORITIES.map(p => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Due date */}
            <div>
              <label
                style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px', display: 'block' }}
              >
                Ngày hết hạn
              </label>
              <input
                id="task-due-date"
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Description (at the bottom per design) */}
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px', display: 'block' }}
            >
              Mô tả
            </label>
            <textarea
              id="task-description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Mô tả chi tiết (tùy chọn)"
              maxLength={5000}
              rows={5}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1px solid ${errors.description ? 'var(--destructive)' : 'var(--border)'}`,
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
                lineHeight: 1.6,
                minHeight: '100px',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--primary)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            />
            {errors.description && (
              <p style={{ fontSize: '12px', color: 'var(--destructive)', marginTop: '4px' }}>{errors.description}</p>
            )}
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'right' }}>
              {description.length}/5000
            </p>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px',
          }}
        >
          <button
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              padding: '10px 20px',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              background: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              color: 'var(--text-primary)',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'white')}
          >
            Hủy
          </button>
          <button
            id="submit-create-task"
            onClick={handleSubmit}
            disabled={isSubmitting}
            style={{
              padding: '10px 24px',
              border: 'none',
              borderRadius: '8px',
              background: 'var(--primary)',
              color: 'white',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: isSubmitting ? 0.7 : 1,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => !isSubmitting && (e.currentTarget.style.background = 'var(--primary-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--primary)')}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Đang tạo...
              </>
            ) : (
              'Tạo task'
            )}
          </button>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
