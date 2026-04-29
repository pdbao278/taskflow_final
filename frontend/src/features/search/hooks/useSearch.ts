import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import type { Task } from '@/features/tasks/stores/task.store';
import { useWorkspaceStore } from '@/features/workspace/stores/workspace.store';

export function useSearch(keyword: string) {
  const { currentWorkspaceId } = useWorkspaceStore();
  const [data, setData] = useState<Task[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    if (!currentWorkspaceId || !keyword.trim()) {
      setData([]);
      return;
    }

    let isMounted = true;
    const fetchTasks = async () => {
      setIsLoading(data === null);
      setIsFetching(true);
      try {
        const res = await apiClient.get('/search', { params: { q: keyword } });
        if (isMounted) {
          setData(res.data.data.tasks as Task[]);
        }
      } catch (err) {
        console.error('Search error:', err);
        if (isMounted) setData([]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsFetching(false);
        }
      }
    };

    fetchTasks();

    return () => {
      isMounted = false;
    };
  }, [keyword, currentWorkspaceId]);

  return { data, isLoading, isFetching };
}
