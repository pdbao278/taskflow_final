'use client';

import { Check, CheckCheck, Bell, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useNotificationStore } from '../store';

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getTypeIcon(type: string): string {
  switch (type) {
    case 'task_assigned':    return '📋';
    case 'comment':          return '💬'; // legacy compat
    case 'comment_added':    return '💬'; // current backend type
    case 'mention':          return '🔔';
    case 'due_soon':         return '⏰';
    case 'member_joined':    return '👋';
    case 'invite_accepted':  return '👋';
    case 'assignee_removed': return '⚠️';
    case 'workspace_deleted': return '🗑️';
    default:                 return '🔔';
  }
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  if (diffHour < 24) return `${diffHour} giờ trước`;
  if (diffDay < 30) return `${diffDay} ngày trước`;
  // Fallback to date
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function NotificationDropdown() {
  const {
    notifications,
    unreadCount,
    isLoading,
    toggleRead,
    markAllRead,
    setDropdownOpen,
  } = useNotificationStore();

  const router = useRouter();

  const handleItemClick = async (notifId: string, referenceId: string | null, isRead: boolean) => {
    // Mark as read if unread
    if (!isRead) {
      await toggleRead(notifId);
    }
    // Navigate to task if referenceId exists, then close dropdown
    if (referenceId) {
      setDropdownOpen(false);
      router.push(`/app/my-tasks?taskId=${referenceId}`);
    }
  };

  return (
    <div
      id="notification-dropdown"
      style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        right: 0,
        width: '380px',
        maxWidth: 'calc(100vw - 24px)',
        background: 'white',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
        zIndex: 50,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px 12px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
          Thông báo
        </span>

        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            id="mark-all-read-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 500,
              color: 'var(--primary)',
              padding: '2px 4px',
              borderRadius: '4px',
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            <CheckCheck size={13.5} />
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      {/* Body */}
      <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
        {isLoading ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '32px',
              color: 'var(--text-muted)',
            }}
          >
            <Loader2 size={20} className="animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          /* Empty state */
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
            <Bell size={28} style={{ opacity: 0.4 }} />
            <span style={{ fontSize: '13px' }}>Không có thông báo mới</span>
          </div>
        ) : (
          notifications.map((notif, idx) => {
            const isRead = notif.readAt !== null;
            const isLast = idx === notifications.length - 1;

            return (
              <div
                key={notif.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '12px 16px',
                  background: isRead ? 'transparent' : 'hsl(221 83% 53% / 0.03)',
                  borderBottom: isLast ? 'none' : '1px solid hsl(var(--border-hsl, 214 32% 91%) / 0.6)',
                  transition: 'background 0.15s',
                  cursor: 'default',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = 'var(--surface)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = isRead ? 'transparent' : 'hsl(221 83% 53% / 0.03)')
                }
              >
                {/* Unread dot */}
                <div style={{ paddingTop: '4px', flexShrink: 0, width: '8px' }}>
                  {!isRead && (
                    <div
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: 'var(--primary)',
                      }}
                    />
                  )}
                </div>

                {/* Icon + content — clickable area */}
                <div
                  style={{ flex: 1, minWidth: 0, cursor: notif.referenceId ? 'pointer' : 'default' }}
                  onClick={() => handleItemClick(notif.id, notif.referenceId, isRead)}
                >
                  {/* Message */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                    <span style={{ fontSize: '14px', flexShrink: 0 }}>
                      {getTypeIcon(notif.type)}
                    </span>
                    <span
                      style={{
                        fontSize: '13px',
                        color: 'var(--text-primary)',
                        fontWeight: isRead ? 400 : 500,
                        lineHeight: 1.45,
                        wordBreak: 'break-word',
                      }}
                    >
                      {notif.message}
                    </span>
                  </div>

                  {/* Timestamp */}
                  <p
                    style={{
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      margin: '4px 0 0',
                    }}
                  >
                    {formatRelativeTime(notif.createdAt)}
                  </p>
                </div>

                {/* Toggle read/unread button */}
                <button
                  title={isRead ? 'Đánh dấu chưa đọc' : 'Đánh dấu đã đọc'}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleRead(notif.id);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '2px',
                    borderRadius: '4px',
                    color: isRead ? 'hsl(142 71% 45%)' : 'var(--text-muted)',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'color 0.15s',
                    marginTop: '2px',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = isRead ? 'var(--text-muted)' : 'var(--primary)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = isRead ? 'hsl(142 71% 45%)' : 'var(--text-muted)')
                  }
                >
                  <Check size={15} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
