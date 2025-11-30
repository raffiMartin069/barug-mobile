import { supabase } from "@/constants/supabase";

// Comprehensive DTO for household with all joins and nested families/members
export type HouseholdDto = {
    household_id: number;
    household_num?: string | null;
    house_number?: string | null;
    created_date?: string | null;
    is_active?: boolean;
    household_head_id?: number | null;
    house_type_id?: number | null;
    house_ownership_id?: number | null;
    address_id?: number | null;
    registration_method_id?: number | null;
    added_by_id?: number | null;
    is_quarterly_visited?: boolean;
    visited_by_id?: number | null;
    // Joined lookups
    house_type?: { house_type_id: number; house_type_name: string } | null;
    house_ownership?: { house_ownership_id: number; house_ownership_name: string } | null;
    registration_method?: { registration_method_id: number; registration_method_name: string } | null;
    addresss?: {
        address_id: number;
        latitude?: string | null;
        longitude?: string | null;
        street?: string | null;
        barangay?: string | null;
        city?: string | null;
        purok_sitio_id?: number | null;
        purok_sitio?: { purok_sitio_id: number; purok_sitio_code: string; purok_sitio_name: string } | null;
    } | null;
    household_head?: {
        person_id: number;
        person_code?: string | null;
        first_name?: string | null;
        middle_name?: string | null;
        last_name?: string | null;
        suffix?: string | null;
        birthdate?: string | null;
        sex?: { sex_id: number; sex_name: string } | null;
        civil_status?: { civil_status_id: number; civil_status_name: string } | null;
    } | null;
    added_by?: {
        staff_id: number;
        staff_code?: string | null;
        person?: { person_id: number; first_name?: string; last_name?: string } | null;
    } | null;
    visited_by?: {
        staff_id: number;
        staff_code?: string | null;
        person?: { person_id: number; first_name?: string; last_name?: string } | null;
    } | null;
    family_unit?: FamilyUnitDto[];
};

export type FamilyUnitDto = {
    family_id: number;
    family_num?: string | null;
    ufc_num?: string | null;
    source_of_income?: string | null;
    created_date?: string | null;
    is_active?: boolean;
    family_mnthly_icnome_id?: number | null;
    nhts_status_id?: number | null;
    indigent_status_id?: number | null;
    household_type_id?: number | null;
    household_id?: number | null;
    registration_method_id?: number | null;
    family_head_id?: number | null;
    added_by_id?: number | null;
    is_quarterly_visited?: boolean;
    visited_by_id?: number | null;
    // Joined lookups
    income_range?: { income_range_id: number; income_range_amnt: string } | null;
    nhts_status?: { nhts_status_id: number; nhts_status_name: string } | null;
    indigent_status?: { indigent_status_id: number; indigent_status_name: string } | null;
    household_type?: { household_type_id: number; household_type_name: string } | null;
    registration_method?: { registration_method_id: number; registration_method_name: string } | null;
    family_head?: {
        person_id: number;
        person_code?: string | null;
        first_name?: string | null;
        middle_name?: string | null;
        last_name?: string | null;
        suffix?: string | null;
        birthdate?: string | null;
        sex?: { sex_id: number; sex_name: string } | null;
    } | null;
    added_by?: {
        staff_id: number;
        staff_code?: string | null;
        person?: { person_id: number; first_name?: string; last_name?: string } | null;
    } | null;
    visited_by?: {
        staff_id: number;
        staff_code?: string | null;
        person?: { person_id: number; first_name?: string; last_name?: string } | null;
    } | null;
    house_member?: HouseMemberDto[];
};

