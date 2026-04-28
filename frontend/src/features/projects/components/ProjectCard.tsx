'use client';

import { useRouter } from 'next/navigation';
import { Archive, CheckCircle2 } from 'lucide-react';
import type { Project } from '../stores/project.store';

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter();
  const { taskCount } = project;
  const isArchived = project.archivedAt !== null;
  const percentage = taskCount.total > 0
    ? Math.round((taskCount.done / taskCount.total) * 100)
    : 0;

  // Progress bar fill color: green for active, olive/warning for archived
  const progressFill = isArchived
    ? 'linear-gradient(90deg, hsl(38 92% 50%), hsl(45 93% 47%))'
    : 'linear-gradient(90deg, hsl(142 71% 45%), hsl(142 76% 55%))';

  return (
    <div
      onClick={() => router.push(`/app/projects/${project.id}`)}
      style={{
        background: 'white',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '16px',
        cursor: 'pointer',
        transition: 'box-shadow 0.2s, border-color 0.2s, transform 0.15s',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1)';
        e.currentTarget.style.borderColor = 'hsl(221 83% 53% / 0.3)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Row 1: Color dot + Name + ArchivedBadge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: project.description ? '4px' : '10px' }}>
        <div
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: project.color,
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {project.name}
        </span>
        {isArchived && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              background: 'var(--muted)',
              color: 'var(--muted-foreground)',
              fontSize: '10px',
              fontWeight: 600,
              padding: '2px 6px',
              borderRadius: '4px',
              whiteSpace: 'nowrap',
            }}
          >
            <Archive size={10} />
            Archived
          </span>
        )}
      </div>

      {/* Row 2: Description (1 line truncated) */}
      {project.description && (
        <p
          style={{
            fontSize: '12px',
            color: 'var(--text-secondary)',
            margin: '0 0 10px',
            lineHeight: 1.4,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            wordBreak: 'break-all',
            minWidth: 0,
          }}
        >
          {project.description}
        </p>
      )}

      {/* Row 3: Progress inline — icon + task count + percentage */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
        <CheckCircle2 size={14} color="var(--success)" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
          {taskCount.done}/{taskCount.total} tasks
        </span>
        <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
          {percentage}%
        </span>
      </div>

      {/* Row 4: Progress bar */}
      <div
        style={{
          height: '6px',
          background: 'var(--muted)',
          borderRadius: '9999px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${percentage}%`,
            background: progressFill,
            borderRadius: '9999px',
            transition: 'width 0.5s ease',
          }}
        />
      </div>
    </div>
  );
}
