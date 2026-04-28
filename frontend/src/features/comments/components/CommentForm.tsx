import { useState, useRef, useEffect } from 'react';
import { useCreateComment } from '../hooks';
import { useWorkspaceMembers } from '@/features/workspace/hooks/useWorkspaceMembers';
import { Send } from 'lucide-react';

const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ');

interface CommentFormProps {
  taskId: string;
  onSuccess?: () => void;
  onMutate?: (content: string) => void;
  onError?: () => void;
}

export function CommentForm({ taskId, onSuccess, onMutate, onError }: CommentFormProps) {
  const [content, setContent] = useState('');
  const [mentionSearch, setMentionSearch] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState<number>(-1);
  const [activeIndex, setActiveIndex] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { mutate: createComment, isPending } = useCreateComment(taskId);
  const { data: members = [] } = useWorkspaceMembers();

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);

    // Auto resize
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }

    // Check for @mention
    const cursor = e.target.selectionStart;
    const textBeforeCursor = val.substring(0, cursor);
    const match = textBeforeCursor.match(/@([a-zA-Z0-9_ À-ỹ]*)$/);

    if (match) {
      setMentionSearch(match[1].toLowerCase());
      setMentionIndex(match.index!);
      setActiveIndex(0);
    } else {
      setMentionSearch(null);
      setMentionIndex(-1);
    }
  };

  const filteredMembers = mentionSearch !== null
    ? members.filter(m => m?.name?.toLowerCase().includes(mentionSearch)).slice(0, 5)
    : [];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionSearch !== null && filteredMembers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(prev => (prev + 1) % filteredMembers.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(prev => (prev - 1 + filteredMembers.length) % filteredMembers.length);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        insertMention(filteredMembers[activeIndex].name);
        return;
      }
      if (e.key === 'Escape') {
        setMentionSearch(null);
        return;
      }
    }

    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const insertMention = (name: string) => {
    if (mentionIndex !== -1) {
      const before = content.substring(0, mentionIndex);
      const after = content.substring(textareaRef.current?.selectionStart || 0);
      const newText = `${before}@${name} ${after}`;
      setContent(newText);
      setMentionSearch(null);
      setMentionIndex(-1);
      
      // Update cursor position after render
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const newCursor = mentionIndex + name.length + 2; // +1 for @ and +1 for space
          textareaRef.current.setSelectionRange(newCursor, newCursor);
        }
      }, 0);
    }
  };

  const handleSubmit = () => {
    if (!content.trim() || isPending) return;
    createComment(content, {
      onMutate: () => {
        onMutate?.(content);
        setContent('');
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      },
      onSuccess: () => {
        onSuccess?.();
      },
      onError: () => {
        setContent(content); // Restore content
        onError?.();
      }
    });
  };

  return (
    <div style={{ position: 'relative', marginTop: '16px' }}>
      {mentionSearch !== null && filteredMembers.length > 0 && (
        <div 
          style={{ 
            position: 'absolute', 
            bottom: '100%', 
            left: 0, 
            marginBottom: '8px', 
            width: '280px', 
            background: 'white', 
            borderRadius: '8px', 
            border: '1px solid var(--border)', 
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)', 
            overflow: 'hidden', 
            zIndex: 50 
          }}
        >
          <div style={{ padding: '8px 12px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', background: 'var(--surface-hover)', borderBottom: '1px solid var(--border)' }}>
            Thành viên (@)
          </div>
          <ul style={{ maxHeight: '200px', overflowY: 'auto', listStyle: 'none', margin: 0, padding: 0 }}>
            {filteredMembers.map((m, idx) => (
              <li
                key={m.userId}
                onClick={() => insertMention(m.name)}
                onMouseEnter={() => setActiveIndex(idx)}
                style={{
                  padding: '10px 12px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: idx === activeIndex ? 'hsl(221 83% 53% / 0.08)' : 'transparent',
                  color: idx === activeIndex ? 'var(--primary)' : 'var(--text-primary)',
                  transition: 'background 0.1s'
                }}
              >
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'hsl(221 83% 53% / 0.15)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold', flexShrink: 0 }}>
                  {m.name.substring(0, 2).toUpperCase()}
                </div>
                <span style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', padding: '12px', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--surface)', transition: 'all 0.2s' }}>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Viết bình luận (@ để nhắc tên)..."
          style={{
            flex: 1,
            maxHeight: '150px',
            minHeight: '40px',
            resize: 'none',
            background: 'transparent',
            outline: 'none',
            fontSize: '14px',
            padding: '8px 4px',
            color: 'var(--text-primary)',
            lineHeight: '1.5',
            border: 'none',
            fontFamily: 'inherit'
          }}
          rows={1}
        />
        <button
          disabled={!content.trim() || isPending}
          onClick={handleSubmit}
          style={{ 
            flexShrink: 0,
            padding: '0 16px',
            height: '36px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: (!content.trim() || isPending) ? 'var(--text-muted)' : 'var(--primary)', 
            color: 'white',
            opacity: (!content.trim() || isPending) ? 0.6 : 1,
            cursor: (!content.trim() || isPending) ? 'not-allowed' : 'pointer',
            border: 'none',
            fontSize: '14px',
            fontWeight: 500,
            transition: 'opacity 0.2s'
          }}
        >
          Gửi
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}