export type HouseMemberDto = {
    house_member_id: number;
    date_joined?: string | null;
    is_active?: boolean;
    family_id?: number | null;
    relationship_to_hholdhead_id?: number | null;
    relationship_to_family_head_id?: number | null;
    registration_method_id?: number | null;
    person_id?: number | null;
    added_by_id?: number | null;
    is_quarterly_confirmed?: boolean;
    quarterly_confirmed_by_id?: number | null;
    // Joined lookups
    relationship_to_hhold_head?: { relationship_id: number; relationship_name: string } | null;
    relationship_to_fam_head?: { relationship_id: number; relationship_name: string } | null;
    registration_method?: { registration_method_id: number; registration_method_name: string } | null;
    person?: {
        person_id: number;
        person_code?: string | null;
        first_name?: string | null;
        middle_name?: string | null;
        last_name?: string | null;
        suffix?: string | null;
        birthdate?: string | null;
        age?: number | null;
        sex?: { sex_id: number; sex_name: string } | null;
        civil_status?: { civil_status_id: number; civil_status_name: string } | null;
        person_status?: { person_status_id: number; person_status_name: string } | null;
        residential_status?: { residential_status_id: number; residential_status_name: string } | null;
    } | null;
    added_by?: {
        staff_id: number;
        staff_code?: string | null;
        person?: { person_id: number; first_name?: string; last_name?: string } | null;
    } | null;
    quarterly_confirmed_by?: {
        staff_id: number;
        staff_code?: string | null;
        person?: { person_id: number; first_name?: string; last_name?: string } | null;
    } | null;
};

import { FamilyQuery } from '@/repository/queries/FamilyQuery'

export class HouseholdCommand {
    private readonly SELECT_QUERY = `
        household_id, household_num, house_number, created_date, is_active,
        household_head_id, house_type_id, house_ownership_id, address_id,
        registration_method_id, added_by_id, is_quarterly_visited, visited_by_id,
        house_type:house_type_id (house_type_id, house_type_name),
        house_ownership:house_ownership_id (house_ownership_id, house_ownership_name),
        registration_method:registration_method_id (registration_method_id, registration_method_name),
        addresss:address_id (
            address_id, latitude, longitude, street, barangay, city, purok_sitio_id,
            purok_sitio:purok_sitio_id (purok_sitio_id, purok_sitio_code, purok_sitio_name)
        ),
        household_head:household_head_id (
            person_id, person_code, first_name, middle_name, last_name, suffix, birthdate,
            sex:sex_id (sex_id, sex_name),
            civil_status:civil_status_id (civil_status_id, civil_status_name)
        ),
        added_by:added_by_id (
            staff_id, staff_code,
            person:person_id (person_id, first_name, last_name)
        ),
        visited_by:visited_by_id (
            staff_id, staff_code,
            person:person_id (person_id, first_name, last_name)
        ),
        family_unit (
            family_id, family_num, ufc_num, source_of_income, created_date, is_active,
            family_mnthly_icnome_id, nhts_status_id, indigent_status_id, household_type_id,
            household_id, registration_method_id, family_head_id, added_by_id,
            is_quarterly_visited, visited_by_id,
            income_range:family_mnthly_icnome_id (income_range_id, income_range_amnt),
            nhts_status:nhts_status_id (nhts_status_id, nhts_status_name),
            indigent_status:indigent_status_id (indigent_status_id, indigent_status_name),
            household_type:household_type_id (household_type_id, household_type_name),
            registration_method:registration_method_id (registration_method_id, registration_method_name),
            family_head:family_head_id (
                person_id, person_code, first_name, middle_name, last_name, suffix, birthdate,
                sex:sex_id (sex_id, sex_name)
            ),
            added_by:added_by_id (
                staff_id, staff_code,
                person:person_id (person_id, first_name, last_name)
            ),
            visited_by:visited_by_id (
                staff_id, staff_code,
                person:person_id (person_id, first_name, last_name)
            ),
            house_member (
                house_member_id, date_joined, is_active, family_id,
                relationship_to_hholdhead_id, relationship_to_family_head_id,
                registration_method_id, person_id, added_by_id,
                is_quarterly_confirmed, quarterly_confirmed_by_id,
                relationship_to_hhold_head:relationship_to_hholdhead_id (relationship_id, relationship_name),
                relationship_to_fam_head:relationship_to_family_head_id (relationship_id, relationship_name),
                registration_method:registration_method_id (registration_method_id, registration_method_name),
                person:person_id (
                    person_id, person_code, first_name, middle_name, last_name, suffix, birthdate, age,
                    sex:sex_id (sex_id, sex_name),
                    civil_status:civil_status_id (civil_status_id, civil_status_name),
                    person_status:person_status_id (person_status_id, person_status_name),
                    residential_status:residential_status_id (residential_status_id, residential_status_name)
                ),
                added_by:added_by_id (
                    staff_id, staff_code,
                    person:person_id (person_id, first_name, last_name)
                ),
                quarterly_confirmed_by:quarterly_confirmed_by_id (
                    staff_id, staff_code,
                    person:person_id (person_id, first_name, last_name)
                )
            )
        )
    `;

