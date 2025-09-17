import { supabase } from "@/constants/supabase";
import { MembershipException } from "@/exception/membershipExcption";
import { HouseholdCreationRequest } from "@/types/request/householdCreationRequest";

export class HouseholdCreation {

    async findHouseholdHeadByName(name: string) {
        const { data, error } = await supabase.rpc("search_resident_by_name", { p_name_query: name });
        if (error) {
            console.warn(error);
        }
        return data;
    }

    async createHousehold(req: HouseholdCreationRequest) {
        const { data, error } = await supabase.rpc("insert_household", req);
        if (error) {
            if (error.message === "This person is already an active head of another household." && error.code === "P5010") {
                console.warn(error)
                throw new MembershipException(error.message);
            }
            console.error(error)
            throw new Error(error.message);
        }
        return data;
    }
}