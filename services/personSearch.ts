import { HouseholdCreation } from "@/repository/householCreation";
import { supabase } from "@/constants/supabase";
import { PersonSearchRequest } from "@/types/householdHead";

export class PersonSearchService {

    private readonly key;
    private readonly statusFilter;

    constructor(key: string, statusFilter?: 'ACTIVE' | 'INACTIVE' | 'ALL') {
        this.key = key;
        this.statusFilter = statusFilter || 'ACTIVE';
    }

    public async execute(): Promise<PersonSearchRequest[]> {
        let rpcName = "search_person_by_code_or_name_not_deceased";
        
        // Use different RPC based on status filter
        if (this.statusFilter === 'INACTIVE' || this.statusFilter === 'ALL') {
            rpcName = "search_person_all_and_previous_resident";
        }
        
        console.log('[PersonSearchService] Using RPC:', rpcName, 'with key:', this.key, 'filter:', this.statusFilter);
        
        const { data, error } = await supabase.rpc(rpcName, { p_key: this.key });
        if (error) {
            console.warn('[PersonSearchService] RPC error:', error);
            return [];
        }
        
        console.log('[PersonSearchService] RPC returned:', data?.length || 0, 'results');
        
        // Map the RPC result to PersonSearchRequest format
        const results = (data || []).map((row: any) => ({
            person_id: row.person_id,
            person_code: row.person_code,
            full_name: row.person_name,
            address: [row.street, row.purok, row.barangay, row.city].filter(Boolean).join(', ')
        }));
        
        return results;
    }
}

export class PersonSearchWithGenderService {
    private readonly key;

    constructor(key: string) {
        this.key = key;
    }

    public async execute(): Promise<PersonSearchRequest[]> {
        const { data, error } = await supabase.rpc("search_resident_by_name_with_gender", { p_name_query: this.key });
        if (error) {
            console.warn(error);
            return [];
        }
        return data || [];
    }
}