    /**
     * Fetch all households with full details (no filters)
     */
    async FetchAllHousehold(): Promise<HouseholdDto[]> {
        try {
            const { data, error } = await supabase
                .from('household_info')
                .select(this.SELECT_QUERY)
                .order('household_id', { ascending: true });

            if (error) {
                console.error('FetchAllHousehold error:', error);
                throw new Error(error.message);
            }

            return (data ?? []) as unknown as HouseholdDto[];
        } catch (e: any) {
            console.error('FetchAllHousehold exception:', e);
            throw e;
        }
    }

    /**
     * Fetch single household by household_id
     */
    async FetchHouseholdById(householdId: number): Promise<HouseholdDto | null> {
        try {
            const { data, error } = await supabase
                .from('household_info')
                .select(this.SELECT_QUERY)
                .eq('household_id', householdId)
                .maybeSingle();

            if (error) {
                console.error('FetchHouseholdById error:', error);
                throw new Error(error.message);
            }

            return (data as unknown as HouseholdDto | null);
        } catch (e: any) {
            console.error('FetchHouseholdById exception:', e);
            throw e;
        }
    }

    /**
     * Fetch single household by household_num
     */
    async FetchHouseholdByHouseholdNumber(householdNum: string): Promise<HouseholdDto | null> {
        try {
            const { data, error } = await supabase
                .from('household_info')
                .select(this.SELECT_QUERY)
                .eq('household_num', householdNum)
                .maybeSingle();

            if (error) {
                console.error('FetchHouseholdByHouseholdNumber error:', error);
                throw new Error(error.message);
            }

            return (data as unknown as HouseholdDto | null);
        } catch (e: any) {
            console.error('FetchHouseholdByHouseholdNumber exception:', e);
            throw e;
        }
    }

    /**
     * Fetch all active households (is_active = true)
     */
    async FetchAllActiveHousehold(): Promise<HouseholdDto[]> {
        try {
            const { data, error } = await supabase
                .from('household_info')
                .select(this.SELECT_QUERY)
                .eq('is_active', true)
                .order('household_id', { ascending: true });

            if (error) {
                console.error('FetchAllActiveHousehold error:', error);
                throw new Error(error.message);
            }

            return (data ?? []) as unknown as HouseholdDto[];
        } catch (e: any) {
            console.error('FetchAllActiveHousehold exception:', e);
            throw e;
        }
    }

    /**
     * Fetch active household by household_id
     */
    async FetchActiveHouseholdById(householdId: number): Promise<HouseholdDto | null> {
        try {
            const { data, error } = await supabase
                .from('household_info')
                .select(this.SELECT_QUERY)
                .eq('household_id', householdId)
                .eq('is_active', true)
                .maybeSingle();

            if (error) {
                console.error('FetchActiveHouseholdById error:', error);
                throw new Error(error.message);
            }

            return (data as unknown as HouseholdDto | null);
        } catch (e: any) {
            console.error('FetchActiveHouseholdById exception:', e);
            throw e;
        }
    }

    /**
     * Fetch active household by household_num
     */
    async FetchActiveHouseholdByHouseholdNumber(householdNum: string): Promise<HouseholdDto | null> {
        try {
            const { data, error } = await supabase
                .from('household_info')
                .select(this.SELECT_QUERY)
                .eq('household_num', householdNum)
                .eq('is_active', true)
                .maybeSingle();

            if (error) {
                console.error('FetchActiveHouseholdByHouseholdNumber error:', error);
                throw new Error(error.message);
            }

            return (data as unknown as HouseholdDto | null);
        } catch (e: any) {
            console.error('FetchActiveHouseholdByHouseholdNumber exception:', e);
            throw e;
        }
    }

