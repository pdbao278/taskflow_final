import apiClient from '@/lib/api-client';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  referenceId: string | null;
  message: string;
  readAt: string | null;
  createdAt: string;
}

export async function fetchNotifications(): Promise<Notification[]> {
  const res = await apiClient.get('/notifications');
  return res.data?.data?.notifications ?? [];
}

export async function fetchUnreadCount(): Promise<number> {
  const res = await apiClient.get('/notifications/unread-count');
  return res.data?.data?.unreadCount ?? 0;
}

export async function toggleNotificationRead(id: string): Promise<Notification> {
  const res = await apiClient.patch(`/notifications/${id}/read`);
  return res.data?.data?.notification;
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.patch('/notifications/read-all');
}
