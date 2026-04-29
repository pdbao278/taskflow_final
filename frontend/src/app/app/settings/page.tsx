'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Settings, Save, Trash2, AlertTriangle } from 'lucide-react';
import { useWorkspaceStore, workspaceApi } from '@/features/workspace/stores/workspace.store';

export default function SettingsPage() {
  const router = useRouter();
  const { workspaces, currentWorkspaceId, currentRole, isLoading: isStoreLoading, loadWorkspaces, updateWorkspaceName, removeWorkspace } = useWorkspaceStore();

  const currentWs = workspaces.find(w => w.id === currentWorkspaceId);
  const [wsName, setWsName] = useState('');
  const [nameError, setNameError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const canDelete = workspaces.length > 1;

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadWorkspaces();
  }, [loadWorkspaces]);

  useEffect(() => {
    setWsName(currentWs?.name ?? '');
  }, [currentWs?.name]);

  useEffect(() => {
    if (mounted && !isStoreLoading && currentRole !== null && currentRole !== 'Admin') {
      router.replace('/app/my-tasks');
    }
  }, [mounted, isStoreLoading, currentRole, router]);

  const handleSaveName = async () => {
    if (!wsName.trim()) {
      setNameError('Tên workspace không được để trống');
      return;
    }
    if (wsName.trim().length > 100) {
      setNameError('Tên workspace tối đa 100 ký tự');
      return;
    }
    setNameError('');
    setIsSaving(true);
    try {
      await workspaceApi.rename(currentWorkspaceId!, wsName.trim());
      updateWorkspaceName(currentWorkspaceId!, wsName.trim());
      toast.success('Đã cập nhật tên workspace thành công');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg ?? 'Có lỗi xảy ra. Thử lại?');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!canDelete) return;
    setIsDeleting(true);
    try {
      await workspaceApi.delete(currentWorkspaceId!);
      removeWorkspace(currentWorkspaceId!);
      toast.success(`Workspace "${currentWs?.name}" đã được xóa.`);
      router.replace('/app/my-tasks');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg ?? 'Có lỗi xảy ra. Thử lại?');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (!mounted) return null;
  if (isStoreLoading || currentRole === null) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px' }}>
      <Settings size={24} color="var(--primary)" style={{ opacity: 0.3 }} />
    </div>
  );
  if (currentRole !== 'Admin') return null;


  return (
    <div style={{ padding: '24px 32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
        <Settings size={24} color="var(--primary)" />
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>
          Cài đặt Workspace
        </h1>
      </div>

      {/* Rename Section */}
      <div style={{
        background: 'white', borderRadius: '12px', border: '1px solid var(--border)',
        padding: '24px', marginBottom: '24px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>
          Thông tin Workspace
        </h2>

        <div style={{ marginBottom: '16px' }}>
          <label
            htmlFor="ws-name-input"
            style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '6px' }}
          >
            Tên workspace <span style={{ color: 'var(--destructive)' }}>*</span>
          </label>
          <input
            id="ws-name-input"
            type="text"
            value={wsName}
            onChange={e => { setWsName(e.target.value); setNameError(''); }}
            maxLength={100}
            placeholder="Nhập tên workspace"
            style={{
              width: '100%', height: '40px', padding: '0 12px',
              border: `1px solid ${nameError ? 'var(--destructive)' : 'var(--border)'}`,
              borderRadius: '8px', fontSize: '14px', outline: 'none',
              background: 'white', color: 'var(--text-primary)',
              boxSizing: 'border-box',
            }}
          />
          {nameError && (
            <p style={{ fontSize: '12px', color: 'var(--destructive)', marginTop: '4px' }}>{nameError}</p>
          )}
        </div>

        <button
          id="save-ws-name-btn"
          onClick={handleSaveName}
          disabled={isSaving || wsName.trim() === currentWs?.name}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            height: '38px', padding: '0 16px',
            background: (isSaving || wsName.trim() === currentWs?.name) ? 'var(--muted)' : 'var(--primary)',
            color: (isSaving || wsName.trim() === currentWs?.name) ? 'var(--muted-foreground)' : 'white',
            border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
            cursor: (isSaving || wsName.trim() === currentWs?.name) ? 'not-allowed' : 'pointer',
            transition: 'background 0.15s',
          }}
        >
          <Save size={15} />
          {isSaving ? 'Đang lưu...' : 'Lưu'}
        </button>
      </div>

      {/* Danger Zone: Delete Workspace */}
      <div style={{
        background: 'white', borderRadius: '12px', border: '1px solid var(--destructive, hsl(0 84% 60%))',
        padding: '24px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--destructive)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={16} />
          Vùng nguy hiểm
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Xóa workspace sẽ xóa vĩnh viễn tất cả dự án, task, bình luận và dữ liệu liên quan. Hành động này không thể hoàn tác.
        </p>

        <div style={{ position: 'relative', display: 'inline-block' }}>
          {!canDelete && (
            <div
              title="Bạn phải có ít nhất 1 workspace. Không thể xóa workspace cuối cùng."
              style={{ position: 'absolute', inset: 0, zIndex: 1, cursor: 'not-allowed' }}
            />
          )}
          <button
            id="delete-workspace-btn"
            onClick={() => canDelete && setShowDeleteDialog(true)}
            disabled={!canDelete}
            title={!canDelete ? 'Bạn phải có ít nhất 1 workspace. Không thể xóa workspace cuối cùng.' : undefined}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              height: '38px', padding: '0 16px',
              background: canDelete ? 'var(--destructive-bg)' : 'var(--muted)',
              color: canDelete ? 'var(--destructive)' : 'var(--muted-foreground)',
              border: `1px solid ${canDelete ? 'var(--destructive)' : 'var(--border)'}`,
              borderRadius: '8px', fontSize: '14px', fontWeight: 600,
              cursor: canDelete ? 'pointer' : 'not-allowed',
              opacity: canDelete ? 1 : 0.6,
              transition: 'background 0.15s',
            }}
          >
            <Trash2 size={15} />
            Xóa workspace
          </button>
        </div>

        {!canDelete && (
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
            Bạn phải có ít nhất 1 workspace. Không thể xóa workspace cuối cùng.
          </p>
        )}
      </div>

      {/* Delete Confirm Dialog */}
      {showDeleteDialog && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 300,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }}
            onClick={() => !isDeleting && setShowDeleteDialog(false)}
          />
          <div style={{
            position: 'relative', zIndex: 1,
            background: 'white', borderRadius: '12px', padding: '24px',
            width: '480px', maxWidth: '90vw',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <AlertTriangle size={20} color="var(--destructive)" />
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Xóa workspace
              </h3>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.6 }}>
              Bạn chắc chắn muốn xóa workspace <strong>"{currentWs?.name}"</strong>?{' '}
              Tất cả dữ liệu sẽ bị xóa vĩnh viễn.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDeleteDialog(false)}
                disabled={isDeleting}
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
                id="confirm-delete-ws-btn"
                onClick={handleDeleteWorkspace}
                disabled={isDeleting}
                style={{
                  height: '38px', padding: '0 16px',
                  border: 'none', borderRadius: '8px',
                  background: 'var(--destructive)', color: 'white',
                  fontSize: '14px', fontWeight: 600, cursor: isDeleting ? 'not-allowed' : 'pointer',
                  opacity: isDeleting ? 0.7 : 1,
                }}
              >
                {isDeleting ? 'Đang xóa...' : 'Xóa workspace'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
