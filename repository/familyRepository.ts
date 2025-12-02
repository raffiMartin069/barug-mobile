import { supabase } from "@/constants/supabase";
import { MembershipException } from "@/exception/membershipExcption";
import { FamilyMembershipType } from "@/types/familyMembership";

export class FamilyRepository {

    async GetFamilyHeadIdByFamilyId(family_id: number) {
        const { data, error } = await supabase
            .from("family_unit")
            .select('family_head_id')
            .eq('family_id', family_id)
            .single()
        if (!data) {
            return null;
        }
        return data?.family_head_id || null;
    }

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

    async GetHouseholdIdByFamilyId(family_id: number) {
        const { data, error } = await supabase
            .from('family_unit')
            .select('household_id')
            .eq('family_id', family_id)
            .maybeSingle();
        if (error) {
            console.error('GetHouseholdIdByFamilyId error:', error);
            return null;
        }
        return data?.household_id ?? null;
    }

    async GetHouseholdHeadIdByHouseholdId(household_id: number) {
        const { data, error } = await supabase
            .from('household_info')
            .select('household_head_id')
            .eq('household_id', household_id)
            .maybeSingle();
        if (error) {
            console.error('GetHouseholdHeadIdByHouseholdId error:', error);
            return null;
        }
        return data?.household_head_id ?? null;
    }

}