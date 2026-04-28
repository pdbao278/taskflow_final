import { ClipboardList } from 'lucide-react';

export default function MyTasksPage() {
  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '24px' }}>
        Công việc của tôi
      </h1>

      {/* Empty state */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '80px 24px', color: 'var(--text-muted)', textAlign: 'center',
      }}>
        <ClipboardList size={64} color="var(--border)" style={{ marginBottom: '16px' }} />
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
          Chưa có công việc
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '300px' }}>
          Bạn chưa có task nào. Hãy liên hệ Manager để được assign công việc.
        </p>
      </div>
    </div>
  );
}
