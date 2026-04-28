import { useState, useEffect, useCallback } from 'react';
import { getComments, createComment, deleteComment, Comment } from './api';
import toast from 'react-hot-toast';

export const useComments = (taskId: string) => {
  const [data, setData] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchComments = useCallback(async () => {
    if (!taskId) return;
    setIsLoading(true);
    try {
      const comments = await getComments(taskId);
      setData(comments);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  return { data, setData, isLoading, refetch: fetchComments };
};

export const useCreateComment = (taskId: string) => {
  const [isPending, setIsPending] = useState(false);

  const mutate = async (
    content: string, 
    options?: { 
      onMutate?: () => void;
      onSuccess?: () => void; 
      onError?: () => void;
    }
  ) => {
    setIsPending(true);
    try {
      options?.onMutate?.();
      await createComment(taskId, content);
      options?.onSuccess?.();
    } catch (err) {
      toast.error('Không thể gửi bình luận. Thử lại?');
      options?.onError?.();
    } finally {
      setIsPending(false);
    }
  };

  return { mutate, isPending };
};

export const useDeleteComment = (taskId: string, onSuccess?: () => void) => {
  const [isPending, setIsPending] = useState(false);

  const mutate = async (commentId: string) => {
    setIsPending(true);
    try {
      await deleteComment(taskId, commentId);
      onSuccess?.();
    } catch (err) {
      toast.error('Không thể xóa bình luận.');
    } finally {
      setIsPending(false);
    }
  };

  return { mutate, isPending };
};
