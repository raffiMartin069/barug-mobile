
export type PersonLite = {
    person_id: number;
    first_name?: string | null;
    middle_name?: string | null;
    last_name?: string | null;
    suffix?: string | null;
    birthdate?: string | null;
    sex_id?: number | null;
    person_img?: string | null;
    mobile_num?: string | null;
};

export type FamilyLite = {
    family_id: number;
    family_num?: string | null;
    household_id?: number | null;
    family_head_id?: number | null;
    is_active?: boolean | null;
    created_date?: string | null;
    source_of_income?: string | null;
};

export type HouseholdLite = {
    household_id: number;
    household_num?: string | null;
    house_number?: string | null;
    household_head_id?: number | null;
    house_type_id?: number | null;
    house_ownership_id?: number | null;
    address_id?: number | null;
};

export type AddressLite = {
    address_id: number;
    street?: string | null;
    barangay?: string | null;
    city?: string | null;
    latitude?: string | null;
    longitude?: string | null;
    purok_sitio_id?: number | null;
};

export type PurokLite = {
    purok_sitio_id: number;
    purok_sitio_code?: string | null;
    purok_sitio_name?: string | null;
};
