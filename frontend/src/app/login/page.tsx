'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Zap, Loader2, AlertCircle } from 'lucide-react';
import { useAuthStore, authApi } from '@/features/auth/stores/auth.store';

const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(1, 'Mật khẩu không được để trống'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [lockRemaining, setLockRemaining] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  useEffect(() => {
    if (isAuthenticated) router.replace('/app/my-tasks');
    const expired = searchParams.get('expired');
    if (expired) toast.error('Phiên làm việc đã hết hạn.', { icon: 'ℹ️' });
  }, [isAuthenticated, router, searchParams]);

  // Multi-tab logout detection
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'token' && !e.newValue) {
        router.replace('/login');
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [router]);

  // Countdown timer
  useEffect(() => {
    if (lockRemaining > 0) {
      timerRef.current = setTimeout(() => setLockRemaining((prev) => Math.max(0, prev - 1000)), 1000);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [lockRemaining]);

  const formatCountdown = (ms: number) => {
    const totalSec = Math.ceil(ms / 1000);
    const min = Math.floor(totalSec / 60).toString().padStart(2, '0');
    const sec = (totalSec % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
  };

  const onSubmit = async (data: LoginForm) => {
    if (lockRemaining > 0) return;
    setError('');
    try {
      const result = await authApi.login(data);
      if (result.success) {
        login(result.data.token, result.data.user);
        if (result.data.hasWorkspace) {
          router.push('/app/my-tasks');
        } else {
          router.push('/onboarding');
        }
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status: number; data: { error?: string; remainingMs?: number } } };
      if (axiosErr.response?.status === 429) {
        const remaining = axiosErr.response.data.remainingMs || 15 * 60 * 1000;
        setLockRemaining(remaining);
        setError(`Tài khoản bị khóa tạm thời. Thử lại sau ${formatCountdown(remaining)}.`);
      } else {
        setError(axiosErr.response?.data?.error || 'Có lỗi xảy ra. Thử lại?');
      }
    }
  };

  const isLocked = lockRemaining > 0;

  return (
    <div className="auth-layout">
      <div style={{ width: '100%', maxWidth: '400px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={28} color="hsl(221 83% 53%)" fill="hsl(221 83% 53%)" />
            <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--primary)' }}>TaskFlow</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
            Đăng nhập để tiếp tục
          </p>
        </div>

        <div className="auth-card">
          <h1 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px', color: 'var(--text-primary)' }}>
            Đăng nhập
          </h1>

          {/* Lockout / Error Alert */}
          {error && (
            <div style={{
              background: 'var(--destructive-bg)',
              border: '1px solid var(--destructive)',
              borderRadius: '8px',
              padding: '12px 14px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              color: 'hsl(0 84% 40%)',
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <p style={{ fontSize: '13px', fontWeight: 500 }}>{error}</p>
                {isLocked && (
                  <p style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'monospace', marginTop: '4px' }}>
                    {formatCountdown(lockRemaining)}
                  </p>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--text-primary)' }}>
                Email <span style={{ color: 'var(--destructive)' }}>*</span>
              </label>
              <input
                {...register('email')}
                type="email"
                placeholder="Nhập email của bạn"
                disabled={isLocked || isSubmitting}
                style={{
                  width: '100%',
                  height: '40px',
                  padding: '0 12px',
                  border: `1px solid ${errors.email ? 'var(--destructive)' : 'var(--border)'}`,
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  backgroundColor: isLocked ? 'var(--surface)' : 'white',
                }}
              />
              {errors.email && (
                <p style={{ color: 'var(--destructive)', fontSize: '12px', marginTop: '4px' }}>{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--text-primary)' }}>
                Mật khẩu <span style={{ color: 'var(--destructive)' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Nhập mật khẩu"
                  disabled={isLocked || isSubmitting}
                  style={{
                    width: '100%',
                    height: '40px',
                    padding: '0 40px 0 12px',
                    border: `1px solid ${errors.password ? 'var(--destructive)' : 'var(--border)'}`,
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    backgroundColor: isLocked ? 'var(--surface)' : 'white',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  style={{
                    position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p style={{ color: 'var(--destructive)', fontSize: '12px', marginTop: '4px' }}>{errors.password.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLocked || isSubmitting}
              style={{
                width: '100%',
                height: '40px',
                background: isLocked ? 'var(--muted)' : 'var(--primary)',
                color: isLocked ? 'var(--text-muted)' : 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: isLocked || isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'background 0.2s',
                opacity: isLocked ? 0.6 : 1,
              }}
            >
              {isSubmitting ? (
                <><Loader2 size={16} className="animate-spin" /> Đang xử lý...</>
              ) : 'Đăng nhập'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: 'var(--text-muted)' }}>
            Chưa có tài khoản?{' '}
            <Link href="/register" style={{ color: 'var(--primary)', fontWeight: 500, textDecoration: 'none' }}>
              Đăng ký
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
