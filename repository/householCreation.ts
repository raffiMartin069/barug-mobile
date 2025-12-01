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

    async FindHouseholdMembersByKey(householdId: string | number, key?: string) {
        try {
            const hid = String(householdId ?? '').trim();
            if (!hid) return [];

            const q = String(key ?? '').trim().toLowerCase();

            // Fetch house members with their person payload. We consider a member active
            // if `is_active` is true or `member_status_id` = 1 (common patterns in DB).
            const { data, error } = await supabase
                .from('house_member')
                .select('person (person_id, person_code, first_name, middle_name, last_name, birthdate, addresss (street, barangay, city))')
                .eq('household_id', hid)
                .or('is_active.eq.true,member_status_id.eq.1')
                .limit(200);

            if (error) {
                console.warn('FindHouseholdMembersByKey supabase error', error);
                return [];
            }

            const rows = (data ?? []).map((r: any) => r.person).filter(Boolean);

            const mapped = rows.map((r: any) => {
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
            }).filter(Boolean as any);

            if (!q) return mapped;

            return mapped.filter((p: any) => {
                const lc = (p.full_name || '').toLowerCase();
                const code = (p.person_code || '').toLowerCase();
                const addr = (p.address || '').toLowerCase();
                return lc.includes(q) || code.includes(q) || addr.includes(q);
            });
        } catch (e) {
            console.error('FindHouseholdMembersByKey exception', e);
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