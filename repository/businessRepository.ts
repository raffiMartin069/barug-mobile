import { supabase } from "@/constants/supabase";
import { Business, BusinessDetails } from "@/types/businessType";

export class BusinessRepository {
  /**
   * Calls the Postgres function get_businesses_by_owner(p_owner_id)
   * which you provided in SQL.
   */
  async getBusinessesByOwner(ownerId: number): Promise<Business[] | null> {
    const func = "get_businesses_by_owner";
    const { data, error } = await supabase.rpc(func, { p_owner_id: ownerId });

    if (error) {
      console.error(`Error calling ${func}:`, error);
      throw new Error(error.message);
    }
    return (data as Business[]) || null;
  }

  /** Calls the get_business_details RPC and returns first row or null */
  async getDetails(businessId: number): Promise<BusinessDetails | null> {
    if (!businessId || Number.isNaN(Number(businessId))) return null;

    const { data, error } = await supabase.rpc('get_business_details', { p_business_id: businessId });

    if (error) {
      console.error('get_business_details RPC error:', error);
      throw error;
    }

    // Depending on how your RPC returns data: sometimes array, sometimes object
    const details = Array.isArray(data) ? data[0] ?? null : data ?? null;
    return (details as BusinessDetails) ?? null;
  }
}