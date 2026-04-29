import { create } from 'zustand';
import {
  fetchNotifications,
  fetchUnreadCount,
  toggleNotificationRead,
  markAllNotificationsRead,
  type Notification,
} from './api';

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  isDropdownOpen: boolean;

  // Actions
  loadNotifications: () => Promise<void>;
  loadUnreadCount: () => Promise<void>;
  toggleRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  setDropdownOpen: (open: boolean) => void;
  toggleDropdown: () => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  isDropdownOpen: false,

  loadNotifications: async () => {
    set({ isLoading: true });
    try {
      const notifications = await fetchNotifications();
      const unreadCount = notifications.filter((n) => n.readAt === null).length;
      set({ notifications, unreadCount });
    } catch (err) {
      console.error('Load notifications error:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  loadUnreadCount: async () => {
    try {
      const unreadCount = await fetchUnreadCount();
      set({ unreadCount });
    } catch (err: any) {
      // Silently ignore:
      // - 400: workspace not yet loaded (x-workspace-id header missing)
      // - 429: rate limit
      // - 503: service unavailable
      const status = err?.response?.status;
      if (status !== 400 && status !== 429 && status !== 503) {
        console.warn('Notification poll error:', status ?? err?.message);
      }
    }
  },

  toggleRead: async (id: string) => {
    // Optimistic update
    const prev = get().notifications;
    const updated = prev.map((n) => {
      if (n.id !== id) return n;
      return { ...n, readAt: n.readAt === null ? new Date().toISOString() : null };
    });
    const newUnreadCount = updated.filter((n) => n.readAt === null).length;
    set({ notifications: updated, unreadCount: newUnreadCount });

    try {
      const result = await toggleNotificationRead(id);
      // Sync with server response
      const synced = get().notifications.map((n) => (n.id === id ? result : n));
      const syncedUnread = synced.filter((n) => n.readAt === null).length;
      set({ notifications: synced, unreadCount: syncedUnread });
    } catch (err) {
      // Rollback
      const prevUnread = prev.filter((n) => n.readAt === null).length;
      set({ notifications: prev, unreadCount: prevUnread });
      console.error('Toggle read error:', err);
    }
  },

  markAllRead: async () => {
    // Optimistic update
    const prev = get().notifications;
    const updated = prev.map((n) => ({
      ...n,
      readAt: n.readAt ?? new Date().toISOString(),
    }));
    set({ notifications: updated, unreadCount: 0 });

    try {
      await markAllNotificationsRead();
    } catch (err) {
      // Rollback
      const prevUnread = prev.filter((n) => n.readAt === null).length;
      set({ notifications: prev, unreadCount: prevUnread });
      console.error('Mark all read error:', err);
    }
  },

  setDropdownOpen: (open: boolean) => {
    set({ isDropdownOpen: open });
    // Load full list when opening
    if (open) {
      get().loadNotifications();
    }
  },

  toggleDropdown: () => {
    const current = get().isDropdownOpen;
    get().setDropdownOpen(!current);
  },
}));
