import { supabase } from "@/constants/supabase";

export class HealthWorkerRepository {

    static async GetHouseholdIdWithSchedule() {
        const { data, error } = await supabase.from("bhw_schedule").select("household_id");
        if (error) {
            console.error("Error fetching household IDs:", error);
            return null;
        }
        return data.map(itm => itm.household_id) || null;
    }

    static async CallActiveSchedulingFunc(householdId: number) {
        const func = "get_active_household_fam_and_member";
        const { data, error } = await supabase.rpc(func, { p_household_id: householdId });
        if (error) {
            console.error("Error fetching data:", error);
        }
        return JSON.stringify(data);
    }

}