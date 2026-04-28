'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '@/lib/api-client';

export type MemberRole = 'Admin' | 'Manager' | 'Member';

export interface Workspace {
  id: string;
  name: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  role: MemberRole;
}

interface WorkspaceState {
  workspaces: Workspace[];
  currentWorkspaceId: string | null;
  currentRole: MemberRole | null;
  isLoading: boolean;

  // Actions
  setCurrentWorkspace: (workspaceId: string) => void;
  setWorkspaces: (workspaces: Workspace[]) => void;
  updateWorkspaceName: (workspaceId: string, name: string) => void;
  removeWorkspace: (workspaceId: string) => void;
  addWorkspace: (workspace: Workspace) => void;
  loadWorkspaces: () => Promise<void>;
  reset: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      workspaces: [],
      currentWorkspaceId: null,
      currentRole: null,
      isLoading: false,

      setCurrentWorkspace: (workspaceId) => {
        const { workspaces } = get();
        const ws = workspaces.find(w => w.id === workspaceId);
        // Persist to localStorage for api-client interceptor
        if (typeof window !== 'undefined') {
          localStorage.setItem('currentWorkspaceId', workspaceId);
        }
        set({
          currentWorkspaceId: workspaceId,
          currentRole: ws?.role ?? null,
        });
      },

      setWorkspaces: (workspaces) => {
        const { currentWorkspaceId } = get();
        let activeId = currentWorkspaceId;

        // If current workspace is no longer in list, switch to first
        if (activeId && !workspaces.find(w => w.id === activeId)) {
          activeId = workspaces[0]?.id ?? null;
        }
        if (!activeId && workspaces.length > 0) {
          activeId = workspaces[0].id;
        }

        const activeWs = workspaces.find(w => w.id === activeId);
        if (activeId && typeof window !== 'undefined') {
          localStorage.setItem('currentWorkspaceId', activeId);
        }

        set({
          workspaces,
          currentWorkspaceId: activeId,
          currentRole: activeWs?.role ?? null,
        });
      },

      updateWorkspaceName: (workspaceId, name) => {
        set(state => ({
          workspaces: state.workspaces.map(w =>
            w.id === workspaceId ? { ...w, name } : w
          ),
        }));
      },

      removeWorkspace: (workspaceId) => {
        set(state => {
          const filtered = state.workspaces.filter(w => w.id !== workspaceId);
          let newCurrentId = state.currentWorkspaceId;
          let newRole = state.currentRole;

          if (newCurrentId === workspaceId) {
            const next = filtered[0];
            newCurrentId = next?.id ?? null;
            newRole = next?.role ?? null;
            if (newCurrentId && typeof window !== 'undefined') {
              localStorage.setItem('currentWorkspaceId', newCurrentId);
            }
          }

          return {
            workspaces: filtered,
            currentWorkspaceId: newCurrentId,
            currentRole: newRole,
          };
        });
      },

      addWorkspace: (workspace) => {
        set(state => ({ workspaces: [...state.workspaces, workspace] }));
      },

      loadWorkspaces: async () => {
        set({ isLoading: true });
        try {
          const res = await apiClient.get('/workspaces');
          const workspaces: Workspace[] = res.data?.data?.workspaces ?? [];
          get().setWorkspaces(workspaces);
        } catch (err) {
          console.error('Failed to load workspaces:', err);
        } finally {
          set({ isLoading: false });
        }
      },

      reset: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('currentWorkspaceId');
        }
        set({
          workspaces: [],
          currentWorkspaceId: null,
          currentRole: null,
          isLoading: false,
        });
      },
    }),
    {
      name: 'workspace-store',
      partialize: (state) => ({
        workspaces: state.workspaces,
        currentWorkspaceId: state.currentWorkspaceId,
        currentRole: state.currentRole,
      }),
    }
  )
);

// Workspace API functions
export const workspaceApi = {
  list: async () => {
    const res = await apiClient.get('/workspaces');
    return res.data;
  },

  create: async (name: string) => {
    const res = await apiClient.post('/workspaces', { name });
    return res.data;
  },

  getById: async (id: string) => {
    const res = await apiClient.get(`/workspaces/${id}`);
    return res.data;
  },

  rename: async (id: string, name: string) => {
    const res = await apiClient.patch(`/workspaces/${id}`, { name });
    return res.data;
  },

  delete: async (id: string) => {
    const res = await apiClient.delete(`/workspaces/${id}`);
    return res.data;
  },

  getMembers: async () => {
    const res = await apiClient.get('/workspaces/members');
    return res.data;
  },

  invite: async (email: string, role: 'Manager' | 'Member') => {
    const res = await apiClient.post('/workspaces/invite', { email, role });
    return res.data;
  },

  changeRole: async (memberId: string, role: 'Manager' | 'Member') => {
    const res = await apiClient.patch(`/workspaces/members/${memberId}/role`, { role });
    return res.data;
  },

  removeMember: async (memberId: string) => {
    const res = await apiClient.delete(`/workspaces/members/${memberId}`);
    return res.data;
  },
};
