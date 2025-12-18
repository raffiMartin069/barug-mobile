// Initial raw DB response interfaces for maternal-related joins.
// These are a scaffold to tighten the Supabase normalizers and repository mappers.

export interface RawChildImmunization {
    child_immunization_id: number
    child_record_id?: number
    date_given: string | null
    immunization_type_id?: number | null
    immunization_stage_given_id?: number | null
    // Supabase join names used in queries: `immunization_type` and `immunization_stage`
    immunization_type?: { immunization_type_id?: number; immunization_type_name?: string } | any
    immunization_stage?: { immunization_stage_given_id?: number; immunization_stage_name?: string } | any
}

export interface RawChildMonitoringLog {
    child_monitoring_log_id?: number
    child_monitoring_id?: number
    id?: number
    child_record_id?: number
    check_date: string | null
    weight: number | null
    height: number | null
    muac: number | null
    notes?: string | null
}

export interface RawChildHealthRecord {
    child_record_id: number
    person?: { person_id?: number; first_name?: string; middle_name?: string; last_name?: string; suffix?: string } | any
    person_id?: number
    mother_id?: number
    father_id?: number
    created_at?: string | null
    birth_order?: string | number | null
    immunizations?: RawChildImmunization[] | any
    monitoring_logs?: RawChildMonitoringLog[] | any
}

// Add more raw shapes as needed when tightening normalizers.
