import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>Cài đặt Workspace</h1>
      <div style={{
        background: 'white', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px',
        maxWidth: '600px',
      }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Thông tin workspace</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Cài đặt workspace sẽ có đầy đủ tại Milestone M1.</p>
      </div>
    </div>
  );
}
