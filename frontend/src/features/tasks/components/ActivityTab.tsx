'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import apiClient from '@/lib/api-client';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ActivityEntry {
  id: string;
  taskId: string;
  userId: string;
  actionType: 'created' | 'field_edited' | 'commented' | 'deleted' | 'restored';
  fieldChanged: string | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
  user: { id: string; name: string };
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const mo = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${hh}:${mm} ${dd}/${mo}/${yyyy}`;
}

/** Translate field name to English label */
function fieldLabel(field: string): string {
  const map: Record<string, string> = {
    title: 'title',
    description: 'description',
    status: 'status',
    priority: 'priority',
    assignee: 'assignee',
    due_date: 'due date',
  };
  return map[field] ?? field;
}

/** Translate status enum values to display labels */
function statusLabel(val: string | null): string {
  if (!val) return '(không có)';
  const map: Record<string, string> = {
    ToDo: 'To Do',
    InProgress: 'In Progress',
    InReview: 'In Review',
    Done: 'Done',
  };
  return map[val] ?? val;
}

/** Format a field value for display — per design-system §7.8 null placeholders */
function formatValue(field: string, val: string | null): string {
  if (val === null) {
    // §7.8: assignee null → "(chưa assign)", due_date null → "(không có)"
    if (field === 'assignee') return '(chưa assign)';
    return '(không có)';
  }
  if (field === 'status') return statusLabel(val);
  if (field === 'due_date') {
    try {
      const d = new Date(val);
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    } catch {
      return val;
    }
  }
  return val;
}

/** Build human-readable description — per design-system §7.8 entry format */
function buildEntryText(entry: ActivityEntry): {
  text: string;
  color?: string;
  icon: string;
} {
  const name = entry.user.name;

  switch (entry.actionType) {
    // §7.8: "Created by [Tên] at [timestamp]"
    case 'created':
      return { text: `Created by ${name}`, icon: '✨' };

    case 'field_edited': {
      if (!entry.fieldChanged) {
        return { text: `${name} edited the task`, icon: '✏️' };
      }
      const label = fieldLabel(entry.fieldChanged);
      const oldVal = formatValue(entry.fieldChanged, entry.oldValue);
      const newVal = formatValue(entry.fieldChanged, entry.newValue);
      // §7.8: status → "changed status from X → Y", others → "updated [field]: old → new"
      if (entry.fieldChanged === 'status') {
        return {
          text: `${name} changed status from ${oldVal} → ${newVal}`,
          icon: '✏️',
        };
      }
      return {
        text: `${name} updated ${label}: ${oldVal} → ${newVal}`,
        icon: '✏️',
      };
    }

    // §7.8: "[Tên] commented at [timestamp]"
    case 'commented':
      return { text: `${name} commented`, icon: '💬' };

    // §7.8: Deleted entry style — text màu --destructive, icon 🗑️
    case 'deleted':
      return {
        text: `${name} deleted the task`,
        color: 'var(--destructive)',
        icon: '🗑️',
      };

    // §7.8: Restored entry style — text màu --success, icon ↩️
    case 'restored':
      return {
        text: `${name} restored the task`,
        color: 'var(--success, hsl(142 71% 40%))',
        icon: '↩️',
      };

    default:
      return { text: `${name} performed an action`, icon: '📝' };
  }
}

// ─── Avatar (xs, 20px) ─────────────────────────────────────────────────────────

function UserAvatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  // Simple deterministic color
  const colors = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#7c3aed', '#db2777'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const color = colors[Math.abs(hash) % colors.length];

  return (
    <div
      style={{
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        background: color,
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '8px',
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

interface ActivityTabProps {
  taskId: string;
}

export default function ActivityTab({ taskId }: ActivityTabProps) {
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!taskId) return;
    setIsLoading(true);
    setError(null);

    apiClient
      .get(`/tasks/${taskId}/activity`)
      .then((res) => {
        setActivities(res.data?.data?.activities ?? []);
      })
      .catch(() => {
        setError('Không thể tải lịch sử hoạt động');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [taskId]);

  // ── Loading ──
  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px',
          color: 'var(--text-muted)',
          gap: '8px',
        }}
      >
        <Loader2 size={16} className="animate-spin" />
        <span style={{ fontSize: '13px' }}>Đang tải...</span>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '24px',
          color: 'var(--destructive)',
          fontSize: '13px',
        }}
      >
        ⚠️ {error}
      </div>
    );
  }

  // ── Empty ──
  if (activities.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 16px',
          gap: '8px',
          color: 'var(--text-muted)',
        }}
      >
        <span style={{ fontSize: '24px' }}>📝</span>
        <span style={{ fontSize: '13px' }}>Chưa có hoạt động nào</span>
      </div>
    );
  }

  // ── List (sorted DESC — newest first from API) ──
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      {activities.map((entry, idx) => {
        const { text, color, icon } = buildEntryText(entry);
        const isLast = idx === activities.length - 1;

        return (
          <div
            key={entry.id}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '10px 12px',
              borderRadius: '8px',
              background: 'var(--surface)',
              marginBottom: isLast ? 0 : '4px',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = 'hsl(var(--border-hsl, 214 32% 91%) / 0.5)')
            }
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--surface)')}
          >
            {/* Avatar */}
            <UserAvatar name={entry.user.name} />

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Icon + Action text */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '5px',
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ fontSize: '12px' }}>{icon}</span>
                <span
                  style={{
                    fontSize: '12.5px',
                    color: color ?? 'var(--text-primary)',
                    lineHeight: 1.45,
                    fontWeight:
                      entry.actionType === 'deleted' || entry.actionType === 'restored' ? 500 : 400,
                    wordBreak: 'break-word',
                  }}
                >
                  {text}
                </span>
              </div>

              {/* Timestamp */}
              <p
                style={{
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  margin: '3px 0 0',
                }}
              >
                {formatTimestamp(entry.createdAt)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
