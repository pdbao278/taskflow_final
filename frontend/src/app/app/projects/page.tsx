'use client';

import { useEffect, useState, useMemo } from 'react';
import { FolderOpen, Plus, AlertTriangle, RefreshCw, Archive } from 'lucide-react';
import { useProjectStore } from '@/features/projects/stores/project.store';
import { useWorkspaceStore } from '@/features/workspace/stores/workspace.store';
import ProjectCard from '@/features/projects/components/ProjectCard';
import CreateProjectDialog from '@/features/projects/components/CreateProjectDialog';

export default function ProjectsPage() {
  const { projects, isLoading, error, loadProjects } = useProjectStore();
  const { currentRole, currentWorkspaceId, workspaces, currentWorkspaceId: wsId } = useWorkspaceStore();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const canCreateProject = currentRole === 'Admin' || currentRole === 'Manager';

  // Get workspace name
  const workspaceName = useMemo(() => {
    return workspaces.find(w => w.id === wsId)?.name ?? '';
  }, [workspaces, wsId]);

  // Split into active and archived
  const activeProjects = useMemo(() => projects.filter(p => !p.archivedAt), [projects]);
  const archivedProjects = useMemo(() => projects.filter(p => p.archivedAt), [projects]);

  useEffect(() => {
    if (currentWorkspaceId) {
      loadProjects();
    }
  }, [currentWorkspaceId, loadProjects]);

  // Loading state
  if (isLoading) {
    return (
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>Dự án</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px' }}>
          Tất cả dự án trong workspace <span style={{ fontWeight: 500 }}>{workspaceName}</span>
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '16px',
          }}
        >
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                background: 'white',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--muted)', animation: 'pulse 2s infinite' }} />
                <div style={{ height: '14px', background: 'var(--muted)', borderRadius: '6px', width: '60%', animation: 'pulse 2s infinite' }} />
              </div>
              <div style={{ height: '12px', background: 'var(--muted)', borderRadius: '6px', marginBottom: '10px', width: '80%', animation: 'pulse 2s infinite' }} />
              <div style={{ height: '6px', background: 'var(--muted)', borderRadius: '9999px', animation: 'pulse 2s infinite' }} />
            </div>
          ))}
        </div>
        <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>Dự án</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px' }}>
          Tất cả dự án trong workspace <span style={{ fontWeight: 500 }}>{workspaceName}</span>
        </p>
        <div style={{ textAlign: 'center', padding: '80px 24px' }}>
          <AlertTriangle size={48} color="var(--destructive)" style={{ marginBottom: '16px' }} />
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Có lỗi xảy ra
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>{error}</p>
          <button
            onClick={() => loadProjects()}
            style={{
              padding: '8px 20px',
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  // All empty state
  if (projects.length === 0) {
    return (
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>Dự án</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px' }}>
          Tất cả dự án trong workspace <span style={{ fontWeight: 500 }}>{workspaceName}</span>
        </p>
        <div style={{ textAlign: 'center', padding: '80px 24px', color: 'var(--text-muted)' }}>
          <FolderOpen size={64} color="var(--border)" style={{ marginBottom: '16px' }} />
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Chưa có dự án
          </h2>
          <p style={{ marginBottom: '16px' }}>Hãy tạo dự án đầu tiên để bắt đầu quản lý công việc.</p>
          {canCreateProject && (
            <button
              onClick={() => setShowCreateDialog(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 20px',
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              <Plus size={16} />
              Tạo dự án
            </button>
          )}
        </div>
        <CreateProjectDialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} />
      </div>
    );
  }

  return (
    <div>
      {/* Page header */}
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>Dự án</h1>
      <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px' }}>
        Tất cả dự án trong workspace <span style={{ fontWeight: 500 }}>{workspaceName}</span>
      </p>

      {/* ── Section 1: Active Projects ────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            {activeProjects.length} dự án đang hoạt động
          </span>
          <button
            onClick={() => loadProjects()}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
            }}
            title="Làm mới"
          >
            <RefreshCw size={14} />
          </button>
        </div>
        {canCreateProject && (
          <button
            onClick={() => setShowCreateDialog(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--primary-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--primary)'; }}
          >
            <Plus size={16} />
            Tạo project
          </button>
        )}
      </div>

      {activeProjects.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px 24px',
          color: 'var(--text-muted)',
          background: 'var(--surface)',
          borderRadius: '12px',
          marginBottom: '32px',
        }}>
          <FolderOpen size={40} color="var(--border)" style={{ marginBottom: '8px' }} />
          <p style={{ fontSize: '14px' }}>Chưa có dự án nào đang hoạt động. Tạo dự án đầu tiên!</p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '16px',
            marginBottom: '32px',
          }}
        >
          {activeProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      {/* ── Section 2: Archived Projects ──────────────────────────────────── */}
      {archivedProjects.length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Archive size={14} color="var(--text-muted)" />
            <span style={{
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              ĐÃ ARCHIVE ({archivedProjects.length})
            </span>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '16px',
            }}
          >
            {archivedProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </>
      )}

      {/* Create Dialog */}
      <CreateProjectDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
      />
    </div>
  );
}