    /**
     * Fetch active household by household_head_id
     */
    async FetchActiveHouseholdByHouseholdHeadId(householdHeadId: number): Promise<HouseholdDto | null> {
        try {
            const { data, error } = await supabase
                .from('household_info')
                .select(this.SELECT_QUERY)
                .eq('household_head_id', householdHeadId)
                .eq('is_active', true)
                .maybeSingle();

            if (error) {
                console.error('FetchActiveHouseholdByHouseholdHeadId error:', error);
                throw new Error(error.message);
            }

            return (data as unknown as HouseholdDto | null);
        } catch (e: any) {
            console.error('FetchActiveHouseholdByHouseholdHeadId exception:', e);
            throw e;
        }
    }

    /**
     * Fetch household by household_head_id (any status)
     */
    async FetchHouseholdByHouseholdHeadId(householdHeadId: number): Promise<HouseholdDto | null> {
        try {
            const { data, error } = await supabase
                .from('household_info')
                .select(this.SELECT_QUERY)
                .eq('household_head_id', householdHeadId)
                .maybeSingle();

            if (error) {
                console.error('FetchHouseholdByHouseholdHeadId error:', error);
                throw new Error(error.message);
            }

            return (data as unknown as HouseholdDto | null);
        } catch (e: any) {
            console.error('FetchHouseholdByHouseholdHeadId exception:', e);
            throw e;
        }
    }

    /**
     * Fetch active house_member by person_id
     */
    async FetchActiveHouseMemberByPersonId(personId: number): Promise<HouseMemberDto | null> {
        const SELECT_MEMBER = `
            house_member_id, date_joined, is_active, family_id,
            relationship_to_hholdhead_id, relationship_to_family_head_id,
            registration_method_id, person_id, added_by_id,
            is_quarterly_confirmed, quarterly_confirmed_by_id,
            relationship_to_hhold_head:relationship_to_hholdhead_id (relationship_id, relationship_name),
            relationship_to_fam_head:relationship_to_family_head_id (relationship_id, relationship_name),
            registration_method:registration_method_id (registration_method_id, registration_method_name),
            person:person_id (
                person_id, person_code, first_name, middle_name, last_name, suffix, birthdate, age,
                sex:sex_id (sex_id, sex_name),
                civil_status:civil_status_id (civil_status_id, civil_status_name),
                person_status:person_status_id (person_status_id, person_status_name),
                residential_status:residential_status_id (residential_status_id, residential_status_name)
            ),
            added_by:added_by_id (
                staff_id, staff_code,
                person:person_id (person_id, first_name, last_name)
            ),
            quarterly_confirmed_by:quarterly_confirmed_by_id (
                staff_id, staff_code,
                person:person_id (person_id, first_name, last_name)
            )
        `;

        try {
            const { data, error } = await supabase
                .from('house_member')
                .select(SELECT_MEMBER)
                .eq('person_id', personId)
                .eq('is_active', true)
                .maybeSingle();

            if (error) {
                console.error('FetchActiveHouseMemberByPersonId error:', error);
                throw new Error(error.message);
            }

            return (data as unknown as HouseMemberDto | null);
        } catch (e: any) {
            console.error('FetchActiveHouseMemberByPersonId exception:', e);
            throw e;
        }
    }

    /**
     * Fetch active house_member by house_member_id
     */
    async FetchActiveHouseMemberById(houseMemberId: number): Promise<HouseMemberDto | null> {
        const SELECT_MEMBER = `
            house_member_id, date_joined, is_active, family_id,
            relationship_to_hholdhead_id, relationship_to_family_head_id,
            registration_method_id, person_id, added_by_id,
            is_quarterly_confirmed, quarterly_confirmed_by_id,
            relationship_to_hhold_head:relationship_to_hholdhead_id (relationship_id, relationship_name),
            relationship_to_fam_head:relationship_to_family_head_id (relationship_id, relationship_name),
            registration_method:registration_method_id (registration_method_id, registration_method_name),
            person:person_id (
                person_id, person_code, first_name, middle_name, last_name, suffix, birthdate, age,
                sex:sex_id (sex_id, sex_name),
                civil_status:civil_status_id (civil_status_id, civil_status_name),
                person_status:person_status_id (person_status_id, person_status_name),
                residential_status:residential_status_id (residential_status_id, residential_status_name)
            ),
            added_by:added_by_id (
                staff_id, staff_code,
                person:person_id (person_id, first_name, last_name)
            ),
            quarterly_confirmed_by:quarterly_confirmed_by_id (
                staff_id, staff_code,
                person:person_id (person_id, first_name, last_name)
            )
        `;

        try {
            const { data, error } = await supabase
                .from('house_member')
                .select(SELECT_MEMBER)
                .eq('house_member_id', houseMemberId)
                .eq('is_active', true)
                .maybeSingle();

            if (error) {
                console.error('FetchActiveHouseMemberById error:', error);
                throw new Error(error.message);
            }

            return (data as unknown as HouseMemberDto | null);
        } catch (e: any) {
            console.error('FetchActiveHouseMemberById exception:', e);
            throw e;
        }
    }

