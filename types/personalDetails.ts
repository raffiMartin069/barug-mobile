export type PersonalDetails = {
    person_id: string;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    suffix: string | null;
    sex: string;
    birthdate: string;
    civil_status: string;
    nationality: string;
    religion: string;
    education: string;
    employment_status: string;
    occupation: string | null;
    personal_monthly_income: string | null;
    gov_program: string;
    front_id_file?: string;
    back_id_file?: string;
    selfie_id_file?: string;
    profile_picture?: string;
    residency_status?: string;
}