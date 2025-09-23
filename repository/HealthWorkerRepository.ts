import { supabase } from "@/constants/supabase";
import { RescheduleType } from "@/types/rescheduleTypes";
import { ScheduleCompletedType } from "@/types/scheduleCompleted";

export class HealthWorkerRepository {

    static async GetScheduleIdByHouseholdId(id: number) {
        const { data, error } = await supabase
        .from("bhw_schedule")
        .select("schedule_id")
        .eq("household_id", id)
        .single();
        if (error) {
            console.error("Error fetching schedule ID:", error);
            return null;
        }
        return data ? data.schedule_id : null;
    }

    static async InsertMarkAsDone(info: ScheduleCompletedType) {
        const func = "complete_visit";
        console.log("Inserting mark as done with info:", info);
        const { data, error } = await supabase.rpc(func, info);
        if (error) {
            console.error("Error marking visit as done:", error);
            return null;
        }
        return data;
    }

    static async InsertReschedule(info: RescheduleType) {
        const func = "reschedule_bhw_schedule"
        const { data, error } = await supabase.rpc(func, {info});
        if (error) {
            console.error("Error inserting reschedule:", error);
            return null;
        }
        return data;
    }

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
        return JSON.stringify(data, null, 2);
    }

}