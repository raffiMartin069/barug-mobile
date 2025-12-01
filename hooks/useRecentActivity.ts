import { RecentActivityService } from "@/services/recentActivityService";
import { RecentActivity } from "@/types/recentActivityType";
import { useCallback, useEffect, useState } from "react";

export const useRecentActivity = (ownerPersonId?: number, limit: number = 10) => {
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = useCallback(async (personId: number, itemLimit: number = 10) => {
    if (!personId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const service = new RecentActivityService();
      const data = await service.getRecentActivities(personId, itemLimit);
      setActivities(data);
    } catch (err) {
      console.error('Error fetching recent activities:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch recent activities');
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback((personId: number, itemLimit: number = 10) => {
    fetchActivities(personId, itemLimit);
  }, [fetchActivities]);

  useEffect(() => {
    if (ownerPersonId) {
      fetchActivities(ownerPersonId, limit);
    }
  }, [ownerPersonId, limit, fetchActivities]);

  return {
    activities,
    loading,
    error,
    fetchActivities,
    refresh,
  };
};
