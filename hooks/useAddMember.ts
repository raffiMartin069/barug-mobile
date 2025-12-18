import { MembershipException } from "@/exception/membershipExcption";
import { FamilyRepository } from "@/repository/familyRepository";
import { FamilyMembershipType } from "@/types/familyMembership";
import { useState } from "react"

export const useAddMember = () => {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const addMember = async(data: FamilyMembershipType) => {
        try {
            setLoading(true);
            const res = await new FamilyRepository().insertMember(data);
            if (!res) {
                setError("Failed to add member. Please try again.");
                return;
            }
            setLoading(false);
            return res;
        } catch(err) {
            if (err instanceof MembershipException) {
                setError(err.message);
                return;
            }
            setError("An unexpected error occurred. Please try again.");
            return;
        }
    }
    return { addMember, loading, error };
}