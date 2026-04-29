import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import type { Task } from '@/features/tasks/stores/task.store';

interface FetchMyTasksResponse {
  success: boolean;
  data: {
    tasks: Task[];
  };
}

export const useMyTasks = (statusFilter: 'All' | 'ToDo' | 'InProgress' = 'All') => {
  const [data, setData] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<FetchMyTasksResponse>('/my-tasks', {
        params: statusFilter !== 'All' ? { status: statusFilter } : undefined,
      });
      setData(response.data.data.tasks);
    } catch (err: unknown) {
      setError((err as any)?.response?.data?.error || 'Có lỗi xảy ra');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return { data, isLoading, error, refetch: fetchTasks };
};
