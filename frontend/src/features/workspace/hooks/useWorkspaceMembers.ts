import { useState, useEffect } from 'react';
import { workspaceApi } from '../stores/workspace.store';

export interface WorkspaceMember {
  id: string;
  userId: string;
  role: 'Admin' | 'Manager' | 'Member';
  joinedAt: string;
  name: string;
  email: string;
}

export const useWorkspaceMembers = () => {
  const [data, setData] = useState<WorkspaceMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchMembers = async () => {
      setIsLoading(true);
      try {
        const res = await workspaceApi.getMembers();
        if (mounted) {
          setData((res.data?.members || []) as WorkspaceMember[]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    fetchMembers();
    return () => { mounted = false; };
  }, []);

  return { data, isLoading };
};
