import { supabase } from "@/constants/supabase";
import { MembershipException } from "@/exception/membershipExcption";
import { FamilyMembershipType } from "@/types/familyMembership";

export class FamilyRepository {

    async insertMember(famData: FamilyMembershipType) {
        const func = "insert_house_member";
        const { data, error } = await supabase.rpc(func, famData);
        if (error) {
            const code = String(error.code ?? "").trim();
            if (MembershipException.getErrorCodes().has(code)) {
                console.warn(error);
                throw new MembershipException(error.message);
            }
            console.error(error);
            throw new Error(error.message);
        }
        return JSON.stringify(data) || null;
    }

    async getFamilyId(family_num: number) {
        const { data, error } = await supabase.from("family_unit").select("family_id").eq("family_num", family_num);
        if (error) {
            console.error("Error fetching family ID:", error);
            return null;
        }
        return data?.[0]?.family_id || null;
    }

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