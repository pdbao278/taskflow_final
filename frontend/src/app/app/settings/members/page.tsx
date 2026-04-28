'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Users, UserMinus, Send, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { useWorkspaceStore, workspaceApi } from '@/features/workspace/stores/workspace.store';

interface Member {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Member';
  joinedAt: string;
}

interface PendingInvite {
  id: string;
  email: string;
  role: 'Manager' | 'Member';
  expiresAt: string;
  createdAt: string;
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function getAvatarColor(id: string): string {
  const colors = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed', '#db2777'];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, React.CSSProperties> = {
    Admin: { background: 'hsl(221 83% 53% / 0.12)', color: 'hsl(221 83% 53%)' },
    Manager: { background: 'hsl(38 92% 50% / 0.12)', color: 'hsl(38 92% 40%)' },
    Member: { background: 'hsl(142 71% 45% / 0.12)', color: 'hsl(142 71% 35%)' },
  };
  const labels: Record<string, string> = { Admin: 'Admin', Manager: 'Quản lý', Member: 'Thành viên' };
  return (
    <span style={{
      ...styles[role],
      fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px',
    }}>
      {labels[role] ?? role}
    </span>
  );
}

function PendingBadge() {
  return (
    <span style={{
      background: 'hsl(38 92% 50% / 0.12)', color: 'hsl(38 92% 40%)',
      fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px',
    }}>
      ⏳ Pending
    </span>
  );
}

function CountdownTimer({ expiresAt }: { expiresAt: string }) {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining('Đã hết hạn');
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const isExpired = remaining === 'Đã hết hạn';

  return (
    <span style={{
      fontFamily: 'monospace', fontSize: '12px',
      color: isExpired ? 'hsl(0 84% 60%)' : 'var(--text-secondary)',
      fontWeight: 600,
    }}>
      {remaining}
    </span>
  );
}

