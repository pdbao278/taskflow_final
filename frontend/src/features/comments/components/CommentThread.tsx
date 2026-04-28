import { useComments, useDeleteComment } from '../hooks';
import { useWorkspaceMembers } from '@/features/workspace/hooks/useWorkspaceMembers';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { Trash2, MessageSquare } from 'lucide-react';
import { CommentForm } from './CommentForm';

const formatDateTime = (dateStr: string) => {
  const d = new Date(dateStr);
  const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const date = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  return `${time} ${date}`;
};

interface CommentThreadProps {
  taskId: string;
}

export function CommentThread({ taskId }: CommentThreadProps) {
  const { data: comments, setData, isLoading, refetch } = useComments(taskId);
  const { data: members = [] } = useWorkspaceMembers();
  const { user } = useAuthStore();
  const { mutate: deleteComment } = useDeleteComment(taskId);

  const handleOptimisticSubmit = (content: string) => {
    const optimisticComment = {
      id: `optimistic-${Date.now()}`,
      taskId,
      userId: user?.id || 'temp',
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      user: { id: user?.id || 'temp', name: user?.name || 'You' },
    };
    setData((prev) => [...prev, optimisticComment as any]);
  };

  const handleOptimisticError = () => {
    setData((prev) => prev.filter(c => !c.id.startsWith('optimistic-')));
  };

  if (isLoading) {
    return <div className="animate-pulse space-y-4 py-4">
      {[1, 2].map(i => (
        <div key={i} className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="w-1/3 h-4 bg-muted rounded" />
            <div className="w-full h-10 bg-muted rounded" />
          </div>
        </div>
      ))}
    </div>;
  }

  if (!comments || comments.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex flex-col items-center justify-center py-8 text-center text-text-muted flex-1">
          <MessageSquare className="w-8 h-8 mb-2 opacity-20" />
          <p className="text-sm">Chưa có bình luận nào. Hãy viết bình luận đầu tiên.</p>
        </div>
        <CommentForm taskId={taskId} onSuccess={refetch} onMutate={handleOptimisticSubmit} onError={handleOptimisticError} />
      </div>
    );
  }

  // Pre-sort member names by length descending for mention highlighting
  const memberNames = members.map(m => m.name).sort((a, b) => b.length - a.length);

  const renderContentWithMentions = (content: string) => {
    if (!content.includes('@')) return content;

    // A simple regex approach won't easily match multi-word names reliably without a list,
    // so we use a character scan / replace approach.
    let remaining = content;
    const parts: { type: 'text' | 'mention'; text: string }[] = [];

    while (remaining.length > 0) {
      const atIndex = remaining.indexOf('@');
      if (atIndex === -1) {
        parts.push({ type: 'text', text: remaining });
        break;
      }

      // Add text before @
      if (atIndex > 0) {
        parts.push({ type: 'text', text: remaining.substring(0, atIndex) });
      }

      const textAfterAt = remaining.substring(atIndex + 1);
      let matchedName = null;

      for (const name of memberNames) {
        if (textAfterAt.startsWith(name)) {
          matchedName = name;
          break;
        }
      }

      if (matchedName) {
        parts.push({ type: 'mention', text: `@${matchedName}` });
        remaining = textAfterAt.substring(matchedName.length);
      } else {
        // Not a valid mention, just treat @ as text
        parts.push({ type: 'text', text: '@' });
        remaining = textAfterAt;
      }
    }

    return (
      <span className="whitespace-pre-wrap">
        {parts.map((p, i) => (
          p.type === 'mention' ? (
            <span key={i} className="font-medium px-0.5 rounded" style={{ color: 'var(--primary)', backgroundColor: 'hsl(221 83% 53% / 0.1)' }}>
              {p.text}
            </span>
          ) : (
            <span key={i} style={{ color: 'var(--text-primary)' }}>{p.text}</span>
          )
        ))}
      </span>
    );
  };

  return (
    <div className="space-y-8 py-4">
      {comments.map((comment) => {
        const isAuthor = comment.userId === user?.id;

        return (
          <div key={comment.id} className="flex gap-4 group">
            <div className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: 'hsl(221 83% 53% / 0.1)', color: 'var(--primary)', marginTop: '2px' }}>
              {comment.user?.name?.substring(0, 2).toUpperCase() || '??'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2.5 mb-1.5">
                <span className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>{comment.user?.name || 'Unknown'}</span>
                <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>{formatDateTime(comment.createdAt)}</span>
                
                {isAuthor && !comment.id.startsWith('optimistic-') && (
                  <button
                    className="w-6 h-6 ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-destructive hover:bg-destructive/10 rounded"
                    onClick={() => {
                      if (window.confirm('Bạn có chắc chắn muốn xóa bình luận này?')) {
                        deleteComment(comment.id).then(() => refetch());
                      }
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
              <div className="text-[14px] leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                {renderContentWithMentions(comment.content)}
              </div>
            </div>
          </div>
        );
      })}
      <CommentForm taskId={taskId} onSuccess={refetch} onMutate={handleOptimisticSubmit} onError={handleOptimisticError} />
    </div>
  );
}
