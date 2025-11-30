import { supabase } from '@/constants/supabase'

// DTO for family_unit with comprehensive joins
export type FamilyUnitDto = {
    family_id: number
    family_num?: string | null
    ufc_num?: string | null
    source_of_income?: string | null
    created_date?: string | null
    is_active?: boolean
    family_mnthly_icnome_id?: number | null
    nhts_status_id?: number | null
    indigent_status_id?: number | null
    household_type_id?: number | null
    household_id?: number | null
    registration_method_id?: number | null
    family_head_id?: number | null
    added_by_id?: number | null
    is_quarterly_visited?: boolean
    visited_by_id?: number | null
    // Joined lookups
    income_range?: { income_range_id: number; income_range_amnt: string } | null
    nhts_status?: { nhts_status_id: number; nhts_status_name: string } | null
    indigent_status?: { indigent_status_id: number; indigent_status_name: string } | null
    household_type?: { household_type_id: number; household_type_name: string } | null
    registration_method?: { registration_method_id: number; registration_method_name: string } | null
    household?: {
        household_id: number
        household_num?: string | null
        house_number?: string | null
        address?: {
            address_id: number
            street?: string | null
            barangay?: string | null
            city?: string | null
            purok_sitio?: { purok_sitio_id: number; purok_sitio_code: string; purok_sitio_name: string } | null
        } | null
    } | null
    family_head?: {
        person_id: number
        person_code?: string | null
        first_name?: string | null
        middle_name?: string | null
        last_name?: string | null
        suffix?: string | null
        birthdate?: string | null
        age?: number | null
        sex?: { sex_id: number; sex_name: string } | null
        civil_status?: { civil_status_id: number; civil_status_name: string } | null
    } | null
    added_by?: {
        staff_id: number
        staff_code?: string | null
        person?: { person_id: number; first_name?: string; last_name?: string } | null
    } | null
    visited_by?: {
        staff_id: number
        staff_code?: string | null
        person?: { person_id: number; first_name?: string; last_name?: string } | null
    } | null
    house_member?: HouseMemberDto[]
}

export type HouseMemberDto = {
    house_member_id: number
    date_joined?: string | null
    is_active?: boolean
    family_id?: number | null
    relationship_to_hholdhead_id?: number | null
    relationship_to_family_head_id?: number | null
    registration_method_id?: number | null
    person_id?: number | null
    added_by_id?: number | null
    is_quarterly_confirmed?: boolean
    quarterly_confirmed_by_id?: number | null
    // Joined lookups
    relationship_to_hhold_head?: { relationship_id: number; relationship_name: string } | null
    relationship_to_fam_head?: { relationship_id: number; relationship_name: string } | null
    person?: {
        person_id: number
        person_code?: string | null
        first_name?: string | null
        middle_name?: string | null
        last_name?: string | null
        suffix?: string | null
        birthdate?: string | null
        age?: number | null
        sex?: { sex_id: number; sex_name: string } | null
        civil_status?: { civil_status_id: number; civil_status_name: string } | null
    } | null
}

export class FamilyQuery {
    private readonly SELECT_FAMILY = `
        family_id, family_num, ufc_num, source_of_income, created_date, is_active,
        family_mnthly_icnome_id, nhts_status_id, indigent_status_id, household_type_id,
        household_id, registration_method_id, family_head_id, added_by_id,
        is_quarterly_visited, visited_by_id,
        income_range:family_mnthly_icnome_id (income_range_id, income_range_amnt),
        nhts_status:nhts_status_id (nhts_status_id, nhts_status_name),
        indigent_status:indigent_status_id (indigent_status_id, indigent_status_name),
        household_type:household_type_id (household_type_id, household_type_name),
        registration_method:registration_method_id (registration_method_id, registration_method_name),
        household:household_id (
            household_id, household_num, house_number,
            addresss:address_id (
                address_id, street, barangay, city,
                purok_sitio:purok_sitio_id (purok_sitio_id, purok_sitio_code, purok_sitio_name)
            )
        ),
        family_head:family_head_id (
            person_id, person_code, first_name, middle_name, last_name, suffix, birthdate, age,
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
        house_member (
            house_member_id, date_joined, is_active, family_id,
            relationship_to_hholdhead_id, relationship_to_family_head_id,
            registration_method_id, person_id, added_by_id,
            is_quarterly_confirmed, quarterly_confirmed_by_id,
            relationship_to_hhold_head:relationship_to_hholdhead_id (relationship_id, relationship_name),
            relationship_to_fam_head:relationship_to_family_head_id (relationship_id, relationship_name),
            person:person_id (
                person_id, person_code, first_name, middle_name, last_name, suffix, birthdate, age,
                sex:sex_id (sex_id, sex_name),
                civil_status:civil_status_id (civil_status_id, civil_status_name)
            )
        )
    `

