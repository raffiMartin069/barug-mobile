import { supabase } from "@/constants/supabase";
import { BusinessStats } from "@/types/businessStatsType";

export class BusinessStatsRepository {
  async getBusinessStats(ownerPersonId: number): Promise<BusinessStats> {
    try {
      // Get active count
      const { count: activeCount, error: activeError } = await supabase
        .from('business')
        .select('business_id, business_status!inner(business_status_name)', { count: 'exact', head: true })
        .eq('business_owner_id', ownerPersonId)
        .ilike('business_status.business_status_name', 'active');

      if (activeError) {
        console.error('Error fetching active count:', activeError);
        throw new Error(activeError.message);
      }

      // Get closed count
      const { count: closedCount, error: closedError } = await supabase
        .from('business')
        .select('business_id, business_status!inner(business_status_name)', { count: 'exact', head: true })
        .eq('business_owner_id', ownerPersonId)
        .ilike('business_status.business_status_name', 'closed');

      if (closedError) {
        console.error('Error fetching closed count:', closedError);
        throw new Error(closedError.message);
      }

      // Get expired count
      const { count: expiredCount, error: expiredError } = await supabase
        .from('business')
        .select('business_id, business_status!inner(business_status_name)', { count: 'exact', head: true })
        .eq('business_owner_id', ownerPersonId)
        .ilike('business_status.business_status_name', 'expired');

      if (expiredError) {
        console.error('Error fetching expired count:', expiredError);
        throw new Error(expiredError.message);
      }

      // Get pending count
      const { count: pendingCount, error: pendingError } = await supabase
        .from('business')
        .select('business_id, business_status!inner(business_status_name)', { count: 'exact', head: true })
        .eq('business_owner_id', ownerPersonId)
        .ilike('business_status.business_status_name', 'pending');

      if (pendingError) {
        console.error('Error fetching pending count:', pendingError);
        throw new Error(pendingError.message);
      }

      return {
        active_count: activeCount || 0,
        closed_count: closedCount || 0,
        expired_count: expiredCount || 0,
        pending_count: pendingCount || 0,
      };
    } catch (error) {
      console.error('Error in getBusinessStats:', error);
      throw error;
    }
  }
}
