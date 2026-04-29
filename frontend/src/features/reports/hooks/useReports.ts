import { useState, useCallback, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import { useWorkspaceStore } from '@/features/workspace/stores/workspace.store';
import toast from 'react-hot-toast';

export interface WeeklyStat {
  label: string;
  completed: number;
}

export interface MemberStat {
  id: string;
  name: string;
  assigned: number;
  completed: number;
  overdue: number;
  completionRate: number | null;
}

export interface ReportsData {
  weeklyStats: WeeklyStat[];
  memberStats: MemberStat[];
}

export function useReports() {
  const { currentWorkspaceId } = useWorkspaceStore();
  const [data, setData] = useState<ReportsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async (silent = false) => {
    if (!currentWorkspaceId) return;
    
    if (silent) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const res = await apiClient.get('/reports/workspace', {
        headers: { 'x-workspace-id': currentWorkspaceId }
      });
      setData(res.data.data);
    } catch (err: any) {
      console.error('Failed to fetch reports:', err);
      const msg = err.response?.data?.error || 'Không thể tải báo cáo. Vui lòng thử lại sau.';
      setError(msg);
      if (!silent) toast.error(msg);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [currentWorkspaceId]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return { data, isLoading, isRefreshing, error, refetch: fetchReports };
}
