'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Zap, Loader2, AlertCircle } from 'lucide-react';
import { useAuthStore, authApi } from '@/features/auth/stores/auth.store';

const registerSchema = z.object({
  name: z.string().min(1, 'Họ tên không được để trống').max(100),
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự'),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  useEffect(() => {
    if (isAuthenticated) router.replace('/app/my-tasks');
  }, [isAuthenticated, router]);

  const onSubmit = async (data: RegisterForm) => {
    setError('');
    try {
      const result = await authApi.register(data);
      if (result.success) {
        login(result.data.token, result.data.user);
        router.push('/onboarding');
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data: { error?: string } } };
      const msg = axiosErr.response?.data?.error || 'Có lỗi xảy ra. Thử lại?';
      setError(msg);
    }
  };

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
            Tạo tài khoản miễn phí
          </p>
        </div>

        <div className="auth-card">
          <h1 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px', color: 'var(--text-primary)' }}>
            Đăng ký
          </h1>

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
              <p style={{ fontSize: '13px', fontWeight: 500 }}>
                {error.includes('đã được đăng ký') ? (
                  <>
                    Email này đã được đăng ký. Bạn có muốn{' '}
                    <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>đăng nhập</Link> không?
                  </>
                ) : error}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Name */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
                Họ tên <span style={{ color: 'var(--destructive)' }}>*</span>
              </label>
              <input
                {...register('name')}
                type="text"
                placeholder="Nhập họ tên"
                style={{
                  width: '100%', height: '40px', padding: '0 12px',
                  border: `1px solid ${errors.name ? 'var(--destructive)' : 'var(--border)'}`,
                  borderRadius: '6px', fontSize: '14px', outline: 'none',
                }}
              />
              {errors.name && <p style={{ color: 'var(--destructive)', fontSize: '12px', marginTop: '4px' }}>{errors.name.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
                Email <span style={{ color: 'var(--destructive)' }}>*</span>
              </label>
              <input
                {...register('email')}
                type="email"
                placeholder="Nhập email của bạn"
                style={{
                  width: '100%', height: '40px', padding: '0 12px',
                  border: `1px solid ${errors.email ? 'var(--destructive)' : 'var(--border)'}`,
                  borderRadius: '6px', fontSize: '14px', outline: 'none',
                }}
              />
              {errors.email && <p style={{ color: 'var(--destructive)', fontSize: '12px', marginTop: '4px' }}>{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
                Mật khẩu <span style={{ color: 'var(--destructive)' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Tạo mật khẩu"
                  style={{
                    width: '100%', height: '40px', padding: '0 40px 0 12px',
                    border: `1px solid ${errors.password ? 'var(--destructive)' : 'var(--border)'}`,
                    borderRadius: '6px', fontSize: '14px', outline: 'none',
                  }}
                />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p style={{ color: 'var(--destructive)', fontSize: '12px', marginTop: '4px' }}>{errors.password.message}</p>}
              <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px' }}>Mật khẩu phải có ít nhất 8 ký tự</p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%', height: '40px', background: 'var(--primary)', color: 'white',
                border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 600,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                opacity: isSubmitting ? 0.7 : 1, transition: 'opacity 0.2s',
              }}
            >
              {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Đang xử lý...</> : 'Đăng ký'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: 'var(--text-muted)' }}>
            Đã có tài khoản?{' '}
            <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 500, textDecoration: 'none' }}>Đăng nhập</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
