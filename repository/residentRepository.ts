import { supabase } from "@/constants/supabase";
import { ResidencyException } from '@/exception/ResidencyException';
import { useAccountRole } from '@/store/useAccountRole';

export class ResidentRepository {

    async getDocuments(folder: string) {
        const { data } = await supabase.storage.from("id-uploads").getPublicUrl(folder);
        return data;
    }

    async getAllResidentInfo(id: number): Promise<string | null> {
        const func = "get_specific_resident_full_profile";
        const { data, error } = await supabase.rpc(func, { p_person_id: id });
        if (error) {
            console.error(`Error calling ${func}:`, error);
            return null;
        }
        return data;
    }

    async confirmResidency(
        p_person_id: number,
        p_performed_by?: number,
        p_rel_to_hholdhead_id?: number,
        p_rel_to_family_head_id?: number,
        p_reason?: string
    ) {
        const func = 'confirm_residency'

        // fallback to session staff id when not provided
        const sessionStaff = useAccountRole.getState().staffId ?? null
        const performedBy = p_performed_by ?? sessionStaff ?? 0

        const params = {
            p_person_id,
            p_performed_by: performedBy,
            p_rel_to_hholdhead_id: p_rel_to_hholdhead_id ?? null,
            p_rel_to_family_head_id: p_rel_to_family_head_id ?? null,
            p_reason: p_reason ?? null,
        }

        console.log('confirmResidency params:', params)

        const { data, error } = await supabase.rpc(func, params)
        if (error) {
            console.error(`Error calling ${func}:`, error)
            const code = String(error.code ?? '').trim()
            if (code && ResidencyException.getErrorCodes().has(code)) {
                throw new ResidencyException(error.message)
            }
            console.error(`Error calling ${func}:`, error);
            throw new Error(error.message)
        }
        return data || null
    }

}