'use client';

import { useWorkspaceStore } from '@/features/workspace/stores/workspace.store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import ReportsDashboard from '@/features/reports/components/ReportsDashboard';

export default function ReportsPage() {
  const { currentWorkspaceId, currentRole } = useWorkspaceStore();
  const router = useRouter();

  // Redirect if Member or no workspace
  useEffect(() => {
    if (!currentWorkspaceId) return;
    if (currentRole === 'Member') {
      router.replace('/app/my-tasks');
    }
  }, [currentWorkspaceId, currentRole, router]);

  if (!currentWorkspaceId || currentRole === 'Member') return null;

  return (
    <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
          Báo cáo
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
          Theo dõi tiến độ hoàn thành công việc và hiệu suất của từng thành viên trong nhóm.
        </p>
      </div>

      <ReportsDashboard />
    </div>
  );
}
