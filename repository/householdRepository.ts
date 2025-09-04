import { supabase } from "@/constants/supabase";

export class HouseholdRepository {

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