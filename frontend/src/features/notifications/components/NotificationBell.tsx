'use client';

import { useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { useNotificationStore } from '../store';
import NotificationDropdown from './NotificationDropdown';

export default function NotificationBell() {
  const { unreadCount, isDropdownOpen, toggleDropdown, setDropdownOpen, loadUnreadCount } =
    useNotificationStore();
  const bellRef = useRef<HTMLDivElement>(null);

  // Polling: fetch unread count every 5 seconds — only when authenticated
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return; // no token → don't poll

    loadUnreadCount(); // initial load
    const interval = setInterval(() => {
      // Re-check token on each tick — stop if session expired
      const currentToken = localStorage.getItem('token');
      if (!currentToken) {
        clearInterval(interval);
        return;
      }
      loadUnreadCount();
    }, 5000);
    return () => clearInterval(interval);
  }, [loadUnreadCount]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen, setDropdownOpen]);

  const displayCount = unreadCount > 99 ? '99+' : unreadCount;

  return (
    <div ref={bellRef} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        id="notification-bell-btn"
        onClick={toggleDropdown}
        aria-label={`Thông báo${unreadCount > 0 ? ` (${displayCount} chưa đọc)` : ''}`}
        style={{
          position: 'relative',
          background: isDropdownOpen ? 'var(--surface)' : 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '6px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isDropdownOpen ? 'var(--primary)' : 'var(--text-muted)',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          if (!isDropdownOpen) {
            e.currentTarget.style.background = 'var(--surface)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isDropdownOpen) {
            e.currentTarget.style.background = 'none';
            e.currentTarget.style.color = 'var(--text-muted)';
          }
        }}
      >
        <Bell size={20} />

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              minWidth: unreadCount > 99 ? '20px' : '16px',
              height: '16px',
              borderRadius: '9999px',
              background: 'hsl(0 84% 60%)',
              color: 'white',
              fontSize: '10px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 3px',
              lineHeight: 1,
              border: '1.5px solid white',
            }}
          >
            {displayCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isDropdownOpen && <NotificationDropdown />}
    </div>
  );
}
