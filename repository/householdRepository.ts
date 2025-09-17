import { supabase } from "@/constants/supabase";
import { MembershipException } from "@/exception/membershipExcption";
import { MemberRemovalType } from "@/types/memberRemoval";

export class HouseholdRepository {

    async getMemberId(residentId: number) {
        const { data, error } = await supabase
            .from("house_member")
            .select("house_member_id")
            .eq("person_id", residentId)
            .single();
        if (error) {
            console.error("Error fetching member ID:", error);
            return null;
        }
        return data?.house_member_id || null;
    }

    async removeMember(req: MemberRemovalType) {
        const func = "remove_house_member";
        const { data, error } = await supabase.rpc(func, req);
        if (error) {
            console.error(`Error calling ${func}:`, error);

            if (error.code === "P6045" && error.message.includes("House member not found.")) {
                throw new MembershipException("House member not found.");
            }

            return null;
        }
        return data || null;
    }

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
            throw new MembershipException("The selected Household Head does not have an existing household yet.");
        }
        return data?.household_id || null
    }

}