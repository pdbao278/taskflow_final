'use client';

import { useReports } from '../hooks/useReports';
import { Loader2, AlertCircle, BarChart3, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ReportsDashboard() {
  const { data, isLoading, isRefreshing, error, refetch } = useReports();
  const router = useRouter();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0', color: 'var(--text-muted)', gap: '12px' }}>
        <Loader2 size={24} className="animate-spin" />
        <span style={{ fontSize: '14px' }}>Đang tải dữ liệu báo cáo...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0', color: 'var(--text-muted)', gap: '12px' }}>
        <AlertCircle size={32} style={{ color: 'var(--destructive)' }} />
        <span style={{ fontSize: '14px' }}>{error || 'Không có dữ liệu'}</span>
        <button
          onClick={() => refetch()}
          style={{ marginTop: '8px', padding: '8px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
        >
          Thử lại
        </button>
      </div>
    );
  }

  // Calculate max completed for bar chart scaling
  const maxCompleted = Math.max(...data.weeklyStats.map(s => s.completed), 1); // at least 1 to avoid div by zero

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '32px' }}>
      
      {/* Header with refresh button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
          Tổng quan
        </h2>
        <button
          onClick={() => refetch(true)}
          style={{ height: '32px', padding: '0 12px', display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '6px', border: '1px solid var(--border)', background: 'white', cursor: 'pointer', fontSize: '13px' }}
        >
          {isRefreshing ? <Loader2 size={14} className="animate-spin" /> : '↻'}
          Tải lại
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        
        {/* Weekly Stats Bar Chart */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <BarChart3 size={18} style={{ color: 'var(--text-muted)' }} />
            <h3 style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>Tasks hoàn thành theo tuần</h3>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', height: '200px', paddingBottom: '24px', position: 'relative' }}>
            {/* Y Axis Guides (Optional: simple lines) */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none', borderBottom: '1px solid var(--border)' }}>
               <div style={{ borderTop: '1px dashed var(--border)', opacity: 0.5, height: '0' }} />
               <div style={{ borderTop: '1px dashed var(--border)', opacity: 0.5, height: '0' }} />
               <div style={{ borderTop: '1px dashed var(--border)', opacity: 0.5, height: '0' }} />
            </div>

            {data.weeklyStats.map((stat, idx) => {
              const heightPct = Math.round((stat.completed / maxCompleted) * 100);
              return (
                <div key={idx} style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', position: 'relative', zIndex: 1 }}>
                  {/* Tooltip-like label above bar if completed > 0 */}
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', opacity: stat.completed > 0 ? 1 : 0 }}>
                    {stat.completed}
                  </span>
                  {/* Bar */}
                  <div style={{ 
                    width: '100%', 
                    maxWidth: '48px', 
                    height: `${heightPct}%`, 
                    minHeight: stat.completed > 0 ? '4px' : '0px',
                    background: idx === data.weeklyStats.length - 1 ? 'var(--primary)' : 'var(--status-todo)', // highlight current week
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 0.3s ease'
                  }} />
                  {/* X Axis Label */}
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', position: 'absolute', bottom: '-24px', whiteSpace: 'nowrap' }}>
                    {stat.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Member Stats Table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '20px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Users size={18} style={{ color: 'var(--text-muted)' }} />
          <h3 style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>Thống kê thành viên</h3>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '12px 8px', fontWeight: 500 }}>Thành viên</th>
              <th style={{ padding: '12px 8px', fontWeight: 500, textAlign: 'center' }}>Được giao</th>
              <th style={{ padding: '12px 8px', fontWeight: 500, textAlign: 'center' }}>Hoàn thành</th>
              <th style={{ padding: '12px 8px', fontWeight: 500, textAlign: 'center' }}>Quá hạn</th>
              <th style={{ padding: '12px 8px', fontWeight: 500, textAlign: 'right' }}>Tỷ lệ</th>
            </tr>
          </thead>
          <tbody>
            {data.memberStats.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '24px 8px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Chưa có dữ liệu thành viên
                </td>
              </tr>
            ) : (
              data.memberStats.map(m => (
                <tr 
                  key={m.id} 
                  onClick={() => router.push(`/app/reports/member/${m.id}`)}
                  style={{ 
                    borderBottom: '1px solid var(--border)', 
                    cursor: 'pointer',
                    transition: 'background 0.2s ease'
                  }}
                  onMouseOver={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  title="Xem công việc của thành viên này"
                >
                  <td style={{ padding: '12px 8px', fontWeight: 500, color: 'var(--text-primary)' }}>
                    {m.name}
                  </td>
                  <td style={{ padding: '12px 8px', textAlign: 'center' }}>{m.assigned}</td>
                  <td style={{ padding: '12px 8px', textAlign: 'center', color: m.completed > 0 ? 'var(--status-done)' : 'inherit' }}>
                    {m.completed}
                  </td>
                  <td style={{ padding: '12px 8px', textAlign: 'center', color: m.overdue > 0 ? 'var(--destructive)' : 'inherit' }}>
                    {m.overdue}
                  </td>
                  <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 500 }}>
                    {m.completionRate !== null ? `${m.completionRate}%` : 'N/A'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
