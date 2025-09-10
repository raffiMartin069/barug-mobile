import { supabase } from "@/constants/supabase";

export class FamilyRepository {

    async getFamilyDetails(p_household_id: number) {
        const func = "get_active_household_fam_and_member";
        const { data, error } = await supabase.rpc(func, { p_household_id: p_household_id });
        if (error) {
            console.error(`Error calling ${func}:`, error);
            return null;
        }
        return JSON.stringify(data) || null;
    }

}