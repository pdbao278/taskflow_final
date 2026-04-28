import { apiClient } from '@/lib/api-client';

export interface CommentUser {
  id: string;
  name: string;
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: CommentUser;
}

export const getComments = async (taskId: string): Promise<Comment[]> => {
  const { data } = await apiClient.get<{ success: boolean; data: { comments: Comment[] } }>(`/tasks/${taskId}/comments`);
  return data.data.comments;
};

export const createComment = async (taskId: string, content: string): Promise<Comment> => {
  const { data } = await apiClient.post<{ success: boolean; data: { comment: Comment } }>(`/tasks/${taskId}/comments`, { content });
  return data.data.comment;
};

export const deleteComment = async (taskId: string, commentId: string): Promise<void> => {
  await apiClient.delete(`/tasks/${taskId}/comments/${commentId}`);
};
