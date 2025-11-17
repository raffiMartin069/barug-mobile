import { supabase } from "@/constants/supabase";
import { Business } from "@/types/businessType";

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
}