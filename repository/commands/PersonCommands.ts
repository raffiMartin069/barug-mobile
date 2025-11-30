import { supabase } from "@/constants/supabase";

// DTO type for person with all joined lookup tables
export type PersonDto = {
    person_id: number;
    supabase_uid?: string | null;
    person_code?: string | null;
    person_img?: string | null;
    last_name?: string | null;
    first_name?: string | null;
    middle_name?: string | null;
    suffix?: string | null;
    birthdate?: string | null;
    date_added?: string | null;
    official_reg_date?: string | null;
    email?: string | null;
    mobile_num?: string | null;
    occupation?: string | null;
    is_email_verified?: boolean;
    is_business_owner?: boolean;
    is_id_valid?: boolean;
    residency_period?: number | null;
    mpin_set?: boolean;
    is_student?: boolean;
    is_minor?: boolean;
    age?: number | null;
    // FK IDs
    mnthly_personal_income_id?: number | null;
    sex_id?: number | null;
    address_id?: number | null;
    person_status_id?: number | null;
    residential_status_id?: number | null;
    civil_status_id?: number | null;
    nationality_id?: number | null;
    religion_id?: number | null;
    education_id?: number | null;
    employment_status_id?: number | null;
    registration_method_id?: number | null;
    added_by_id?: number | null;
    // Joined lookups (Supabase returns nested arrays for related rows)
    income_range?: { income_range_id: number; income_range_amnt: string }[] | null;
    sex?: { sex_id: number; sex_name: string }[] | null;
    person_status?: { person_status_id: number; person_status_name: string }[] | null;
    residential_status?: { residential_status_id: number; residential_status_name: string }[] | null;
    civil_status?: { civil_status_id: number; civil_status_name: string }[] | null;
    nationality?: { nationality_id: number; nationality_name: string }[] | null;
    religion?: { religion_id: number; religion_name: string }[] | null;
    education?: { education_id: number; educ_level: string }[] | null;
    employment_status?: { employment_status_id: number; employment_status_name: string }[] | null;
    registration_method?: { registration_method_id: number; registration_method_name: string }[] | null;
    addresss?: {
        address_id: number;
        latitude?: string | null;
        longitude?: string | null;
        street?: string | null;
        barangay?: string | null;
        city?: string | null;
        purok_sitio_id?: number | null;
        purok_sitio?: { purok_sitio_id: number; purok_sitio_code: string; purok_sitio_name: string }[] | null;
    }[] | null;
    added_by?: {
        staff_id: number;
        staff_code?: string | null;
        person?: { person_id: number; first_name?: string; last_name?: string }[] | null;
    }[] | null;
};

export class PersonCommands {
    private readonly SELECT_QUERY = `
        person_id, supabase_uid, person_code, person_img,
        last_name, first_name, middle_name, suffix, birthdate,
        date_added, official_reg_date, email, mobile_num, occupation,
        is_email_verified, is_business_owner, is_id_valid, residency_period,
        mpin_set, is_student, is_minor, age,
        mnthly_personal_income_id, sex_id, address_id, person_status_id,
        residential_status_id, civil_status_id, nationality_id, religion_id,
        education_id, employment_status_id, registration_method_id, added_by_id,
        income_range:mnthly_personal_income_id (income_range_id, income_range_amnt),
        sex:sex_id (sex_id, sex_name),
        person_status:person_status_id (person_status_id, person_status_name),
        residential_status:residential_status_id (residential_status_id, residential_status_name),
        civil_status:civil_status_id (civil_status_id, civil_status_name),
        nationality:nationality_id (nationality_id, nationality_name),
        religion:religion_id (religion_id, religion_name),
        education:education_id (education_id, educ_level),
        employment_status:employment_status_id (employment_status_id, employment_status_name),
        registration_method:registration_method_id (registration_method_id, registration_method_name),
        addresss:address_id (
            address_id, latitude, longitude, street, barangay, city, purok_sitio_id,
            purok_sitio:purok_sitio_id (purok_sitio_id, purok_sitio_code, purok_sitio_name)
        ),
        added_by:added_by_id (
            staff_id, staff_code,
            person:person_id (person_id, first_name, last_name)
        )
    `;

    /**
     * Fetch all persons with full details (no filters)
     */
    async FetchAll(): Promise<PersonDto[]> {
        try {
            const { data, error } = await supabase
                .from('person')
                .select(this.SELECT_QUERY)
                .order('person_id', { ascending: true });

            if (error) {
                console.error('FetchAll error:', error);
                throw new Error(error.message);
            }

            return (data ?? []) as PersonDto[];
        } catch (e: any) {
            console.error('FetchAll exception:', e);
            throw e;
        }
    }

    /**
     * Fetch all active persons (person_status_id = 1)
     */
    async FetchAllActive(): Promise<PersonDto[]> {
        try {
            const { data, error } = await supabase
                .from('person')
                .select(this.SELECT_QUERY)
                .eq('person_status_id', 1)
                .order('person_id', { ascending: true });

            if (error) {
                console.error('FetchAllActive error:', error);
                throw new Error(error.message);
            }

            return (data ?? []) as PersonDto[];
        } catch (e: any) {
            console.error('FetchAllActive exception:', e);
            throw e;
        }
    }

    /**
     * Fetch all active residents (person_status_id = 1 AND residential_status_id = 2)
     */
    async FetchAllActiveResidents(): Promise<PersonDto[]> {
        try {
            const { data, error } = await supabase
                .from('person')
                .select(this.SELECT_QUERY)
                .eq('person_status_id', 1)
                .eq('residential_status_id', 2)
                .order('person_id', { ascending: true });

            if (error) {
                console.error('FetchAllActiveResidents error:', error);
                throw new Error(error.message);
            }

            return (data ?? []) as PersonDto[];
        } catch (e: any) {
            console.error('FetchAllActiveResidents exception:', e);
            throw e;
        }
    }

    /**
     * Fetch single active resident by person_id
     * (person_status_id = 1 AND residential_status_id = 2)
     */
    async FetchActiveResidentByPersonId(personId: number): Promise<PersonDto | null> {
        try {
            const { data, error } = await supabase
                .from('person')
                .select(this.SELECT_QUERY)
                .eq('person_id', personId)
                .eq('person_status_id', 1)
                .eq('residential_status_id', 2)
                .maybeSingle();

            if (error) {
                console.error('FetchActiveResidentByPersonId error:', error);
                throw new Error(error.message);
            }

            return (data as PersonDto | null);
        } catch (e: any) {
            console.error('FetchActiveResidentByPersonId exception:', e);
            throw e;
        }
    }

    /**
     * Fetch single resident by person_id (residential_status_id = 2, any person_status)
     */
    async FetchResidentByPersonId(personId: number): Promise<PersonDto | null> {
        try {
            const { data, error } = await supabase
                .from('person')
                .select(this.SELECT_QUERY)
                .eq('person_id', personId)
                .eq('residential_status_id', 2)
                .maybeSingle();

            if (error) {
                console.error('FetchResidentByPersonId error:', error);
                throw new Error(error.message);
            }

            return (data as PersonDto | null);
        } catch (e: any) {
            console.error('FetchResidentByPersonId exception:', e);
            throw e;
        }
    }
}