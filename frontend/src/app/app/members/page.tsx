'use client';

export default function MembersPage() {
  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '24px' }}>
        Thành viên
      </h1>

      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '80px 24px', textAlign: 'center',
      }}>
        <span style={{ fontSize: '48px', marginBottom: '16px' }}>👥</span>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
          Quản lý thành viên
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '360px' }}>
          Mời thành viên mới, quản lý quyền và vai trò trong workspace.
        </p>
      </div>
    </div>
  );
}
