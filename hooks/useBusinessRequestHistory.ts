// hooks/useBusinessRequestHistory.ts
import { fetchBusinessRequestHistory } from '@/services/businessRequestHistoryService';
import type { BusinessRequestHistory } from '@/types/businessRequestHistoryType';
import { useCallback, useState } from 'react';

export function useBusinessRequestHistory() {
  const [requests, setRequests] = useState<BusinessRequestHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRequests = useCallback(async (ownerId: number) => {
    if (!ownerId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchBusinessRequestHistory(ownerId);
      setRequests(data);
    } catch (err) {
      console.error('[useBusinessRequestHistory] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async (ownerId: number) => {
    await loadRequests(ownerId);
  }, [loadRequests]);

  return {
    requests,
    loading,
    error,
    loadRequests,
    refresh,
  };
}
