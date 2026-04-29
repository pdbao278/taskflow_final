import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import type { Task } from '@/features/tasks/stores/task.store';

interface FetchMyTasksResponse {
  success: boolean;
  data: {
    tasks: Task[];
  };
}

export const useMyTasks = (statusFilter: 'All' | 'ToDo' | 'InProgress' = 'All', userId?: string) => {
  const [data, setData] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (statusFilter !== 'All') params.status = statusFilter;
      if (userId) params.userId = userId;

      const response = await apiClient.get<FetchMyTasksResponse>('/my-tasks', { params });
      setData(response.data.data.tasks);
    } catch (err: unknown) {
      setError((err as any)?.response?.data?.error || 'Có lỗi xảy ra');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, userId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return { data, isLoading, error, refetch: fetchTasks };
};
