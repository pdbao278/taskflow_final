'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ClipboardList, Users, FolderOpen, BarChart2, Settings, Trash2,
  Plus, ChevronDown, Check, Grid3x3,
} from 'lucide-react';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { useWorkspaceStore, MemberRole } from '@/features/workspace/stores/workspace.store';
import toast from 'react-hot-toast';

interface NavItem {
  href: string;
  icon: React.ReactNode;
  label: string;
  roles: MemberRole[];
}

const NAV_ITEMS: NavItem[] = [
  { href: '/app/my-tasks', icon: <ClipboardList size={18} />, label: 'Công việc của tôi', roles: ['Admin', 'Manager', 'Member'] },
  { href: '/app/team', icon: <Users size={18} />, label: 'Kanban Team', roles: ['Admin', 'Manager'] },
  { href: '/app/projects', icon: <FolderOpen size={18} />, label: 'Dự án', roles: ['Admin', 'Manager', 'Member'] },
  { href: '/app/reports', icon: <BarChart2 size={18} />, label: 'Báo cáo', roles: ['Admin', 'Manager'] },
];

const BOTTOM_ITEMS: NavItem[] = [
  { href: '/app/settings', icon: <Settings size={18} />, label: 'Cài đặt', roles: ['Admin'] },
  { href: '/app/settings/members', icon: <Users size={18} />, label: 'Thành viên', roles: ['Admin'] },
  { href: '/app/trash', icon: <Trash2 size={18} />, label: 'Thùng rác', roles: ['Admin'] },
];

function getRoleBadgeStyle(role: MemberRole): React.CSSProperties {
  const styles: Record<MemberRole, React.CSSProperties> = {
    Admin: {
      background: 'hsl(221 83% 53% / 0.12)',
      color: 'hsl(221 83% 53%)',
    },
    Manager: {
      background: 'hsl(38 92% 50% / 0.12)',
      color: 'hsl(38 92% 40%)',
    },
    Member: {
      background: 'hsl(142 71% 45% / 0.12)',
      color: 'hsl(142 71% 35%)',
    },
  };
  return {
    ...styles[role],
    fontSize: '10px',
    fontWeight: 600,
    padding: '1px 6px',
    borderRadius: '4px',
    flexShrink: 0,
  };
}

