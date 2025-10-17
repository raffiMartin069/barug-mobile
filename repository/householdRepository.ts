import { supabase } from "@/constants/supabase";
import { HouseholdException } from "@/exception/HouseholdException";
import { MemberRemovalException } from "@/exception/memberRemovalException";
import { MembershipException } from "@/exception/membershipExcption";
import { MemberRemovalType } from "@/types/memberRemoval";
import { HouseholdUpdateType } from "@/types/request/householdUpdateType";
import { UpdateFamilyInformation } from "@/types/updateFamilyInformationType";

export class HouseholdRepository {

    async UpdateFamilyInformation(request: UpdateFamilyInformation) {
        const func = "update_fam_info";
        const { data, error } = await supabase.rpc(func, request);
        if (error) {
            if (error.code && HouseholdException.getErrorCodes().has(String(error.code))) {
                console.error(`Error calling ${func}:`, error);
                throw new HouseholdException(error.message);
            }
            throw new Error(error.message);
        }
        return data || null;
    }

    async GetFamilyIdByFamilyNumber(familyNum: string) {
        const { data, error } = await supabase
            .from("family_unit")
            .select('family_id')
            .eq('family_num', familyNum)
            .single()
        if (!data) {
            return null;
        }
        return data?.family_id || null;
    }

    async UpdateFamilyHead(
        p_family_id: number,
        p_new_head_person_id: number,
        p_performed_by: number,
        p_reason: string) {
        const func = "change_family_head";
        const { data, error } = await supabase.rpc(func, {
            p_family_id,
            p_new_head_person_id,
            p_performed_by,
            p_reason
        });
        if (error) {
            if (error.code && HouseholdException.getErrorCodes().has(String(error.code))) {
                console.error(`Error calling ${func}:`, error);
                throw new HouseholdException(error.message);
            }
            throw new Error(error.message);
        }
        return data || null;
    }


    async UpdateHouseholdInformation(request: HouseholdUpdateType) {
        const func = "update_hhold_info";
        const { data, error } = await supabase.rpc(func, request);
        if (error) {
            if (error.code && HouseholdException.getErrorCodes().has(String(error.code))) {
                console.error(`Error calling ${func}:`, error);
                throw new HouseholdException(error.message);
            }
            throw new Error(error.message);
        }
        return data || null;
    }

    async GetHouseholdIdByHouseholdNumber(householdNum: string) {
        const { data, error } = await supabase
            .from("household_info")
            .select('household_id')
            .eq('household_num', householdNum)
            .single()
        if (!data) {
            return null;
        }
        return data?.household_id || null;
    }

    async UpdatehouseholdHead(
        p_household_id: number,
        p_new_head_person_id: number,
        p_performed_by: number,
        p_reason: string) {
        const func = "change_household_head";
        const { data, error } = await supabase.rpc(func, {
            p_household_id,
            p_new_head_person_id,
            p_performed_by,
            p_reason
        });
        if (error) {
            if (error.code && HouseholdException.getErrorCodes().has(String(error.code))) {
                console.error(`Error calling ${func}:`, error);
                throw new HouseholdException(error.message);
            }
            throw new Error(error.message);
        }
        return data || null;
    }

    async GetMemberId(residentId: number) {
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

    async RemoveMember(req: MemberRemovalType) {
        const func = "remove_house_member";
        const { data, error } = await supabase.rpc(func, req);
        if (error) {
            const code = String(error.code ?? "").trim();
            if (MemberRemovalException.getErrorCodes().has(code)) {
                console.warn(error)
                throw new MemberRemovalException(error.message);
            }
            console.error(error)
            throw new Error(error.message);
        }
        return data || null;
    }

    async GetActiveHousehold() {
        const func = "get_active_households";
        const { data, error } = await supabase.rpc(func);
        if (error) {
            console.error(`Error calling ${func}:`, error);
            return null;
        }
        return data || null;
    }

    async GetHouseholdIdByResidentId(id: number) {
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