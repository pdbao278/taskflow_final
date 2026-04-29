import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach token + workspace id
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const workspaceId = localStorage.getItem('currentWorkspaceId');
    if (workspaceId) {
      config.headers['x-workspace-id'] = workspaceId;
    }
  }
  return config;
});

// Response interceptor: handle 401 (token expired)
let isRedirectingToLogin = false; // prevent multiple simultaneous redirects

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      if (currentPath.startsWith('/app') && !isRedirectingToLogin) {
        isRedirectingToLogin = true;
        // Reset BOTH localStorage AND Zustand store state
        // (localStorage-only removal causes loop: store still has isAuthenticated=true)
        localStorage.removeItem('token');
        localStorage.removeItem('currentWorkspaceId');
        // Lazy import to avoid circular dep: auth.store → api-client → auth.store
        import('@/features/auth/stores/auth.store').then(({ useAuthStore }) => {
          useAuthStore.getState().logout();
        });
        window.location.href = '/login?expired=1';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
