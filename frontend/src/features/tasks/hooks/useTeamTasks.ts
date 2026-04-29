import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import type { Task } from '@/features/tasks/stores/task.store';

interface FetchTeamTasksResponse {
  success: boolean;
  data: {
    tasks: Task[];
  };
}

export const useTeamTasks = () => {
  const [data, setData] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async (silent = false) => {
    if (silent) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);
    try {
      const response = await apiClient.get<FetchTeamTasksResponse>('/tasks/team');
      setData(response.data.data.tasks);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Có lỗi xảy ra khi tải danh sách task.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    const handleRefetch = () => fetchTasks(true);
    window.addEventListener('refetch-team-tasks', handleRefetch);
    return () => {
      window.removeEventListener('refetch-team-tasks', handleRefetch);
    };
  }, [fetchTasks]);

  return { data, isLoading, isRefreshing, error, refetch: fetchTasks };
};
