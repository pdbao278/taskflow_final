import { BarChart2 } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>Báo cáo</h1>
      <div style={{ textAlign: 'center', padding: '80px 24px', color: 'var(--text-muted)' }}>
        <BarChart2 size={64} color="var(--border)" style={{ marginBottom: '16px' }} />
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Chưa có dữ liệu</h2>
        <p>Tạo task và hoàn thành để xem báo cáo.</p>
      </div>
    </div>
  );
}
