import { ExpiringBusinessService } from "@/services/expiringBusinessService";
import { ExpiringBusiness } from "@/types/expiringBusinessType";
import { useCallback, useEffect, useState } from "react";

export const useExpiringBusinesses = (ownerPersonId?: number) => {
  const [expiringBusinesses, setExpiringBusinesses] = useState<ExpiringBusiness[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExpiringBusinesses = useCallback(async (personId: number) => {
    if (!personId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const service = new ExpiringBusinessService();
      const data = await service.getExpiringBusinesses(personId);
      setExpiringBusinesses(data);
    } catch (err) {
      console.error('Error fetching expiring businesses:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch expiring businesses');
      setExpiringBusinesses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback((personId: number) => {
    fetchExpiringBusinesses(personId);
  }, [fetchExpiringBusinesses]);

  useEffect(() => {
    if (ownerPersonId) {
      fetchExpiringBusinesses(ownerPersonId);
    }
  }, [ownerPersonId, fetchExpiringBusinesses]);

  return {
    expiringBusinesses,
    loading,
    error,
    fetchExpiringBusinesses,
    refresh,
  };
};
