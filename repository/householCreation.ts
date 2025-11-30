import { supabase } from "@/constants/supabase";
import { MembershipException } from "@/exception/membershipExcption";
import { HouseholdCreationRequest } from "@/types/request/householdCreationRequest";

export class HouseholdCreation {

    async findHouseholdHeadByName(name: string) {
        try {
            const q = String(name ?? '').trim();
            if (!q) return [];

            // Search first_name, last_name, or middle_name for the query term
            const { data, error } = await supabase
                .from('person')
                .select('person_id, person_code, first_name, middle_name, last_name, birthdate, addresss (street, barangay, city)')
                .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,middle_name.ilike.%${q}%`)
                .eq('person_status_id', 1) // ACTIVE
                .eq('residential_status_id', 2) // RESIDENT
                .limit(20);

            if (error) {
                console.warn('findHouseholdHeadByName supabase error', error);
                return [];
            }

            return (data ?? []).map((r: any) => {
                const street = r.addresss?.street ?? '';
                const barangay = r.addresss?.barangay ?? '';
                const city = r.addresss?.city ?? '';
                const addressParts = [street, barangay, city].filter(Boolean).join(', ');
                const middleInitial = r.middle_name ? `${String(r.middle_name).trim()[0].toUpperCase()}.` : '';
                const fullName = `${String(r.first_name ?? '').toUpperCase()} ${middleInitial} ${String(r.last_name ?? '').toUpperCase()}`.replace(/\s+/g, ' ').trim();

                return {
                    person_id: r.person_id,
                    person_code: r.person_code,
                    full_name: fullName,
                    birthdate: r.birthdate ? (new Date(r.birthdate)).toISOString().slice(0, 10) : null,
                    address: addressParts,
                };
            });
        } catch (e) {
            console.error('findHouseholdHeadByName exception', e);
            return [];
        }
    }

    async createHousehold(req: HouseholdCreationRequest) {
        const { data, error } = await supabase.rpc("insert_household", req);
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