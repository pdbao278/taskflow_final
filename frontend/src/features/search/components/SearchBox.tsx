'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2, Calendar } from 'lucide-react';
import { useSearch } from '../hooks/useSearch';
import { useDebounce } from '../hooks/useDebounce';
import type { Task } from '@/features/tasks/stores/task.store';

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function getAvatarColor(id: string): string {
  const colors = ['#4f46e5','#0891b2','#059669','#d97706','#dc2626','#7c3aed','#db2777'];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function SearchBox() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebounce(query, 300);
  const { data: results, isLoading, isFetching } = useSearch(debouncedQuery);

  const showDropdown = isFocused && query.length > 0;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    setSelectedIndex(-1);
  }, [results]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || !results) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        handleSelectTask(results[selectedIndex].id);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsFocused(false);
      inputRef.current?.blur();
    }
  };

  const handleSelectTask = (taskId: string) => {
    setIsFocused(false);
    setQuery('');
    inputRef.current?.blur();
    router.push(`/app/my-tasks?taskId=${taskId}`);
  };

  return (
    <div style={{ position: 'relative', width: 'clamp(280px, 36vw, 520px)' }} className="hidden sm:flex">
      <Search 
        size={15} 
        style={{
          position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
          color: isFocused ? 'var(--primary)' : 'var(--text-muted)',
          transition: 'color 0.2s',
        }} 
      />
      <input
        ref={inputRef}
        type="text"
        placeholder="Tìm kiếm task..."
        value={query}
        onChange={e => setQuery(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onKeyDown={handleKeyDown}
        style={{
          width: '100%', height: '36px', padding: '0 40px 0 32px',
          border: `1px solid ${isFocused ? 'var(--primary)' : 'var(--border)'}`, 
          borderRadius: '8px',
          fontSize: '13px', background: 'var(--surface)',
          outline: 'none', color: 'var(--text-primary)',
          transition: 'border-color 0.2s, background 0.2s',
          boxShadow: isFocused ? '0 0 0 2px rgba(37, 99, 235, 0.2)' : 'none',
        }}
      />
      {!isFocused && (
        <span style={{
          position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
          fontSize: '11px', color: 'var(--text-muted)', background: 'white',
          border: '1px solid var(--border)', padding: '1px 5px', borderRadius: '4px',
          fontFamily: 'monospace', pointerEvents: 'none',
        }}>⌘K</span>
      )}

      {/* Dropdown */}
      {showDropdown && (
        <div 
          ref={dropdownRef}
          style={{
            position: 'absolute', top: 'calc(100% + 4px)', left: 0, width: '100%',
            background: 'white', border: '1px solid var(--border)', borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 'var(--z-dropdown)',
            maxHeight: '400px', overflowY: 'auto',
          }}
        >
          {isLoading || isFetching ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 0', color: 'var(--text-muted)', gap: '8px' }}>
              <Loader2 size={18} className="animate-spin" />
              <span style={{ fontSize: '13px' }}>Đang tìm kiếm...</span>
            </div>
          ) : results && results.length > 0 ? (
            <div style={{ padding: '8px 0' }}>
              {results.map((task: Task, index: number) => {
                const isActive = index === selectedIndex;
                const assigneeInitials = task.assignee ? getInitials(task.assignee.name) : null;
                const assigneeColor = task.assignee ? getAvatarColor(task.assignee.id) : null;

                return (
                  <div 
                    key={task.id}
                    onClick={() => handleSelectTask(task.id)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    style={{
                      padding: '8px 12px',
                      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                      cursor: 'pointer',
                      background: isActive ? 'var(--surface-hover)' : 'transparent',
                      transition: 'background 0.1s',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0, paddingRight: '12px' }}>
                      <p style={{ 
                        margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {task.title}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                        <span style={{ 
                          width: '8px', height: '8px', borderRadius: '50%', background: task.project.color, flexShrink: 0 
                        }} />
                        <span style={{ 
                          fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 500,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {task.project.name}
                        </span>
                      </div>
                    </div>

                    {/* Right column: Avatar + Due Date */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                      {task.assignee ? (
                        <div style={{
                          width: '24px', height: '24px', borderRadius: '50%',
                          background: assigneeColor as string, color: 'white',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '10px', fontWeight: 600,
                        }} title={task.assignee.name}>
                          {assigneeInitials}
                        </div>
                      ) : (
                        <div style={{
                          fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500,
                          height: '24px', display: 'flex', alignItems: 'center'
                        }}>
                          Chưa assign
                        </div>
                      )}
                      
                      {task.dueDate && (
                        <div style={{ 
                          display: 'flex', alignItems: 'center', gap: '4px', 
                          color: new Date(task.dueDate) < new Date() ? 'hsl(0 84% 60%)' : 'var(--text-muted)' 
                        }}>
                          <Calendar size={10} />
                          <span style={{ fontSize: '10px', fontWeight: 500 }}>
                            {formatDate(task.dueDate)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: '24px 16px', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>Không tìm thấy task nào</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>Không tìm thấy task nào với từ khóa này</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
