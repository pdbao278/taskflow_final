'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, LogOut, Search, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore, authApi } from '@/features/auth/stores/auth.store';
import NotificationBell from '@/features/notifications/components/NotificationBell';
import Link from 'next/link';

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function getAvatarColor(id: string): string {
  const colors = ['#4f46e5','#0891b2','#059669','#d97706','#dc2626','#7c3aed','#db2777'];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export default function AppHeader() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {}
    logout();
    toast.success('Đã đăng xuất.');
    router.push('/login');
  };

  const initials = user ? getInitials(user.name) : '?';
  const avatarColor = user ? getAvatarColor(user.id) : '#6b7280';

  return (
    <header className="app-header">
      {/* Left: Logo + TaskFlow */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Link href="/app/my-tasks" style={{
          display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none',
        }}>
          <Zap size={22} color="var(--primary)" fill="var(--primary)" />
          <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--primary)' }}>TaskFlow</span>
        </Link>
      </div>

      {/* Center: Search box */}
      <div style={{
        width: 'clamp(280px, 36vw, 520px)',
        position: 'relative',
      }}>
        <Search size={15} style={{
          position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
          color: 'var(--text-muted)',
        }} />
        <input
          type="text"
          placeholder="Tìm kiếm task..."
          readOnly
          style={{
            width: '100%', height: '36px', padding: '0 40px 0 32px',
            border: '1px solid var(--border)', borderRadius: '8px',
            fontSize: '13px', background: 'var(--surface)', cursor: 'pointer',
            outline: 'none', color: 'var(--text-muted)',
          }}
        />
        <span style={{
          position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
          fontSize: '11px', color: 'var(--text-muted)', background: 'white',
          border: '1px solid var(--border)', padding: '1px 5px', borderRadius: '4px',
          fontFamily: 'monospace',
        }}>⌘K</span>
      </div>

      {/* Right: Bell + Avatar + Name */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
        <NotificationBell />

        {/* User Dropdown */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            id="user-menu-trigger"
            onClick={() => setDropdownOpen(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '4px 8px', borderRadius: '8px',
              border: '1px solid transparent', background: 'none', cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            {/* Avatar */}
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: avatarColor, color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', fontWeight: 600, flexShrink: 0,
            }}>
              {initials}
            </div>
            {/* Name — hidden on mobile */}
            <span style={{
              fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)',
              maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }} className="hidden sm:inline">
              {user?.name}
            </span>
            <ChevronDown size={14} color="var(--text-muted)" style={{
              transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
            }} />
          </button>

          {/* Dropdown */}
          {dropdownOpen && (
            <div id="user-dropdown" style={{
              position: 'absolute', right: 0, top: 'calc(100% + 4px)',
              background: 'white', border: '1px solid var(--border)',
              borderRadius: '10px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
              minWidth: '220px', zIndex: 'var(--z-dropdown)',
              overflow: 'hidden',
            }}>
              {/* Header block: Name + Email (not a button) */}
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <p style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>{user?.name}</p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{user?.email}</p>
              </div>

              {/* Logout */}
              <div style={{ padding: '4px' }}>
                <button
                  id="logout-btn"
                  onClick={handleLogout}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '9px 12px', borderRadius: '6px', border: 'none', background: 'none',
                    cursor: 'pointer', color: 'var(--destructive)', fontSize: '14px', fontWeight: 500,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--destructive-bg)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  <LogOut size={16} />
                  Đăng xuất
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
