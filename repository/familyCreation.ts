import { supabase } from "@/constants/supabase";
import { MembershipException } from "@/exception/membershipExcption";
import { FamilyCreationRequest } from "@/types/request/familyCreationRequest";

export class FamilyCreationRepository {

    async createFamily(req: FamilyCreationRequest) {
        const { data, error } = await supabase.rpc("insert_family_unit", req);
        if (error) {
            const code = String(error.code ?? "").trim();
            if (MembershipException.getErrorCodes().has(code)) {
                console.warn(error)
                throw new MembershipException(error.message);
            }
            console.error(error)
            throw new Error(error.message);
        }
        return data;
    }
}