export default function MembersPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { currentWorkspaceId, currentRole, isLoading: isStoreLoading, loadWorkspaces } = useWorkspaceStore();

  // --- ALL HOOKS MUST BE CALLED UNCONDITIONALLY ---
  const [mounted, setMounted] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Invite form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'Manager' | 'Member'>('Member');
  const [inviteEmailError, setInviteEmailError] = useState('');
  const [isSendingInvite, setIsSendingInvite] = useState(false);

  // Delete confirm
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Ensure workspace store is populated (may be cached from sidebar)
    loadWorkspaces();
  }, [loadWorkspaces]);


  const loadMembers = useCallback(async () => {
    if (!currentWorkspaceId) return;
    setIsLoading(true);
    try {
      const res = await workspaceApi.getMembers();
      setMembers(res.data.members ?? []);
      setPendingInvites(res.data.pendingInvites ?? []);
    } catch {
      toast.error('Không thể tải danh sách thành viên.');
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspaceId]);

  useEffect(() => {
    if (mounted && currentRole === 'Admin') {
      loadMembers();
    }
  }, [mounted, currentRole, loadMembers]);

  // RBAC redirect — only after store has loaded
  useEffect(() => {
    if (mounted && !isStoreLoading && currentRole !== null && currentRole !== 'Admin') {
      router.replace('/app/my-tasks');
    }
  }, [mounted, isStoreLoading, currentRole, router]);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      setInviteEmailError('Email không được để trống');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail.trim())) {
      setInviteEmailError('Email không hợp lệ');
      return;
    }
    setInviteEmailError('');
    setIsSendingInvite(true);
    try {
      const res = await workspaceApi.invite(inviteEmail.trim(), inviteRole);
      toast.success(res.data?.message ?? 'Đã gửi lời mời thành công');
      setInviteEmail('');
      setInviteRole('Member');
      await loadMembers();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg ?? 'Có lỗi xảy ra. Thử lại?');
    } finally {
      setIsSendingInvite(false);
    }
  };

  const handleChangeRole = async (memberId: string, newRole: 'Manager' | 'Member') => {
    try {
      await workspaceApi.changeRole(memberId, newRole);
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m));
      toast.success('Đã cập nhật vai trò thành công');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg ?? 'Có lỗi xảy ra. Thử lại?');
    }
  };

  const confirmDelete = (member: Member) => {
    setMemberToDelete(member);
    setIsConfirmDeleteOpen(true);
  };

  const handleDeleteMember = async () => {
    if (!memberToDelete) return;
    setDeletingMemberId(memberToDelete.id);
    try {
      await workspaceApi.removeMember(memberToDelete.id);
      setMembers(prev => prev.filter(m => m.id !== memberToDelete.id));
      toast.success(`Đã xóa ${memberToDelete.name} khỏi workspace.`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg ?? 'Có lỗi xảy ra. Thử lại?');
    } finally {
      setDeletingMemberId(null);
      setIsConfirmDeleteOpen(false);
      setMemberToDelete(null);
    }
  };

  const isSelf = (userId: string) => userId === user?.id;

  // Show nothing while not mounted yet (avoids SSR mismatch)
  if (!mounted) return null;

  // If still loading or role is null, show loading spinner
  if (isStoreLoading || currentRole === null) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px' }}>
        <Loader2 size={24} color="var(--primary)" />
      </div>
    );
  }

  // If not admin, render nothing (redirect via useEffect above)
  if (currentRole !== 'Admin') return null;

  return (
    <div style={{ maxWidth: '800px' }}>
      {/* Page Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
        <Users size={24} color="var(--primary)" />
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>
          Quản lý thành viên
        </h1>
      </div>

      {/* Invite Section */}
      <div style={{
        background: 'white', borderRadius: '12px', border: '1px solid var(--border)',
        padding: '24px', marginBottom: '24px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      }}>
        <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>
          Mời thành viên mới
        </h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <input
              id="invite-email-input"
              type="email"
              value={inviteEmail}
              onChange={e => { setInviteEmail(e.target.value); setInviteEmailError(''); }}
              placeholder="Nhập email người muốn mời"
              style={{
                width: '100%', height: '40px', padding: '0 12px',
                border: `1px solid ${inviteEmailError ? 'hsl(0 84% 60%)' : 'var(--border)'}`,
                borderRadius: '8px', fontSize: '14px', outline: 'none',
                background: 'white', color: 'var(--text-primary)', boxSizing: 'border-box',
              }}
            />
            {inviteEmailError && (
              <p style={{ fontSize: '12px', color: 'hsl(0 84% 60%)', marginTop: '4px' }}>
                {inviteEmailError}
              </p>
            )}
          </div>
          <select
            id="invite-role-select"
            value={inviteRole}
            onChange={e => setInviteRole(e.target.value as 'Manager' | 'Member')}
            style={{
              height: '40px', padding: '0 12px', border: '1px solid var(--border)',
              borderRadius: '8px', fontSize: '14px', background: 'white',
              color: 'var(--text-primary)', cursor: 'pointer',
            }}
          >
            <option value="Member">Thành viên</option>
            <option value="Manager">Quản lý</option>
          </select>
          <button
            id="send-invite-btn"
            onClick={handleInvite}
            disabled={isSendingInvite}
            style={{
              height: '40px', padding: '0 16px',
              background: isSendingInvite ? '#e5e7eb' : 'var(--primary)',
              color: isSendingInvite ? '#6b7280' : 'white',
              border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
              cursor: isSendingInvite ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            {isSendingInvite ? <Loader2 size={14} /> : <Send size={14} />}
            {isSendingInvite ? 'Đang gửi...' : 'Gửi lời mời'}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          <Loader2 size={24} style={{ margin: '0 auto 8px', display: 'block' }} />
          Đang tải...
        </div>
      ) : (
        <>
          {/* Active Members Section */}
          <div style={{
            background: 'white', borderRadius: '12px', border: '1px solid var(--border)',
            padding: '24px', marginBottom: '24px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          }}>
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>
              Thành viên ({members.length})
            </h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Tên', 'Email', 'Vai trò', 'Hành động'].map(col => (
                      <th key={col} style={{
                        textAlign: 'left', padding: '8px 12px',
                        fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)',
                        textTransform: 'uppercase', letterSpacing: '0.05em',
                        borderBottom: '1px solid var(--border)',
                      }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {members.map(member => (
                    <tr key={member.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                            background: getAvatarColor(member.userId), color: 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '11px', fontWeight: 600,
                          }}>
                            {getInitials(member.name)}
                          </div>
                          <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
                            {member.name}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {member.email}
                      </td>
                      <td style={{ padding: '12px 12px' }}>
                        {member.role === 'Admin' ? (
                          <RoleBadge role="Admin" />
                        ) : (
                          <select
                            value={member.role}
                            onChange={e => handleChangeRole(member.id, e.target.value as 'Manager' | 'Member')}
                            style={{
                              border: '1px solid var(--border)', borderRadius: '6px',
                              padding: '3px 8px', fontSize: '12px', background: 'white',
                              cursor: 'pointer', color: 'var(--text-primary)',
                            }}
                          >
                            <option value="Manager">Quản lý</option>
                            <option value="Member">Thành viên</option>
                          </select>
                        )}
                      </td>
                      <td style={{ padding: '12px 12px' }}>
                        {isSelf(member.userId) ? (
                          <span title="Không thể xóa Admin đang đăng nhập." style={{ display: 'inline-block' }}>
                            <button
                              disabled
                              style={{
                                width: '32px', height: '32px', borderRadius: '6px',
                                border: '1px solid var(--border)', background: '#f3f4f6',
                                cursor: 'not-allowed', color: '#9ca3af',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                opacity: 0.5,
                              }}
                            >
                              <UserMinus size={14} />
                            </button>
                          </span>
                        ) : (
                          <button
                            onClick={() => confirmDelete(member)}
                            disabled={deletingMemberId === member.id}
                            style={{
                              width: '32px', height: '32px', borderRadius: '6px',
                              border: '1px solid var(--border)', background: 'white',
                              cursor: 'pointer', color: 'hsl(0 84% 60%)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              transition: 'background 0.1s',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'hsl(0 84% 60% / 0.08)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                          >
                            <UserMinus size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pending Invites Section — only if there are pending invites */}
          {pendingInvites.length > 0 && (
            <div style={{
              background: 'white', borderRadius: '12px', border: '1px solid var(--border)',
              padding: '24px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}>
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>
                Lời mời đang chờ ({pendingInvites.length})
              </h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Email', 'Vai trò', 'Trạng thái', 'Còn lại'].map(col => (
                        <th key={col} style={{
                          textAlign: 'left', padding: '8px 12px',
                          fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)',
                          textTransform: 'uppercase', letterSpacing: '0.05em',
                          borderBottom: '1px solid var(--border)',
                        }}>
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pendingInvites.map(invite => (
                      <tr key={invite.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px 12px', fontSize: '13px', color: 'var(--text-primary)' }}>
                          {invite.email}
                        </td>
                        <td style={{ padding: '12px 12px' }}>
                          <RoleBadge role={invite.role} />
                        </td>
                        <td style={{ padding: '12px 12px' }}>
                          <PendingBadge />
                        </td>
                        <td style={{ padding: '12px 12px' }}>
                          <CountdownTimer expiresAt={invite.expiresAt} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete Member Confirm Dialog */}
      {isConfirmDeleteOpen && memberToDelete && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 300,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }}
            onClick={() => !deletingMemberId && setIsConfirmDeleteOpen(false)}
          />
          <div style={{
            position: 'relative', zIndex: 1,
            background: 'white', borderRadius: '12px', padding: '24px',
            width: '480px', maxWidth: '90vw',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)' }}>
              Xóa thành viên
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.6 }}>
              Bạn chắc chắn muốn xóa <strong>{memberToDelete.name}</strong> khỏi workspace?{' '}
              Các task đã assign cho người này sẽ trở thành chưa giao.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setIsConfirmDeleteOpen(false)}
                disabled={!!deletingMemberId}
                style={{
                  height: '38px', padding: '0 16px',
                  border: '1px solid var(--border)', borderRadius: '8px',
                  background: 'white', color: 'var(--text-primary)',
                  fontSize: '14px', fontWeight: 500, cursor: 'pointer',
                }}
              >
                Hủy
              </button>
              <button
                id="confirm-delete-member-btn"
                onClick={handleDeleteMember}
                disabled={!!deletingMemberId}
                style={{
                  height: '38px', padding: '0 16px',
                  border: 'none', borderRadius: '8px',
                  background: 'hsl(0 84% 60%)', color: 'white',
                  fontSize: '14px', fontWeight: 600,
                  cursor: deletingMemberId ? 'not-allowed' : 'pointer',
                  opacity: deletingMemberId ? 0.7 : 1,
                }}
              >
                {deletingMemberId ? 'Đang xóa...' : 'Xóa thành viên'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