    /**
     * Fetch all family units
     */
    async FetchAllFamilies(): Promise<FamilyUnitDto[]> {
        try {
            const { data, error } = await supabase
                .from('family_unit')
                .select(this.SELECT_FAMILY)
                .order('family_id', { ascending: true })

            if (error) {
                console.error('FetchAllFamilies error:', error)
                throw new Error(error.message)
            }

            return (data ?? []) as unknown as FamilyUnitDto[]
        } catch (e: any) {
            console.error('FetchAllFamilies exception:', e)
            throw e
        }
    }
    
    /**
     * Fetch all active family units
     */
    async FetchAllActiveFamilies(): Promise<FamilyUnitDto[]> {
        try {
            const { data, error } = await supabase
                .from('family_unit')
                .select(this.SELECT_FAMILY)
                .eq('is_active', true)
                .order('family_id', { ascending: true })

            if (error) {
                console.error('FetchAllActiveFamilies error:', error)
                throw new Error(error.message)
            }

            return (data ?? []) as unknown as FamilyUnitDto[]
        } catch (e: any) {
            console.error('FetchAllActiveFamilies exception:', e)
            throw e
        }
    }

    /**
     * Fetch family unit by family_id
     */
    async FetchFamilyById(familyId: number): Promise<FamilyUnitDto | null> {
        try {
            const { data, error } = await supabase
                .from('family_unit')
                .select(this.SELECT_FAMILY)
                .eq('family_id', familyId)
                .maybeSingle()

            if (error) {
                console.error('FetchFamilyById error:', error)
                throw new Error(error.message)
            }

            return data as unknown as FamilyUnitDto | null
        } catch (e: any) {
            console.error('FetchFamilyById exception:', e)
            throw e
        }
    }

    /**
     * Fetch active family unit by family_id
     */
    async FetchActiveFamilyById(familyId: number): Promise<FamilyUnitDto | null> {
        try {
            const { data, error } = await supabase
                .from('family_unit')
                .select(this.SELECT_FAMILY)
                .eq('family_id', familyId)
                .eq('is_active', true)
                .maybeSingle()

            if (error) {
                console.error('FetchActiveFamilyById error:', error)
                throw new Error(error.message)
            }

            return data as unknown as FamilyUnitDto | null
        } catch (e: any) {
            console.error('FetchActiveFamilyById exception:', e)
            throw e
        }
    }

    /**
     * Fetch family unit by family_num
     */
    async FetchFamilyByFamilyNum(familyNum: string): Promise<FamilyUnitDto | null> {
        try {
            const { data, error } = await supabase
                .from('family_unit')
                .select(this.SELECT_FAMILY)
                .eq('family_num', familyNum)
                .maybeSingle()

            if (error) {
                console.error('FetchFamilyByFamilyNum error:', error)
                throw new Error(error.message)
            }

            return data as unknown as FamilyUnitDto | null
        } catch (e: any) {
            console.error('FetchFamilyByFamilyNum exception:', e)
            throw e
        }
    }

    /**
     * Fetch family unit by family_num
     */
    async FetchActiveFamilyByFamilyNum(familyNum: string): Promise<FamilyUnitDto | null> {
        try {
            const { data, error } = await supabase
                .from('family_unit')
                .select(this.SELECT_FAMILY)
                .eq('family_num', familyNum)
                .eq('is_active', true)
                .maybeSingle()

            if (error) {
                console.error('FetchActiveFamilyByFamilyNum error:', error)
                throw new Error(error.message)
            }

            return data as unknown as FamilyUnitDto | null
        } catch (e: any) {
            console.error('FetchFamilyByFamilyNum exception:', e)
            throw e
        }
    }

    /**
     * Fetch family unit by UFC number
     */
    async FetchFamilyByUfcNum(ufcNum: string): Promise<FamilyUnitDto | null> {
        try {
            const { data, error } = await supabase
                .from('family_unit')
                .select(this.SELECT_FAMILY)
                .eq('ufc_num', ufcNum)
                .maybeSingle()

            if (error) {
                console.error('FetchFamilyByUfcNum error:', error)
                throw new Error(error.message)
            }

            return data as unknown as FamilyUnitDto | null
        } catch (e: any) {
            console.error('FetchFamilyByUfcNum exception:', e)
            throw e
        }
    }

