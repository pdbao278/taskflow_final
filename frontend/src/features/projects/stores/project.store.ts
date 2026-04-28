'use client';

import { create } from 'zustand';
import apiClient from '@/lib/api-client';

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  color: string;
  archivedAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  taskCount: {
    total: number;
    done: number;
  };
}

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;

  loadProjects: () => Promise<void>;
  loadProject: (id: string) => Promise<void>;
  addProject: (project: Project) => void;
  updateProject: (project: Project) => void;
  reset: () => void;
}

export const useProjectStore = create<ProjectState>()((set, get) => ({
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,

  loadProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiClient.get('/projects');
      const projects: Project[] = res.data?.data?.projects ?? [];
      set({ projects, isLoading: false });
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Có lỗi xảy ra. Thử lại?';
      set({ error: message, isLoading: false });
    }
  },

  loadProject: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiClient.get(`/projects/${id}`);
      const project: Project = res.data?.data?.project;
      set({ currentProject: project, isLoading: false });
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Có lỗi xảy ra. Thử lại?';
      set({ error: message, isLoading: false });
    }
  },

  addProject: (project: Project) => {
    set(state => ({ projects: [project, ...state.projects] }));
  },

  updateProject: (project: Project) => {
    set(state => ({
      projects: state.projects.map(p => p.id === project.id ? project : p),
      currentProject: state.currentProject?.id === project.id ? project : state.currentProject,
    }));
  },

  reset: () => {
    set({ projects: [], currentProject: null, isLoading: false, error: null });
  },
}));

// Project API functions
export const projectApi = {
  list: async () => {
    const res = await apiClient.get('/projects');
    return res.data;
  },

  create: async (data: { name: string; description?: string; color: string }) => {
    const res = await apiClient.post('/projects', data);
    return res.data;
  },

  getById: async (id: string) => {
    const res = await apiClient.get(`/projects/${id}`);
    return res.data;
  },

  update: async (id: string, data: { name?: string; description?: string; color?: string }) => {
    const res = await apiClient.patch(`/projects/${id}`, data);
    return res.data;
  },

  archive: async (id: string) => {
    const res = await apiClient.patch(`/projects/${id}/archive`);
    return res.data;
  },
};
