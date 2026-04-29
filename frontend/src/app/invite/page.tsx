'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Zap, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { useWorkspaceStore } from '@/features/workspace/stores/workspace.store';
import apiClient from '@/lib/api-client';

interface InviteInfo {
  email: string;
  role: string;
  workspaceName: string;
  workspaceId: string;
  hasAccount: boolean;
  expiresAt: string;
}

function InvitePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') ?? '';
  const { user, isAuthenticated, login } = useAuthStore();
  const { loadWorkspaces, setCurrentWorkspace } = useWorkspaceStore();

  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [status, setStatus] = useState<'loading' | 'valid' | 'expired' | 'used' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  // Register form (Case 4: no account)
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [nameError, setNameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMsg('Token không hợp lệ.');
      return;
    }

    apiClient.get(`/invite?token=${token}`)
      .then(res => {
        setInviteInfo(res.data.data);
        setStatus('valid');
      })
      .catch(err => {
        const statusCode = err.response?.status;
        if (statusCode === 410) {
          setStatus('expired');
        } else if (statusCode === 400) {
          setStatus('used');
        } else {
          setStatus('error');
          setErrorMsg(err.response?.data?.error ?? 'Có lỗi xảy ra.');
        }
      });
  }, [token]);

  const handleAccept = async () => {
    setIsSubmitting(true);
    try {
      await apiClient.post('/invite/accept', { token });
      toast.success('Tham gia workspace thành công!');
      await loadWorkspaces();
      if (inviteInfo?.workspaceId) {
        setCurrentWorkspace(inviteInfo.workspaceId);
      }
      router.replace('/app/my-tasks');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg ?? 'Có lỗi xảy ra. Thử lại?');
      setIsSubmitting(false);
    }
  };

  const handleRegisterAndAccept = async () => {
    let valid = true;
    if (!name.trim()) { setNameError('Họ tên không được để trống'); valid = false; }
    if (password.length < 8) { setPasswordError('Mật khẩu phải có ít nhất 8 ký tự'); valid = false; }
    if (!valid) return;

    setIsSubmitting(true);
    try {
      const res = await apiClient.post('/invite/register-and-accept', {
        token, name: name.trim(), password,
      });
      const { token: jwtToken, user: newUser, workspaceId } = res.data.data;
      login(jwtToken, newUser);
      await loadWorkspaces();
      if (workspaceId) setCurrentWorkspace(workspaceId);
      toast.success('Đăng ký thành công! Chào mừng đến TaskFlow.');
      router.replace('/app/my-tasks');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg ?? 'Có lỗi xảy ra. Thử lại?');
      setIsSubmitting(false);
    }
  };

  const ROLE_LABEL: Record<string, string> = { Manager: 'Manager', Member: 'Member' };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader2 size={32} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  // ── Expired / Used / Error ───────────────────────────────────────────────────
  if (status === 'expired' || status === 'used' || status === 'error') {
    return (
      <div style={{ textAlign: 'center', padding: '48px 24px' }}>
        <XCircle size={48} color="var(--destructive)" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
          {status === 'expired' ? 'Link mời đã hết hạn' :
           status === 'used' ? 'Link mời đã được sử dụng' : 'Lỗi'}
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          {status === 'expired'
            ? 'Link mời đã hết hạn. Vui lòng liên hệ Admin để được mời lại.'
            : status === 'used'
            ? 'Link mời này đã được sử dụng rồi.'
            : errorMsg}
        </p>
        <Link href="/login" style={{
          display: 'inline-block', padding: '10px 20px',
          background: 'var(--primary)', color: 'white',
          borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '14px',
        }}>
          Về trang đăng nhập
        </Link>
      </div>
    );
  }

  if (!inviteInfo) return null;

  // ── Case 1: Logged in + correct email ─────────────────────────────────────────
  if (isAuthenticated && user?.email === inviteInfo.email) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 24px', maxWidth: '480px', margin: '0 auto' }}>
        <CheckCircle size={48} color="var(--success)" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
          Bạn được mời tham gia!
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
          Workspace: <strong>{inviteInfo.workspaceName}</strong>
        </p>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Vai trò: <strong>{ROLE_LABEL[inviteInfo.role] ?? inviteInfo.role}</strong>
        </p>
        <button
          id="accept-invite-btn"
          onClick={handleAccept}
          disabled={isSubmitting}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '12px 24px', background: 'var(--primary)', color: 'white',
            border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 600,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            opacity: isSubmitting ? 0.7 : 1,
          }}
        >
          {isSubmitting && <Loader2 size={16} />}
          Chấp nhận lời mời
        </button>
      </div>
    );
  }

  // ── Case 2: Logged in + wrong email ───────────────────────────────────────────
  if (isAuthenticated && user?.email !== inviteInfo.email) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 24px', maxWidth: '480px', margin: '0 auto' }}>
        <AlertCircle size={48} color="var(--warning)" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
          Email không khớp
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
          Link mời này dành cho <strong>{inviteInfo.email}</strong>.
        </p>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Bạn đang đăng nhập với email <strong>{user?.email}</strong>. Vui lòng đăng nhập lại bằng đúng tài khoản.
        </p>
        <Link
          href={`/login?redirect=/invite?token=${token}`}
          style={{
            display: 'inline-block', padding: '10px 20px',
            background: 'var(--primary)', color: 'white',
            borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '14px',
          }}
        >
          Đăng nhập lại
        </Link>
      </div>
    );
  }

  // ── Case 3: Not logged in, has account ────────────────────────────────────────
  if (!isAuthenticated && inviteInfo.hasAccount) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 24px', maxWidth: '480px', margin: '0 auto' }}>
        <CheckCircle size={48} color="var(--primary)" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
          Bạn được mời tham gia TaskFlow
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
          Workspace: <strong>{inviteInfo.workspaceName}</strong> — Vai trò: <strong>{ROLE_LABEL[inviteInfo.role] ?? inviteInfo.role}</strong>
        </p>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Vui lòng đăng nhập bằng tài khoản <strong>{inviteInfo.email}</strong> để chấp nhận lời mời.
        </p>
        <Link
          href={`/login?redirect=/invite?token=${token}`}
          style={{
            display: 'inline-block', padding: '12px 24px',
            background: 'var(--primary)', color: 'white',
            borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '15px',
          }}
        >
          Đăng nhập để chấp nhận
        </Link>
      </div>
    );
  }

  // ── Case 4: Not logged in, no account → Register form ─────────────────────────
  return (
    <div style={{ maxWidth: '440px', margin: '0 auto', padding: '48px 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <CheckCircle size={48} color="var(--primary)" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
          Tham gia TaskFlow
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          Tạo tài khoản để tham gia <strong>{inviteInfo.workspaceName}</strong> với vai trò{' '}
          <strong>{ROLE_LABEL[inviteInfo.role] ?? inviteInfo.role}</strong>.
        </p>
      </div>

      <div style={{
        background: 'white', borderRadius: '12px', border: '1px solid var(--border)',
        padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
      }}>
        {/* Email (readonly) */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px', color: 'var(--text-primary)' }}>
            Email
          </label>
          <input
            type="email"
            value={inviteInfo.email}
            readOnly
            style={{
              width: '100%', height: '40px', padding: '0 12px',
              border: '1px solid var(--border)', borderRadius: '8px',
              fontSize: '14px', background: 'var(--muted)', color: 'var(--text-secondary)',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Name */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px', color: 'var(--text-primary)' }}>
            Họ tên <span style={{ color: 'var(--destructive)' }}>*</span>
          </label>
          <input
            id="register-name-input"
            type="text"
            value={name}
            onChange={e => { setName(e.target.value); setNameError(''); }}
            placeholder="Nhập họ tên"
            style={{
              width: '100%', height: '40px', padding: '0 12px',
              border: `1px solid ${nameError ? 'var(--destructive)' : 'var(--border)'}`,
              borderRadius: '8px', fontSize: '14px', background: 'white',
              color: 'var(--text-primary)', boxSizing: 'border-box', outline: 'none',
            }}
          />
          {nameError && <p style={{ fontSize: '12px', color: 'var(--destructive)', marginTop: '4px' }}>{nameError}</p>}
        </div>

        {/* Password */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px', color: 'var(--text-primary)' }}>
            Mật khẩu <span style={{ color: 'var(--destructive)' }}>*</span>
          </label>
          <input
            id="register-password-input"
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setPasswordError(''); }}
            placeholder="Tạo mật khẩu (ít nhất 8 ký tự)"
            style={{
              width: '100%', height: '40px', padding: '0 12px',
              border: `1px solid ${passwordError ? 'var(--destructive)' : 'var(--border)'}`,
              borderRadius: '8px', fontSize: '14px', background: 'white',
              color: 'var(--text-primary)', boxSizing: 'border-box', outline: 'none',
            }}
          />
          {passwordError && <p style={{ fontSize: '12px', color: 'var(--destructive)', marginTop: '4px' }}>{passwordError}</p>}
        </div>

        <button
          id="register-and-accept-btn"
          onClick={handleRegisterAndAccept}
          disabled={isSubmitting}
          style={{
            width: '100%', height: '42px',
            background: isSubmitting ? 'var(--muted)' : 'var(--primary)',
            color: isSubmitting ? 'var(--muted-foreground)' : 'white',
            border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 600,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}
        >
          {isSubmitting && <Loader2 size={16} />}
          {isSubmitting ? 'Đang xử lý...' : 'Tạo tài khoản & Tham gia'}
        </button>
      </div>
    </div>
  );
}

export default function InvitePage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)', display: 'flex', flexDirection: 'column' }}>
      {/* Minimal header */}
      <header style={{
        height: '56px', background: 'white', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', padding: '0 24px', gap: '8px',
      }}>
        <Zap size={22} color="var(--primary)" fill="var(--primary)" />
        <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--primary)' }}>TaskFlow</span>
      </header>

      <main style={{ flex: 1, padding: '24px' }}>
        <Suspense fallback={
          <div style={{ textAlign: 'center', padding: '80px' }}>
            <Loader2 size={32} color="var(--primary)" style={{ margin: '0 auto' }} />
          </div>
        }>
          <InvitePageContent />
        </Suspense>
      </main>
    </div>
  );
}
