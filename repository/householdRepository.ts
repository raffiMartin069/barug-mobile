import { supabase } from "@/constants/supabase";

export class HouseholdRepository {

    async getActiveHousehold() {
        const func = "get_active_households";
        const { data, error } = await supabase.rpc(func);
        if (error) {
            console.error(`Error calling ${func}:`, error);
            return null;
        }
        return data || null;
    }

    async getHouseholdIdByResidentId(id: number) {
        const { data, error } = await supabase
        .from("household_info")
        .select('household_id')
        .eq('household_head_id', id)
        .single()
        if (error) {
            console.error("Error fetching household ID:", error)
            return null
        }
        return data?.household_id || null
    }

}