    /**
     * Fetch family unit by UFC number
     */
    async FetchActiveFamilyByUfcNum(ufcNum: string): Promise<FamilyUnitDto | null> {
        try {
            const { data, error } = await supabase
                .from('family_unit')
                .select(this.SELECT_FAMILY)
                .eq('ufc_num', ufcNum)
                .eq('is_active', true)
                .maybeSingle()

            if (error) {
                console.error('FetchActiveFamilyByUfcNum error:', error)
                throw new Error(error.message)
            }

            return data as unknown as FamilyUnitDto | null
        } catch (e: any) {
            console.error('FetchFamilyByUfcNum exception:', e)
            throw e
        }
    }


    /**
     * Fetch all families by household_id
     */
    async FetchFamiliesByHouseholdId(householdId: number): Promise<FamilyUnitDto[]> {
        try {
            const { data, error } = await supabase
                .from('family_unit')
                .select(this.SELECT_FAMILY)
                .eq('household_id', householdId)
                .order('family_id', { ascending: true })

            if (error) {
                console.error('FetchFamiliesByHouseholdId error:', error)
                throw new Error(error.message)
            }

            return (data ?? []) as unknown as FamilyUnitDto[]
        } catch (e: any) {
            console.error('FetchFamiliesByHouseholdId exception:', e)
            throw e
        }
    }

    /**
     * Fetch all active families by household_id
     */
    async FetchActiveFamiliesByHouseholdId(householdId: number): Promise<FamilyUnitDto[]> {
        try {
            const { data, error } = await supabase
                .from('family_unit')
                .select(this.SELECT_FAMILY)
                .eq('household_id', householdId)
                .eq('is_active', true)
                .order('family_id', { ascending: true })

            if (error) {
                console.error('FetchActiveFamiliesByHouseholdId error:', error)
                throw new Error(error.message)
            }

            return (data ?? []) as unknown as FamilyUnitDto[]
        } catch (e: any) {
            console.error('FetchActiveFamiliesByHouseholdId exception:', e)
            throw e
        }
    }

    /**
     * Fetch all house_member records for a given family_id (no is_active filter)
     */
    async FetchAllFamilyMemberByFamilyId(familyId: number): Promise<HouseMemberDto[]> {
        const SELECT_MEMBER = `
            house_member_id, date_joined, is_active, family_id,
            relationship_to_hholdhead_id, relationship_to_family_head_id,
            registration_method_id, person_id, added_by_id,
            is_quarterly_confirmed, quarterly_confirmed_by_id,
            relationship_to_hhold_head:relationship_to_hholdhead_id (relationship_id, relationship_name),
            relationship_to_fam_head:relationship_to_family_head_id (relationship_id, relationship_name),
            person:person_id (
                person_id, person_code, first_name, middle_name, last_name, suffix, birthdate, age, 
                person_status:person_status_id(person_status_id, person_status_name), 
                residential_status:residential_status_id(residential_status_id, residential_status_name),
                sex:sex_id (sex_id, sex_name),
                civil_status:civil_status_id (civil_status_id, civil_status_name)
            )
        `;

        try {
            const { data, error } = await supabase
                .from('house_member')
                .select(SELECT_MEMBER)
                .eq('family_id', familyId)
                .order('house_member_id', { ascending: true });

            if (error) {
                console.error('FetchAllFamilyMemberByFamilyId error:', error)
                throw new Error(error.message)
            }

            return (data ?? []) as unknown as HouseMemberDto[]
        } catch (e: any) {
            console.error('FetchAllFamilyMemberByFamilyId exception:', e)
            throw e
        }
    }

    /**
     * Fetch family unit by family_head_id
     */
    async FetchFamilyByFamilyHeadId(familyHeadId: number): Promise<FamilyUnitDto | null> {
        try {
            const { data, error } = await supabase
                .from('family_unit')
                .select(this.SELECT_FAMILY)
                .eq('family_head_id', familyHeadId)
                .maybeSingle()

            if (error) {
                console.error('FetchFamilyByFamilyHeadId error:', error)
                throw new Error(error.message)
            }

            return data as unknown as FamilyUnitDto | null
        } catch (e: any) {
            console.error('FetchFamilyByFamilyHeadId exception:', e)
            throw e
        }
    }

