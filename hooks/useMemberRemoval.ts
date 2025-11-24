import { MemberRemovalException } from "@/exception/memberRemovalException";
import { PolicyException } from "@/exception/policyException";
import { MemberRemovalService } from "@/services/memberRemovalService";
import { useAccountRole } from "@/store/useAccountRole";
import { MemberRemovalType } from "@/types/memberRemoval";
import { useState } from "react";

export const useMemberRemoval = () => {

    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const profile = useAccountRole((s) => s.getProfile('resident'))
    const addedById = profile?.person_id ?? useAccountRole.getState().staffId ?? null
    const removeMember = async (id: number, selectedReason: string, service: MemberRemovalService): Promise<boolean> => {
        setLoading(true);
        setError(null);
        try {
            const reason = selectedReason === null ? "OTHER" : selectedReason.trim()
            const data: MemberRemovalType = {
                p_house_member_id: Number(id),
                p_performed_by: parseInt(addedById ?? '1'),
                p_reason: reason
            };
            const result = await service.execute(data);
            setLoading(false);
            return result;
        } catch (err) {
            if (err instanceof MemberRemovalException || err instanceof PolicyException) {
                setError(err.message);
                return false;
            }
            console.warn(err);
            setError("Something went wrong, please try again later.");
            setLoading(false);
            return false;
        }
    }
    return { removeMember, loading, error };
}