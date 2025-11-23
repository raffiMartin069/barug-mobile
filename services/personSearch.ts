import { HouseholdCreation } from "@/repository/householCreation";
import { supabase } from "@/constants/supabase";
import { PersonSearchRequest } from "@/types/householdHead";

export class PersonSearchService {

    private readonly key;

    constructor(key: string) {
        this.key = key;
    }

    public async execute() {
        return await new HouseholdCreation().findHouseholdHeadByName(this.key);
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