    /**
     * Fetch active family unit by family_head_id
     */
    async FetchActiveFamilyByFamilyHeadId(familyHeadId: number): Promise<FamilyUnitDto | null> {
        try {
            const { data, error } = await supabase
                .from('family_unit')
                .select(this.SELECT_FAMILY)
                .eq('family_head_id', familyHeadId)
                .eq('is_active', true)
                .maybeSingle()

            if (error) {
                console.error('FetchActiveFamilyByFamilyHeadId error:', error)
                throw new Error(error.message)
            }

            return data as unknown as FamilyUnitDto | null
        } catch (e: any) {
            console.error('FetchActiveFamilyByFamilyHeadId exception:', e)
            throw e
        }
    }

    /**
     * Fetch families by NHTS status
     */
    async FetchFamiliesByNhtsStatus(nhtsStatusId: number): Promise<FamilyUnitDto[]> {
        try {
            const { data, error } = await supabase
                .from('family_unit')
                .select(this.SELECT_FAMILY)
                .eq('nhts_status_id', nhtsStatusId)
                .eq('is_active', true)
                .order('family_id', { ascending: true })

            if (error) {
                console.error('FetchFamiliesByNhtsStatus error:', error)
                throw new Error(error.message)
            }

            return (data ?? []) as unknown as FamilyUnitDto[]
        } catch (e: any) {
            console.error('FetchFamiliesByNhtsStatus exception:', e)
            throw e
        }
    }

    /**
     * Fetch families by indigent status
     */
    async FetchFamiliesByIndigentStatus(indigentStatusId: number): Promise<FamilyUnitDto[]> {
        try {
            const { data, error } = await supabase
                .from('family_unit')
                .select(this.SELECT_FAMILY)
                .eq('indigent_status_id', indigentStatusId)
                .eq('is_active', true)
                .order('family_id', { ascending: true })

            if (error) {
                console.error('FetchFamiliesByIndigentStatus error:', error)
                throw new Error(error.message)
            }

            return (data ?? []) as unknown as FamilyUnitDto[]
        } catch (e: any) {
            console.error('FetchFamiliesByIndigentStatus exception:', e)
            throw e
        }
    }

    /**
     * Fetch families pending quarterly visit
     */
    async FetchFamiliesPendingQuarterlyVisit(): Promise<FamilyUnitDto[]> {
        try {
            const { data, error } = await supabase
                .from('family_unit')
                .select(this.SELECT_FAMILY)
                .eq('is_active', true)
                .eq('is_quarterly_visited', false)
                .order('family_id', { ascending: true })

            if (error) {
                console.error('FetchFamiliesPendingQuarterlyVisit error:', error)
                throw new Error(error.message)
            }

            return (data ?? []) as unknown as FamilyUnitDto[]
        } catch (e: any) {
            console.error('FetchFamiliesPendingQuarterlyVisit exception:', e)
            throw e
        }
    }

    /**
     * Fetch families by income range
     */
    async FetchFamiliesByIncomeRange(incomeRangeId: number): Promise<FamilyUnitDto[]> {
        try {
            const { data, error } = await supabase
                .from('family_unit')
                .select(this.SELECT_FAMILY)
                .eq('family_mnthly_icnome_id', incomeRangeId)
                .eq('is_active', true)
                .order('family_id', { ascending: true })

            if (error) {
                console.error('FetchFamiliesByIncomeRange error:', error)
                throw new Error(error.message)
            }

            return (data ?? []) as unknown as FamilyUnitDto[]
        } catch (e: any) {
            console.error('FetchFamiliesByIncomeRange exception:', e)
            throw e
        }
    }

    /**
     * Fetch families by household type
     */
    async FetchFamiliesByHouseholdType(householdTypeId: number): Promise<FamilyUnitDto[]> {
        try {
            const { data, error } = await supabase
                .from('family_unit')
                .select(this.SELECT_FAMILY)
                .eq('household_type_id', householdTypeId)
                .eq('is_active', true)
                .order('family_id', { ascending: true })

            if (error) {
                console.error('FetchFamiliesByHouseholdType error:', error)
                throw new Error(error.message)
            }

            return (data ?? []) as unknown as FamilyUnitDto[]
        } catch (e: any) {
            console.error('FetchFamiliesByHouseholdType exception:', e)
            throw e
        }
    }
}