    /**
     * Fetch all active house_member records by family_id
     */
    async FetchAllActiveMemberByFamilyId(familyId: number): Promise<HouseMemberDto[]> {
        const SELECT_MEMBER = `
            house_member_id, date_joined, is_active, family_id,
            relationship_to_hholdhead_id, relationship_to_family_head_id,
            registration_method_id, person_id, added_by_id,
            is_quarterly_confirmed, quarterly_confirmed_by_id,
            relationship_to_hhold_head:relationship_to_hholdhead_id (relationship_id, relationship_name),
            relationship_to_fam_head:relationship_to_family_head_id (relationship_id, relationship_name),
            registration_method:registration_method_id (registration_method_id, registration_method_name),
            person:person_id (
                person_id, person_code, first_name, middle_name, last_name, suffix, birthdate, age,
                sex:sex_id (sex_id, sex_name),
                civil_status:civil_status_id (civil_status_id, civil_status_name),
                person_status:person_status_id (person_status_id, person_status_name),
                residential_status:residential_status_id (residential_status_id, residential_status_name)
            ),
            added_by:added_by_id (
                staff_id, staff_code,
                person:person_id (person_id, first_name, last_name)
            ),
            quarterly_confirmed_by:quarterly_confirmed_by_id (
                staff_id, staff_code,
                person:person_id (person_id, first_name, last_name)
            )
        `;

        try {
            const { data, error } = await supabase
                .from('house_member')
                .select(SELECT_MEMBER)
                .eq('family_id', familyId)
                .eq('is_active', true)
                .order('house_member_id', { ascending: true });

            if (error) {
                console.error('FetchAllActiveMemberByFamilyId error:', error);
                throw new Error(error.message);
            }

            return (data ?? []) as unknown as HouseMemberDto[];
        } catch (e: any) {
            console.error('FetchAllActiveMemberByFamilyId exception:', e);
            throw e;
        }
    }

    /**
     * Fetch all active members that belong to any family under a household number.
     * Steps:
     *  1. Resolve household by household number -> household_id
     *  2. Fetch families for that household
     *  3. For each family, fetch active members and aggregate
     */
    async FetchMembersByHouseholdNumber(householdNum: string): Promise<HouseMemberDto[]> {
        try {
            if (!householdNum) return [];

            const hh = await this.FetchHouseholdByHouseholdNumber(householdNum);
            if (!hh || !hh.household_id) return [];

            const householdId = Number(householdNum);
            if (!Number.isFinite(householdId)) return [];

            const fq = new FamilyQuery();
            const families = await fq.FetchFamiliesByHouseholdId(56);
            if (!Array.isArray(families) || families.length === 0) return [];

            const aggregated: HouseMemberDto[] = [];
            for (const fam of families) {
                try {
                    if (!fam || !fam.family_id) continue;
                    const members = await this.FetchAllActiveMemberByFamilyId(Number(fam.family_id));
                    if (Array.isArray(members) && members.length > 0) {
                        aggregated.push(...members);
                    }
                } catch (e) {
                    console.error('FetchMembersByHouseholdNumber - fetch family members error', e);
                    // continue to next family on error
                }
            }

            return aggregated;
        } catch (e: any) {
            console.error('FetchMembersByHouseholdNumber exception:', e);
            throw e;
        }
    }
}