'use client';

import { create } from 'zustand';
import apiClient from '@/lib/api-client';

export interface TaskUser {
  id: string;
  name: string;
}

export interface TaskProject {
  id: string;
  name: string;
  color: string;
  archivedAt?: string | null;
}

export interface Task {
  id: string;
  workspaceId: string;
  projectId: string;
  title: string;
  description: string | null;
  status: 'ToDo' | 'InProgress' | 'InReview' | 'Done';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  assigneeId: string | null;
  dueDate: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  isOverdue: boolean;
  isAssigneeRemoved?: boolean;
  project: TaskProject;
  creator: TaskUser;
  assignee: TaskUser | null;
}

export interface TrashTask extends Task {
  deletedBy: string;
  restoreDeadline: string | null;
}

interface TaskState {
  tasks: Task[];
  currentTask: Task | null;
  trashTasks: TrashTask[];
  isLoading: boolean;
  error: string | null;

  loadProjectTasks: (projectId: string) => Promise<void>;
  loadMyTasks: () => Promise<void>;
  loadTask: (taskId: string) => Promise<void>;
  createTask: (data: CreateTaskData) => Promise<Task | null>;
  updateTask: (taskId: string, data: UpdateTaskData) => Promise<Task | null>;
  updateTaskStatus: (taskId: string, status: string) => Promise<boolean>;
  deleteTask: (taskId: string) => Promise<boolean>;
  loadTrash: (projectFilter?: string) => Promise<void>;
  restoreTask: (taskId: string) => Promise<boolean>;
  setCurrentTask: (task: Task | null) => void;
  reset: () => void;
}

export interface CreateTaskData {
  title: string;
  project_id: string;
  description?: string | null;
  assignee_id?: string | null;
  priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
  due_date?: string | null;
}

export interface UpdateTaskData {
  title?: string;
  description?: string | null;
  status?: 'ToDo' | 'InProgress' | 'InReview' | 'Done';
  assignee_id?: string | null;
  priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
  due_date?: string | null;
}

