export interface MaternalScheduleRow {
  id: number
  maternal_record_id: number
  scheduled_date: string
  scheduled_time: string
  status_id: number | null
  status_name: string | null
  visit_purpose: string | null
  notes: string | null
  fulfilled_visit_id: number | null
  date_time_completed: string | null
  created_at: string | null
  updated_at: string | null
}

export type PostpartumSchedule = MaternalScheduleRow
export type PrenatalSchedule = MaternalScheduleRow

export type MaternalScheduleGroup<T extends MaternalScheduleRow = MaternalScheduleRow> = {
  latest: T | null
  history: T[]
}

export interface MaternalRecordBase {
  maternal_record_id: number
  person_id: number
  created_at: string
  husband_id: number | null
  weight: number | null
  height: number | null
  bmi_status_id: number | null
  bmi_status_name: string | null
  record_status_id: number | null
  record_status_name: string | null
}

export interface MedicalHistory {
  medical_history_id: number
  maternal_record_id: number
  anc_visit_id: number | null
  previous_illness: string | null
  previous_hospitalization: string | null
  previous_preg_complication: string | null
}

export interface ObstetricHistory {
  obstetric_history_id: number
  maternal_record_id: number
  anc_visit_id: number | null
  num_children_born_alive: number | null
  num_children_living: number | null
  num_abortion: number | null
  num_stillbirth: number | null
  num_large_babies: number | null
  has_diabetes: boolean | null
}

export interface MaternalAncRow {
  anc_row_id: number
  anc_visit_id: number | null
  maternal_record_id: number
  anc_date: string | null
  aog_weeks: number | null
  aog_days: number | null
  weight_kg: number | null
  bp_systolic: number | null
  bp_diastolic: number | null
  leopolds_findings: string | null
  notes: string | null
}

export interface PlanAndBaseline {
  plan_and_baseline_id: number
  maternal_record_id: number
  anc_visit_id: number | null
  new_born_screening_plan: boolean | null
  place_of_delivery_plan: string | null
}

export interface PresentPregnancyStatus {
  preg_status_id: number
  maternal_record_id: number
  anc_visit_id: number | null
  gravida: number | null
  para: number | null
  is_fullterm: boolean | null
  is_preterm: boolean | null
  lmp: string | null
  edc: string | null
}

export interface LabResult {
  lab_result_id: number
  maternal_record_id: number
  anc_visit_id: number | null
  lab_test_id: number
  result: string | null
  result_img_path: string | null
  date_tested: string | null
}

export interface MaternalChecklist {
  maternal_checklist_id: number
  maternal_record_id: number
  anc_visit_id: number | null
  checklist_item_id: number
}

export interface RiskResponse {
  risk_response_id: number
  maternal_record_id: number
  anc_visit_id: number | null
  risk_category_id: number
}

export interface Micronutrient {
  micronutrients_id: number
  maternal_record_id: number
  anc_visit_id: number | null
  iron_start_date: string | null
  iron_end_date: string | null
  deworming_given_date: string | null
}

export interface PreviousPregnancyInfo {
  previous_pregnancy_info_id: number
  maternal_record_id: number
  anc_visit_id: number | null
  date_of_deliveries: string | null
  outcome: string | null
  baby_weight: number | null
  ballard_score: number | null
  apgar_score: number | null
  delivery_type_id: number | null
  baby_sex: number | null
}

export interface TTVaccineRecord {
  tt_id: number
  maternal_record_id: number
  anc_visit_id: number | null
  tt_type_id: number
  date_given: string
}

export interface TrimesterStageLite {
  trimester_stage_id: number | null
  trimester_stage_name: string | null
}

export interface VisitStatusLite {
  record_status_id: number | null
  record_status_name: string | null
}

export interface MaternalAncVisitDetail {
  anc_visit_id: number
  maternal_record_id: number
  visit_no: number | null
  visit_date: string
  created_at: string
  recorded_by_id: number | null
  assessed_by_id: number | null
  trimester_stage: TrimesterStageLite
  visit_status: VisitStatusLite
  anc_row: MaternalAncRow | null
  plan_and_baseline: PlanAndBaseline | null
  present_pregnancy_status: PresentPregnancyStatus | null
  lab_results: LabResult[]
  checklists: MaternalChecklist[]
  risk_responses: RiskResponse[]
  micronutrients: Micronutrient[]
  previous_pregnancies: PreviousPregnancyInfo[]
}

export interface MaternalRecordBundle extends MaternalRecordBase {
  medical_history: MedicalHistory | null
  obstetric_history: ObstetricHistory | null
  anc_visits: MaternalAncVisitDetail[]
  tt_vaccine_records: TTVaccineRecord[]
  record_level_plan_and_baseline: PlanAndBaseline[]
  record_level_present_pregnancy: PresentPregnancyStatus[]
  record_level_risk_responses: RiskResponse[]
  record_level_micronutrients: Micronutrient[]
  record_level_previous_pregnancy: PreviousPregnancyInfo[]
  record_level_checklists: MaternalChecklist[]
  record_level_lab_results: LabResult[]
  /** Optional trimester tracker data returned by RPC `get_anc_trimester_tracker` */
  anc_trimester_tracker?: TrimesterTrackerItem[]
}

export interface TrimesterTrackerItem {
  trimester: number | null
  expected_visits: number | null
  completed_visits: number | null
  progress_percent?: number | null
  note?: string | null
}
