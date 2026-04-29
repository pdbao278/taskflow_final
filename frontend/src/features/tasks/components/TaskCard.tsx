'use client';

import { Calendar, AlertTriangle, CalendarX2 } from 'lucide-react';
import type { Task } from '../stores/task.store';

interface TaskCardProps {
  task: Task;
  onClick?: (task: Task) => void;
  dragDisabled?: boolean;
  variant?: 'kanban' | 'list-row';
}

const PRIORITY_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  Low: { bg: 'hsl(210 40% 96%)', color: 'hsl(215 16% 47%)', label: 'Low' },
  Medium: { bg: 'hsl(38 92% 50% / 0.12)', color: 'hsl(38 92% 40%)', label: 'Medium' },
  High: { bg: 'hsl(48 96% 95%)', color: 'hsl(38 92% 50%)', label: 'High' },
  Urgent: { bg: 'hsl(0 86% 97%)', color: 'hsl(0 84% 60%)', label: 'Urgent' },
};

const STATUS_STYLES: Record<string, { dot: string; bg: string; color: string; label: string }> = {
  ToDo: { dot: 'var(--status-todo)', bg: 'hsl(215 16% 47% / 0.1)', color: 'var(--status-todo)', label: 'To Do' },
  InProgress: { dot: 'var(--status-in-progress)', bg: 'hsl(221 83% 53% / 0.1)', color: 'var(--status-in-progress)', label: 'In Progress' },
  InReview: { dot: 'var(--status-in-review)', bg: 'hsl(38 92% 50% / 0.1)', color: 'var(--status-in-review)', label: 'In Review' },
  Done: { dot: 'var(--status-done)', bg: 'hsl(142 71% 45% / 0.1)', color: 'var(--status-done)', label: 'Done' },
};

function formatDueDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
}

export default function TaskCard({ task, onClick, dragDisabled, variant = 'kanban' }: TaskCardProps) {
  const priority = PRIORITY_STYLES[task.priority] ?? PRIORITY_STYLES.Medium;
  const status = STATUS_STYLES[task.status] ?? STATUS_STYLES.ToDo;
  const isOverdue = task.isOverdue && task.status !== 'Done';
  
  const isRemovedUser = task.isAssigneeRemoved;

  if (variant === 'list-row') {
    return (
      <div
        onClick={() => onClick?.(task)}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          padding: '12px 16px',
          background: 'white',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          borderLeft: isOverdue ? '4px solid var(--destructive)' : '4px solid transparent',
          cursor: 'pointer',
          transition: 'background 0.15s, box-shadow 0.15s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--surface-hover)';
          e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'white';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {/* Row 1: Project & Due Date */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '16px' }}>
          {/* Project */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {task.project ? (
              <>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: task.project.color }} />
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>{task.project.name}</span>
              </>
            ) : (
              <span style={{ fontSize: '12px', color: 'transparent' }}>-</span>
            )}
          </div>
          
          {/* Due date */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: isOverdue ? 500 : 400, color: isOverdue ? 'var(--destructive)' : 'var(--text-muted)' }}>
            <Calendar size={12} />
            {task.dueDate ? formatDueDate(task.dueDate) : ''}
          </div>
        </div>

        {/* Row 2: Title & Badges */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          {/* Title */}
          <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', wordBreak: 'break-word', flex: 1 }}>
            {task.title}
          </span>

          {/* Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {/* StatusBadge */}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, padding: '2px 8px', borderRadius: '9999px', background: status.bg, color: status.color }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: status.dot, flexShrink: 0 }} />
              {status.label}
            </span>

            {/* PriorityBadge */}
            <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: '12px', fontWeight: 600, padding: '2px 8px', borderRadius: '9999px', background: priority.bg, color: priority.color }}>
              {priority.label}
            </span>

            {/* OverdueBadge */}
            {isOverdue && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, padding: '2px 8px', borderRadius: '9999px', background: 'hsl(0 84% 60% / 0.1)', color: 'var(--destructive)' }}>
                <CalendarX2 size={12} />
                Overdue
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // kanban variant
  return (
    <div
      onClick={() => onClick?.(task)}
      style={{
        background: 'white',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${isOverdue ? 'var(--destructive)' : status.dot}`,
        borderRadius: '8px',
        padding: '16px',
        cursor: dragDisabled ? 'not-allowed' : 'pointer',
        transition: 'box-shadow 0.15s, transform 0.1s',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Row 1: Project label */}
      {task.project && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: task.project.color,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: '11px',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--text-muted)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {task.project.name}
          </span>
        </div>
      )}

      {/* Row 2: Title */}
      <p
        style={{
          fontSize: '16px',
          fontWeight: 600,
          color: 'var(--text-primary)',
          margin: '0 0 4px',
          lineHeight: 1.4,
          wordBreak: 'break-word',
        }}
      >
        {task.title}
      </p>

      {/* Row 3: StatusBadge + PriorityBadge + OverdueBadge */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '4px' }}>
        {/* StatusBadge */}
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '12px',
            fontWeight: 600,
            padding: '3px 10px',
            borderRadius: '9999px',
            background: status.bg,
            color: status.color,
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: status.dot,
              flexShrink: 0,
            }}
          />
          {status.label}
        </span>

        {/* PriorityBadge */}
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            fontSize: '12px',
            fontWeight: 600,
            padding: '3px 10px',
            borderRadius: '9999px',
            background: priority.bg,
            color: priority.color,
          }}
        >
          {priority.label}
        </span>

        {/* OverdueBadge */}
        {isOverdue && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              fontWeight: 600,
              padding: '3px 10px',
              borderRadius: '9999px',
              background: 'hsl(0 84% 60% / 0.1)',
              color: 'var(--destructive)',
            }}
          >
            <AlertTriangle size={12} />
            Overdue
          </span>
        )}
      </div>

      {/* Row 4: Assignee (left) + Due date (right) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Assignee */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {task.assignee ? (
          isRemovedUser ? (
            <>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'var(--muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  flexShrink: 0,
                }}
              >
                RU
              </div>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500, fontStyle: 'italic' }}>
                [Removed User]
              </span>
            </>
          ) : (
            <>
              <div
                style={{
                  width: '28px',
                  height: '28px',
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
                {task.assignee.name
                  .split(' ')
                  .map(w => w[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                {task.assignee.name}
              </span>
            </>
          )
        ) : (
            <>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'var(--muted)',
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Chưa assign
              </span>
            </>
          )}
        </div>

        {/* Due date */}
        {task.dueDate && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '13px',
              fontWeight: isOverdue ? 500 : 400,
              color: isOverdue ? 'var(--destructive)' : 'var(--text-muted)',
            }}
          >
            <Calendar size={14} />
            {formatDueDate(task.dueDate)}
          </div>
        )}
      </div>
    </div>
  );
}
