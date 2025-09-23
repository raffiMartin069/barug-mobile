import { supabase } from "@/constants/supabase";
import { VisitingScheduleException } from "@/exception/visitingScheduleException";
import { RescheduleType } from "@/types/rescheduleTypes";
import { ScheduleCompletedType } from "@/types/scheduleCompleted";

export class HealthWorkerRepository {

    static async GetAllWeeklySchedules() {
        const { data, error } = await supabase.from("calendar_week").select("week_id, week_label, year_num");
        if (error) {
            console.error("Error fetching weekly schedules:", error);
            return null;
        }
        const weekRanges = [];
        for(let i=0; i<data.length; i++) {
            weekRanges.push({ week_id: data[i].week_id, range: data[i].week_label + ", " + data[i].year_num });
        }
        return weekRanges || null;
    }

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
            if (error.code && VisitingScheduleException.getErrorCodes().has(error.code)) {
                console.warn("Error marking visit as done:", error);
                throw new VisitingScheduleException(error.message);
            }
            console.error("Error marking visit as done:", error);
            return;
        }
        return data;
    }

    static async InsertReschedule(info: RescheduleType) {
        console.log("With info:", info);
        const func = "reschedule_bhw_schedule"
        const { data, error } = await supabase.rpc(func, info);
        if (error) {
            if (error.code && VisitingScheduleException.getErrorCodes().has(error.code)) {
                console.warn("Error marking visit as done:", error);
                throw new VisitingScheduleException(error.message);
            }
            console.error("Error marking visit as done:", error);
            return;
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