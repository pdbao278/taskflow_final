import { Trash2 } from 'lucide-react';

export default function TrashPage() {
  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>Thùng rác</h1>
      <div style={{ textAlign: 'center', padding: '80px 24px', color: 'var(--text-muted)' }}>
        <Trash2 size={64} color="var(--border)" style={{ marginBottom: '16px' }} />
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Thùng rác trống</h2>
        <p>Không có task nào đã xóa.</p>
      </div>
    </div>
  );
}