export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();
  const { workspaces, currentWorkspaceId, currentRole, setCurrentWorkspace, loadWorkspaces } = useWorkspaceStore();
  const [wsDropdownOpen, setWsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load workspaces on mount
  useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setWsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const userRole: MemberRole = (currentRole as MemberRole) ?? 'Member';
  const currentWs = workspaces.find(w => w.id === currentWorkspaceId);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const handleSwitchWorkspace = (wsId: string) => {
    const ws = workspaces.find(w => w.id === wsId);
    setCurrentWorkspace(wsId);
    setWsDropdownOpen(false);
    loadWorkspaces();
    if (ws) {
      toast.success(`Đã chuyển sang workspace "${ws.name}"`, { duration: 2500 });
    }
    router.push('/app/my-tasks');
  };

  return (
    <aside className="app-sidebar">
      {/* Workspace Switcher */}
      <div ref={dropdownRef} style={{ padding: '12px', borderBottom: '1px solid var(--border)', position: 'relative' }}>
        <button
          id="workspace-switcher"
          onClick={() => setWsDropdownOpen(v => !v)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 10px', borderRadius: '8px', border: '1px solid transparent',
            background: wsDropdownOpen ? 'var(--surface)' : 'none', cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface)')}
          onMouseLeave={e => !wsDropdownOpen && (e.currentTarget.style.background = 'none')}
          aria-haspopup="true"
          aria-expanded={wsDropdownOpen}
        >
          <Grid3x3 size={16} color="var(--text-secondary)" />
          <span style={{
            flex: 1, fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)',
            textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {currentWs?.name ?? 'Chọn workspace...'}
          </span>
          <ChevronDown size={14} color="var(--text-muted)" style={{
            transform: wsDropdownOpen ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 0.2s',
            flexShrink: 0,
          }} />
        </button>

        {/* Workspace Dropdown — floats outside, does not push nav items */}
        {wsDropdownOpen && (
          <div
            id="workspace-dropdown"
            role="menu"
            style={{
              position: 'absolute', top: 'calc(100% + 4px)', left: '8px', right: '8px',
              background: 'white', border: '1px solid var(--border)',
              borderRadius: '10px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
              zIndex: 50, overflow: 'hidden',
            }}
          >
            <div style={{ padding: '6px' }}>
              {workspaces.map(ws => {
                const isActiveWs = ws.id === currentWorkspaceId;
                return (
                  <button
                    key={ws.id}
                    role="menuitem"
                    onClick={() => handleSwitchWorkspace(ws.id)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '8px 10px', borderRadius: '6px',
                      background: isActiveWs ? 'hsl(221 83% 53% / 0.08)' : 'none',
                      border: 'none', cursor: 'pointer', textAlign: 'left',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => !isActiveWs && (e.currentTarget.style.background = 'var(--surface)')}
                    onMouseLeave={e => !isActiveWs && (e.currentTarget.style.background = 'none')}
                  >
                    {isActiveWs
                      ? <Check size={14} color="var(--primary)" style={{ flexShrink: 0 }} />
                      : <span style={{ width: '14px', flexShrink: 0 }} />
                    }
                    <span style={{
                      flex: 1, fontSize: '13px', fontWeight: 500,
                      color: isActiveWs ? 'var(--primary)' : 'var(--text-primary)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {ws.name}
                    </span>
                    <span style={getRoleBadgeStyle(ws.role as MemberRole)}>
                      {ws.role === 'Admin' ? 'Admin' : ws.role === 'Manager' ? 'Quản lý' : 'TV'}
                    </span>
                  </button>
                );
              })}
            </div>

            <div style={{ borderTop: '1px solid var(--border)', padding: '6px' }}>
              <Link
                href="/onboarding"
                onClick={() => setWsDropdownOpen(false)}
                role="menuitem"
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px',
                  borderRadius: '6px', textDecoration: 'none', color: 'var(--text-primary)',
                  fontSize: '13px', fontWeight: 500,
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                <Plus size={14} />
                Tạo workspace mới
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Create Task Button — Admin/Manager only */}
      {(userRole === 'Admin' || userRole === 'Manager') && (
        <div style={{ padding: '12px 12px 8px' }}>
          <button
            id="create-task-btn"
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              height: '36px', background: 'var(--primary)', color: 'white',
              border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--primary-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--primary)')}
          >
            <Plus size={16} />
            Tạo task
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav style={{ padding: '8px 12px' }}>
        {NAV_ITEMS.filter(item => item.roles.includes(userRole)).map(item => (
          <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '9px 10px', borderRadius: '8px', marginBottom: '2px',
              background: isActive(item.href) ? 'hsl(221 83% 53% / 0.1)' : 'transparent',
              color: isActive(item.href) ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: isActive(item.href) ? 600 : 400,
              fontSize: '14px', transition: 'background 0.15s, color 0.15s', cursor: 'pointer',
            }}
              onMouseEnter={e => !isActive(item.href) && (e.currentTarget.style.background = 'var(--surface)')}
              onMouseLeave={e => !isActive(item.href) && (e.currentTarget.style.background = 'transparent')}
            >
              {item.icon}
              {item.label}
            </div>
          </Link>
        ))}

        {/* Separator + Bottom Items (Admin only) */}
        {BOTTOM_ITEMS.some(item => item.roles.includes(userRole)) && (
          <>
            <div style={{ borderTop: '1px solid var(--border)', margin: '8px 0' }} />
            {BOTTOM_ITEMS.filter(item => item.roles.includes(userRole)).map(item => (
              <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '9px 10px', borderRadius: '8px', marginBottom: '2px',
                  background: isActive(item.href) ? 'hsl(221 83% 53% / 0.1)' : 'transparent',
                  color: isActive(item.href) ? 'var(--primary)' : 'var(--text-secondary)',
                  fontSize: '14px', fontWeight: isActive(item.href) ? 600 : 400,
                  transition: 'background 0.15s', cursor: 'pointer',
                }}
                  onMouseEnter={e => !isActive(item.href) && (e.currentTarget.style.background = 'var(--surface)')}
                  onMouseLeave={e => !isActive(item.href) && (e.currentTarget.style.background = 'transparent')}
                >
                  {item.icon}
                  {item.label}
                </div>
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* Spacer — pushes user block to bottom */}
      <div style={{ flex: 1 }} />

      {/* User info — pinned to bottom */}
      <div style={{ padding: '8px 12px 12px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '8px 10px', borderRadius: '8px',
          background: 'var(--surface)',
        }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%',
            background: 'var(--primary)', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '11px', fontWeight: 600, flexShrink: 0,
          }}>
            {user?.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name}
            </p>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {userRole === 'Admin' ? 'Admin' : userRole === 'Manager' ? 'Quản lý' : 'Thành viên'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
