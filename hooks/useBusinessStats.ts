import { BusinessStatsService } from "@/services/businessStatsService";
import { BusinessStats } from "@/types/businessStatsType";
import { useCallback, useEffect, useState } from "react";

export const useBusinessStats = (ownerPersonId?: number) => {
  const [stats, setStats] = useState<BusinessStats>({
    active_count: 0,
    closed_count: 0,
    expired_count: 0,
    pending_count: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async (personId: number) => {
    if (!personId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const service = new BusinessStatsService();
      const data = await service.getStats(personId);
      setStats(data);
    } catch (err) {
      console.error('Error fetching business stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch business stats');
      setStats({
        active_count: 0,
        closed_count: 0,
        expired_count: 0,
        pending_count: 0,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback((personId: number) => {
    fetchStats(personId);
  }, [fetchStats]);

  useEffect(() => {
    if (ownerPersonId) {
      fetchStats(ownerPersonId);
    }
  }, [ownerPersonId, fetchStats]);

  return {
    stats,
    loading,
    error,
    fetchStats,
    refresh,
  };
};