export const useTaskStore = create<TaskState>()((set, get) => ({
  tasks: [],
  currentTask: null,
  trashTasks: [],
  isLoading: false,
  error: null,

  loadProjectTasks: async (projectId: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiClient.get(`/projects/${projectId}/tasks`);
      set({ tasks: res.data?.data?.tasks ?? [], isLoading: false });
    } catch (err: unknown) {
      const message = (err as any)?.response?.data?.error || 'Có lỗi xảy ra. Thử lại?';
      set({ error: message, isLoading: false });
    }
  },

  loadMyTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiClient.get('/tasks/my');
      set({ tasks: res.data?.data?.tasks ?? [], isLoading: false });
    } catch (err: unknown) {
      const message = (err as any)?.response?.data?.error || 'Có lỗi xảy ra. Thử lại?';
      set({ error: message, isLoading: false });
    }
  },

  loadTask: async (taskId: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiClient.get(`/tasks/${taskId}`);
      set({ currentTask: res.data?.data?.task ?? null, isLoading: false });
    } catch (err: unknown) {
      const message = (err as any)?.response?.data?.error || 'Có lỗi xảy ra. Thử lại?';
      set({ error: message, isLoading: false });
    }
  },

  createTask: async (data: CreateTaskData) => {
    try {
      const res = await apiClient.post('/tasks', data);
      const task: Task = res.data?.data?.task;
      if (task) {
        set(state => ({ tasks: [task, ...state.tasks] }));
      }
      return task || null;
    } catch (err: unknown) {
      const message = (err as any)?.response?.data?.error || 'Có lỗi xảy ra. Thử lại?';
      throw new Error(message);
    }
  },

  updateTask: async (taskId: string, data: UpdateTaskData) => {
    try {
      const res = await apiClient.patch(`/tasks/${taskId}`, data);
      const task: Task = res.data?.data?.task;
      if (task) {
        set(state => ({
          tasks: state.tasks.map(t => t.id === task.id ? task : t),
          currentTask: state.currentTask?.id === task.id ? task : state.currentTask,
        }));
      }
      return task || null;
    } catch (err: unknown) {
      const message = (err as any)?.response?.data?.error || 'Có lỗi xảy ra. Thử lại?';
      throw new Error(message);
    }
  },

  updateTaskStatus: async (taskId: string, status: string) => {
    // Optimistic UI update
    const previousTasks = get().tasks;
    const previousCurrentTask = get().currentTask;
    
    set(state => ({
      tasks: state.tasks.map(t => t.id === taskId ? { ...t, status } : t),
      currentTask: state.currentTask?.id === taskId ? { ...state.currentTask, status } : state.currentTask,
    }));

    try {
      const res = await apiClient.patch(`/tasks/${taskId}/status`, { status });
      const task: Task = res.data?.data?.task;
      if (task) {
        set(state => ({
          tasks: state.tasks.map(t => t.id === task.id ? task : t),
          currentTask: state.currentTask?.id === task.id ? task : state.currentTask,
        }));
      }
      return true;
    } catch (err: unknown) {
      // Rollback on error
      set({ tasks: previousTasks, currentTask: previousCurrentTask });
      const message = (err as any)?.response?.data?.error || 'Có lỗi xảy ra. Thử lại?';
      throw new Error(message);
    }
  },

  deleteTask: async (taskId: string) => {
    try {
      await apiClient.delete(`/tasks/${taskId}`);
      set(state => ({
        tasks: state.tasks.filter(t => t.id !== taskId),
        currentTask: state.currentTask?.id === taskId ? null : state.currentTask,
      }));
      return true;
    } catch {
      return false;
    }
  },

  loadTrash: async (projectFilter?: string) => {
    set({ isLoading: true, error: null });
    try {
      const params = projectFilter ? `?project=${projectFilter}` : '';
      const res = await apiClient.get(`/tasks/trash${params}`);
      set({ trashTasks: res.data?.data?.tasks ?? [], isLoading: false });
    } catch (err: unknown) {
      const message = (err as any)?.response?.data?.error || 'Có lỗi xảy ra. Thử lại?';
      set({ error: message, isLoading: false });
    }
  },

  restoreTask: async (taskId: string) => {
    try {
      await apiClient.post(`/tasks/${taskId}/restore`);
      set(state => ({
        trashTasks: state.trashTasks.filter(t => t.id !== taskId),
      }));
      return true;
    } catch {
      return false;
    }
  },

  setCurrentTask: (task: Task | null) => set({ currentTask: task }),

  reset: () => set({ tasks: [], currentTask: null, trashTasks: [], isLoading: false, error: null }),
}));

// Task API helper functions
export const taskApi = {
  create: async (data: CreateTaskData) => {
    const res = await apiClient.post('/tasks', data);
    return res.data;
  },

  getById: async (id: string) => {
    const res = await apiClient.get(`/tasks/${id}`);
    return res.data;
  },

  update: async (id: string, data: UpdateTaskData) => {
    const res = await apiClient.patch(`/tasks/${id}`, data);
    return res.data;
  },

  delete: async (id: string) => {
    const res = await apiClient.delete(`/tasks/${id}`);
    return res.data;
  },

  listByProject: async (projectId: string) => {
    const res = await apiClient.get(`/projects/${projectId}/tasks`);
    return res.data;
  },

  trash: async (projectFilter?: string) => {
    const params = projectFilter ? `?project=${projectFilter}` : '';
    const res = await apiClient.get(`/tasks/trash${params}`);
    return res.data;
  },

  restore: async (id: string) => {
    const res = await apiClient.post(`/tasks/${id}/restore`);
    return res.data;
  },

  getActivity: async (id: string) => {
    const res = await apiClient.get(`/tasks/${id}/activity`);
    return res.data;
  },

  listMyTasks: async () => {
    const res = await apiClient.get('/tasks/my');
    return res.data;
  },
};
