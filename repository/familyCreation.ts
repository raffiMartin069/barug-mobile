import { supabase } from "@/constants/supabase";
import { MembershipException } from "@/exception/database/membershipExcption";
import { FamilyCreationRequest } from "@/types/request/familyCreationRequest";

export class FamilyCreationRepository {

    async createFamily(req: FamilyCreationRequest) {
        const { data, error } = await supabase.rpc("insert_family_unit", req);
        if (error) {
            if (error.message === "An active family with the same Family Number or UFC Number already exists." && error.code === "P5009") {
                console.warn(error)
                throw new MembershipException(JSON.stringify(error.message));
            }

            if (error.message === "This person is already an active head of another family." && error.code === "P5010") {
                console.warn(error)
                throw new MembershipException(JSON.stringify(error.message));
            }

            if (error.message === "This person is already an active head of another household." && error.code === "P5022") {
                console.warn(error)
                throw new MembershipException(JSON.stringify(error.message));
            }

            console.error(error)
            throw new Error(error.message);
        }
        return data;
    }
}