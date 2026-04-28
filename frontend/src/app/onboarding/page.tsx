'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Zap, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import apiClient from '@/lib/api-client';

const workspaceSchema = z.object({
  name: z.string().min(1, 'Tên workspace không được để trống').max(100, 'Tên workspace tối đa 100 ký tự'),
});
type WorkspaceForm = z.infer<typeof workspaceSchema>;

export default function OnboardingPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<WorkspaceForm>({
    resolver: zodResolver(workspaceSchema),
  });

  useEffect(() => {
    if (!isAuthenticated) router.replace('/login');
  }, [isAuthenticated, router]);

  const onSubmit = async (data: WorkspaceForm) => {
    setError('');
    try {
      const res = await apiClient.post('/workspaces', data);
      if (res.data.success) {
        const ws = res.data.data.workspace;
        localStorage.setItem('currentWorkspaceId', ws.id);
        toast.success('Workspace đã được tạo!');
        router.push('/app/my-tasks');
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data: { error?: string } } };
      setError(axiosErr.response?.data?.error || 'Có lỗi xảy ra. Thử lại?');
    }
  };

  return (
    <div className="auth-layout">
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Zap size={28} color="var(--primary)" fill="var(--primary)" />
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--primary)', marginTop: '8px' }}>TaskFlow</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Tạo workspace đầu tiên của bạn
          </p>
        </div>

        <div className="auth-card">
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>Đặt tên workspace</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px' }}>
            Workspace là nơi bạn và team cùng làm việc. Bạn có thể tạo thêm sau.
          </p>

          {error && (
            <p style={{ color: 'var(--destructive)', background: 'var(--destructive-bg)', padding: '10px', borderRadius: '6px', fontSize: '13px', marginBottom: '16px' }}>
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
                Tên workspace <span style={{ color: 'var(--destructive)' }}>*</span>
              </label>
              <input
                {...register('name')}
                type="text"
                placeholder="Nhập tên workspace"
                autoFocus
                style={{
                  width: '100%', height: '40px', padding: '0 12px',
                  border: `1px solid ${errors.name ? 'var(--destructive)' : 'var(--border)'}`,
                  borderRadius: '6px', fontSize: '14px', outline: 'none',
                }}
              />
              {errors.name && <p style={{ color: 'var(--destructive)', fontSize: '12px', marginTop: '4px' }}>{errors.name.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%', height: '40px', background: 'var(--primary)', color: 'white',
                border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 600,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Đang tạo...</> : 'Tạo workspace'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
