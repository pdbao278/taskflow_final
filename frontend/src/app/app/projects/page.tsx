import { FolderOpen } from 'lucide-react';

export default function ProjectsPage() {
  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>Dự án</h1>
      <div style={{ textAlign: 'center', padding: '80px 24px', color: 'var(--text-muted)' }}>
        <FolderOpen size={64} color="var(--border)" style={{ marginBottom: '16px' }} />
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Chưa có dự án</h2>
        <p>Hãy tạo dự án đầu tiên để bắt đầu quản lý công việc.</p>
      </div>
    </div>
  );
}
