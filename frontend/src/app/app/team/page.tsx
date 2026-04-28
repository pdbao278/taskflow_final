import { Users } from 'lucide-react';

export default function TeamPage() {
  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>Kanban Team</h1>
      <div style={{ textAlign: 'center', padding: '80px 24px', color: 'var(--text-muted)' }}>
        <Users size={64} color="var(--border)" style={{ marginBottom: '16px' }} />
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Kanban Team</h2>
        <p>Board sẽ hiển thị tại đây sau khi tạo task.</p>
      </div>
    </div>
  );
}
