import { supabase } from "@/constants/supabase";

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

}