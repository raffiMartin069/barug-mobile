import { supabase } from '@/constants/supabase'
import Normalizers from '@/lib/supabase-normalizers'
import {
    ChildHealthRecord,
    ChildImmunization,
    ChildMonitoringLog,
    LabResult,
    MaternalAncRow,
    MaternalAncVisitDetail,
    MaternalChecklist,
    MaternalRecordBase,
    MaternalRecordBundle,
    MaternalScheduleGroup,
    MaternalScheduleRow,
    MedicalHistory,
    Micronutrient,
    ObstetricHistory,
    PlanAndBaseline,
    PostpartumSchedule,
    PrenatalSchedule,
    PresentPregnancyStatus,
    PreviousPregnancyInfo,
    RiskResponse,
    TrimesterStageLite,
    TrimesterTrackerItem,
    TTVaccineRecord,
    VisitStatusLite,
} from '@/types/maternal'
import type { RawChildHealthRecord, RawChildImmunization, RawChildMonitoringLog } from '@/types/raw/maternal_raw'

type RawScheduleRow = {
	postpartum_visit_schedule_id?: number
	maternal_visit_schedule_id?: number
	maternal_record_id: number
	scheduled_date: string
	scheduled_time: string
	fulfilled_visit_id: number | null
	date_time_completed: string | null
	status_id: number | null
	visit_purpose: string | null
	notes: string | null
	created_at: string | null
	updated_at: string | null
	status?: { status_id: number; status_name: string | null }
}

type RawBaseRecord = {
	maternal_record_id: number
	person_id: number
	created_at: string
	husband_id: number | null
	weight: number | null
	height: number | null
	bmi_status_id: number | null
	record_status_id: number | null
	bmi_status?: { bmi_status_id: number; bmi_status_name: string | null } | null
	record_status?: { record_status_id: number; record_status_name: string | null } | null
}

export class MaternalRepository {
	async getPostpartumScheduleByPersonId(personId: number): Promise<MaternalScheduleGroup<PostpartumSchedule>> {
		const recordIds = await this.getMaternalRecordIds(personId)
		if (!recordIds.length) {
			return { latest: null, history: [] }
		}

		const { data, error } = await supabase
			.from('postpartum_visit_schedule')
			.select(
				`
					postpartum_visit_schedule_id,
					maternal_record_id,
					scheduled_date,
					scheduled_time,
					fulfilled_visit_id,
					date_time_completed,
					status_id,
					visit_purpose,
					notes,
					created_at,
					updated_at,
					status:status_id(status_id,status_name)
				`
			)
			.in('maternal_record_id', recordIds)
			.order('scheduled_date', { ascending: false })
			.order('scheduled_time', { ascending: false })

		if (error) throw error

	const norm = Normalizers.normalizeScheduleRows(data)
	const rows = (norm ?? []).map((row: any) => this.mapScheduleRow(row, 'postpartum_visit_schedule_id'))
		return this.partitionLatest(rows)
	}

	async getPrenatalScheduleByPersonId(personId: number): Promise<MaternalScheduleGroup<PrenatalSchedule>> {
		const recordIds = await this.getMaternalRecordIds(personId)
		if (!recordIds.length) {
			return { latest: null, history: [] }
		}

		const { data, error } = await supabase
			.from('maternal_visit_schedule')
			.select(
				`
					maternal_visit_schedule_id,
					maternal_record_id,
					scheduled_date,
					scheduled_time,
					fulfilled_visit_id,
					date_time_completed,
					status_id,
					visit_purpose,
					notes,
					created_at,
					updated_at,
					status:status_id(status_id,status_name)
				`
			)
			.in('maternal_record_id', recordIds)
			.order('scheduled_date', { ascending: false })
			.order('scheduled_time', { ascending: false })

		if (error) throw error

	const norm = Normalizers.normalizeScheduleRows(data)
	const rows = (norm ?? []).map((row: any) => this.mapScheduleRow(row, 'maternal_visit_schedule_id'))
		return this.partitionLatest(rows)
	}

	async getMaternalRecordBundlesByPersonId(personId: number): Promise<MaternalRecordBundle[]> {
		const baseRecords = await this.getBaseRecordsByPerson(personId)
		if (!baseRecords.length) return []
		return this.buildBundles(baseRecords)
	}

	async getMaternalRecordBundle(recordId: number): Promise<MaternalRecordBundle | null> {
		const baseRecords = await this.getBaseRecordsByIds([recordId])
		if (!baseRecords.length) return null
		const bundles = await this.buildBundles(baseRecords)
		return bundles[0] ?? null
	}

	private async getMaternalRecordIds(personId: number): Promise<number[]> {
		const { data, error } = await supabase
			.from('maternal_health_record')
			.select('maternal_record_id')
			.eq('person_id', personId)

		if (error) throw error
		return (data ?? []).map((row) => Number(row.maternal_record_id)).filter((id) => Number.isFinite(id))
	}

	private partitionLatest<T extends MaternalScheduleRow>(rows: T[]): MaternalScheduleGroup<T> {
		if (!rows.length) return { latest: null, history: [] }
		const [latest, ...history] = rows
		return { latest: latest ?? null, history }
	}

	private mapScheduleRow(row: RawScheduleRow, idKey: 'postpartum_visit_schedule_id' | 'maternal_visit_schedule_id'): MaternalScheduleRow {
		const id = row[idKey] ?? 0
		return {
			id: Number(id),
			maternal_record_id: Number(row.maternal_record_id),
			scheduled_date: row.scheduled_date,
			scheduled_time: row.scheduled_time,
			fulfilled_visit_id: row.fulfilled_visit_id == null ? null : Number(row.fulfilled_visit_id),
			date_time_completed: row.date_time_completed,
			status_id: row.status_id == null ? null : Number(row.status_id),
			status_name: row.status?.status_name ?? null,
			visit_purpose: row.visit_purpose,
			notes: row.notes,
			created_at: row.created_at,
			updated_at: row.updated_at,
		}
	}

	private async getBaseRecordsByPerson(personId: number): Promise<MaternalRecordBase[]> {
		const { data, error } = await supabase
			.from('maternal_health_record')
			.select(
				`
					maternal_record_id,
					person_id,
					created_at,
					husband_id,
					weight,
					height,
					bmi_status_id,
					record_status_id,
					bmi_status:bmi_status_id(bmi_status_id,bmi_status_name),
					record_status:record_status_id(record_status_id,record_status_name)
				`
			)
			.eq('person_id', personId)
			.order('created_at', { ascending: false })
			.order('maternal_record_id', { ascending: false })
		if (error) throw error
		const normalized = Normalizers.normalizeBaseRecords(data)
		return this.mapBaseRecords(normalized as unknown as RawBaseRecord[])
	}

	private async getBaseRecordsByIds(recordIds: number[]): Promise<MaternalRecordBase[]> {
		const cleaned = recordIds.filter((id) => Number.isFinite(id))
		if (!cleaned.length) return []

		const { data, error } = await supabase
			.from('maternal_health_record')
			.select(
				`
					maternal_record_id,
					person_id,
					created_at,
					husband_id,
					weight,
					height,
					bmi_status_id,
					record_status_id,
					bmi_status:bmi_status_id(bmi_status_id,bmi_status_name),
					record_status:record_status_id(record_status_id,record_status_name)
				`
			)
			.in('maternal_record_id', cleaned)
			.order('created_at', { ascending: false })
			.order('maternal_record_id', { ascending: false })

		if (error) throw error
		const normalized = Normalizers.normalizeBaseRecords(data)
		return this.mapBaseRecords(normalized as unknown as RawBaseRecord[])
	}

	private mapBaseRecords(rows: RawBaseRecord[]): MaternalRecordBase[] {
		return rows.map((row) => ({
			maternal_record_id: Number(row.maternal_record_id),
			person_id: Number(row.person_id),
			created_at: row.created_at,
			husband_id: row.husband_id == null ? null : Number(row.husband_id),
			weight: row.weight == null ? null : Number(row.weight),
			height: row.height == null ? null : Number(row.height),
			bmi_status_id: row.bmi_status_id == null ? null : Number(row.bmi_status_id),
			bmi_status_name: row.bmi_status?.bmi_status_name ?? null,
			record_status_id: row.record_status_id == null ? null : Number(row.record_status_id),
			record_status_name: row.record_status?.record_status_name ?? null,
		}))
	}

	private async buildBundles(baseRecords: MaternalRecordBase[]): Promise<MaternalRecordBundle[]> {
		const recordIds = baseRecords.map((r) => r.maternal_record_id)
		if (!recordIds.length) return []

		const [
			medicalHistory,
			obstetricHistory,
			ancVisits,
			ancRows,
			planBaseline,
			presentPregStatus,
			labResults,
			checklists,
			riskResponses,
			micronutrients,
			previousPregnancies,
			ttVaccines,
		] = await Promise.all([
			supabase.from('medical_history').select('*').in('maternal_record_id', recordIds),
			supabase.from('obstetric_history').select('*').in('maternal_record_id', recordIds),
			supabase
				.from('maternal_anc_visit')
				.select(
					`
						anc_visit_id,
						maternal_record_id,
						visit_no,
						visit_date,
						created_at,
						recorded_by_id,
						assessed_by_id,
						trimester_stage:trimester_stage_id(trimester_stage_id,trimester_stage_name),
						visit_status:visit_status_id(record_status_id,record_status_name)
					`
				)
				.in('maternal_record_id', recordIds)
				.order('visit_date', { ascending: false })
				.order('anc_visit_id', { ascending: false }),
			supabase.from('maternal_anc_row').select('*').in('maternal_record_id', recordIds),
			supabase.from('plan_and_baseline').select('*').in('maternal_record_id', recordIds),
			supabase.from('present_pregnancy_status').select('*').in('maternal_record_id', recordIds),
			supabase.from('lab_result').select('*').in('maternal_record_id', recordIds),
			supabase.from('maternal_checklist').select('*').in('maternal_record_id', recordIds),
			supabase.from('risk_response').select('*').in('maternal_record_id', recordIds),
			supabase.from('micronutrients').select('*').in('maternal_record_id', recordIds),
			supabase.from('previous_pregnancy_info').select('*').in('maternal_record_id', recordIds),
			supabase.from('tt_vaccine_record').select('*').in('maternal_record_id', recordIds),
		])

		const medicalByRecord = this.mapSingleByRecord(medicalHistory, this.mapMedicalHistory)
		const obstetricByRecord = this.mapSingleByRecord(obstetricHistory, this.mapObstetricHistory)
		const ancVisitsByRecord = this.mapArrayByRecord(ancVisits, (row) => this.mapAncVisit(row as any))
		const ancRowByVisit = this.mapSingleByVisit(ancRows, this.mapAncRow)
		const {
			byVisit: planByVisit,
			byRecord: planByRecord,
		} = this.mapByVisitAndRecord(planBaseline, this.mapPlanAndBaseline)
		const {
			byVisit: pregnancyByVisit,
			byRecord: pregnancyByRecord,
		} = this.mapByVisitAndRecord(presentPregStatus, this.mapPresentPregnancyStatus)
		const {
			byVisit: labByVisit,
			byRecord: labByRecord,
		} = this.mapArrayByVisitAndRecord(labResults, this.mapLabResult)
		const {
			byVisit: checklistByVisit,
			byRecord: checklistByRecord,
		} = this.mapArrayByVisitAndRecord(checklists, this.mapChecklist)
		const {
			byVisit: riskByVisit,
			byRecord: riskByRecord,
		} = this.mapArrayByVisitAndRecord(riskResponses, this.mapRiskResponse)
		const {
			byVisit: microByVisit,
			byRecord: microByRecord,
		} = this.mapArrayByVisitAndRecord(micronutrients, this.mapMicronutrient)
		const {
			byVisit: previousByVisit,
			byRecord: previousByRecord,
		} = this.mapArrayByVisitAndRecord(previousPregnancies, this.mapPreviousPregnancyInfo)
		const ttByRecord = this.mapArrayByRecord(ttVaccines, this.mapTTVaccine)

		// Note: trimester tracker RPC is fetched separately via
		// Note: trimester tracker RPC is fetched separately when needed
		// via `getTrimesterTrackerForLatestRecord`. Record bundles remain
		// focused on record content so the UI or service can request tracker
		// information independently.

		return baseRecords.map((record) => {
			const visits = (ancVisitsByRecord.get(record.maternal_record_id) ?? []).map((visit) => {
				const visitId = visit.anc_visit_id
				return {
					...visit,
					anc_row: visitId ? ancRowByVisit.get(visitId) ?? null : null,
					plan_and_baseline: visitId ? planByVisit.get(visitId) ?? null : null,
					present_pregnancy_status: visitId ? pregnancyByVisit.get(visitId) ?? null : null,
					lab_results: visitId ? labByVisit.get(visitId) ?? [] : [],
					checklists: visitId ? checklistByVisit.get(visitId) ?? [] : [],
					risk_responses: visitId ? riskByVisit.get(visitId) ?? [] : [],
					micronutrients: visitId ? microByVisit.get(visitId) ?? [] : [],
					previous_pregnancies: visitId ? previousByVisit.get(visitId) ?? [] : [],
				} satisfies MaternalAncVisitDetail
			})

			return {
				...record,
				medical_history: medicalByRecord.get(record.maternal_record_id) ?? null,
				obstetric_history: obstetricByRecord.get(record.maternal_record_id) ?? null,
				anc_visits: visits,
				tt_vaccine_records: ttByRecord.get(record.maternal_record_id) ?? [],
				record_level_plan_and_baseline: planByRecord.get(record.maternal_record_id) ?? [],
				record_level_present_pregnancy: pregnancyByRecord.get(record.maternal_record_id) ?? [],
				record_level_risk_responses: riskByRecord.get(record.maternal_record_id) ?? [],
				record_level_micronutrients: microByRecord.get(record.maternal_record_id) ?? [],
				record_level_previous_pregnancy: previousByRecord.get(record.maternal_record_id) ?? [],
				record_level_checklists: checklistByRecord.get(record.maternal_record_id) ?? [],
				record_level_lab_results: labByRecord.get(record.maternal_record_id) ?? [],
			} satisfies MaternalRecordBundle
		})
	}

	// getTrimesterTrackerByRecordIds removed — we only fetch the latest tracker now

	/**
	 * Fetch trimester tracker for the latest maternal health record for a person.
	 * This method only accepts a personId and resolves the latest maternal_record_id
	 * for that person, then calls the RPC and returns the mapped TrimesterTrackerItem[]
	 * for that single (latest) record. If no record exists or RPC fails, returns [].
	 */
	async getTrimesterTrackerForLatestRecord(personId: number): Promise<TrimesterTrackerItem[]> {
		// find the latest maternal_record_id for this person
		const { data: recs, error: recErr } = await supabase
			.from('maternal_health_record')
			.select('maternal_record_id')
			.eq('person_id', personId)
			.order('created_at', { ascending: false })
			.order('maternal_record_id', { ascending: false })
			.limit(1)
		if (recErr || !recs || !Array.isArray(recs) || recs.length === 0) return []
		const recordId = Number(recs[0].maternal_record_id)
		if (!Number.isFinite(recordId)) return []

		try {
			const { data, error } = await supabase.rpc('get_anc_trimester_tracker', { p_maternal_record_id: recordId })
			if (error) {
				// log Supabase error object for troubleshooting (may include code/message/details)
				console.error('get_anc_trimester_tracker RPC error:', {
					personId,
					recordId,
					supabaseError: error,
				})
				return []
			}
			if (!data) return []
			const rows = Array.isArray(data) ? (data as any[]) : []
			return rows.map((r) => this.mapTrimesterTrackerRow(r)).filter(Boolean) as TrimesterTrackerItem[]
		} catch (err: any) {
			// Catch network/Cloudflare/edge errors — include as much detail as possible
			console.error('get_anc_trimester_tracker RPC threw:', {
				personId,
				recordId,
				error: err && err.message ? err.message : String(err),
				stack: err && err.stack ? err.stack : undefined,
			})
			return []
		}
	}

	private mapTrimesterTrackerRow(row: any): TrimesterTrackerItem | null {
		if (!row || typeof row !== 'object') return null
		// Handle multiple possible field names from RPC (cover variants used in different RPC versions)
		const trimester = row.trimester ?? row.trimester_stage ?? row.stage ?? row.trimester_no ?? null
		const expected = row.expected_visits ?? row.expected ?? row.total_expected ?? row.min_required ?? null
		const completed = row.completed_visits ?? row.completed ?? row.total_completed ?? row.visit_count ?? null
		let progress = row.progress_percent ?? row.progress ?? null
		const note = row.note ?? row.message ?? row.text ?? row.trimester_label ?? null

		// normalize numeric fields
		const trimesterN = trimester == null ? null : Number(trimester)
		const expectedN = expected == null ? null : Number(expected)
		const completedN = completed == null ? null : Number(completed)
		// if RPC doesn't provide a percent, compute from completed/expected when possible
		if ((progress == null || progress === '') && expected != null && Number(expected) > 0 && completed != null) {
			try {
				const e = Number(expected)
				const c = Number(completed)
				progress = Number.isFinite(e) && e > 0 ? Math.round((Number.isFinite(c ? c : NaN) ? c : 0) / e * 100) : null
			} catch {
				progress = null
			}
		}
		const progressN = progress == null ? null : Number(progress)

		return {
			trimester: Number.isFinite(trimesterN) ? trimesterN : null,
			expected_visits: Number.isFinite(expectedN) ? expectedN : null,
			completed_visits: Number.isFinite(completedN) ? completedN : null,
			progress_percent: Number.isFinite(progressN) ? progressN : null,
			note: note ?? null,
		}
	}

	private mapMedicalHistory = (row: any): MedicalHistory => ({
		medical_history_id: Number(row.medical_history_id),
		maternal_record_id: Number(row.maternal_record_id),
		anc_visit_id: row.anc_visit_id == null ? null : Number(row.anc_visit_id),
		previous_illness: row.previous_illness ?? null,
		previous_hospitalization: row.previous_hospitalization ?? null,
		previous_preg_complication: row.previous_preg_complication ?? null,
	})

	private mapObstetricHistory = (row: any): ObstetricHistory => ({
		obstetric_history_id: Number(row.obstetric_history_id),
		maternal_record_id: Number(row.maternal_record_id),
		anc_visit_id: row.anc_visit_id == null ? null : Number(row.anc_visit_id),
		num_children_born_alive: row.num_children_born_alive == null ? null : Number(row.num_children_born_alive),
		num_children_living: row.num_children_living == null ? null : Number(row.num_children_living),
		num_abortion: row.num_abortion == null ? null : Number(row.num_abortion),
		num_stillbirth: row.num_stillbirth == null ? null : Number(row.num_stillbirth),
		num_large_babies: row.num_large_babies == null ? null : Number(row.num_large_babies),
		has_diabetes: row.has_diabetes ?? null,
	})

	private mapAncVisit = (row: any): MaternalAncVisitDetail => ({
		anc_visit_id: Number(row.anc_visit_id),
		maternal_record_id: Number(row.maternal_record_id),
		visit_no: row.visit_no == null ? null : Number(row.visit_no),
		visit_date: row.visit_date,
		created_at: row.created_at,
		recorded_by_id: row.recorded_by_id == null ? null : Number(row.recorded_by_id),
		assessed_by_id: row.assessed_by_id == null ? null : Number(row.assessed_by_id),
		trimester_stage: this.mapTrimesterStage(row.trimester_stage),
		visit_status: this.mapVisitStatus(row.visit_status),
		anc_row: null,
		plan_and_baseline: null,
		present_pregnancy_status: null,
		lab_results: [],
		checklists: [],
		risk_responses: [],
		micronutrients: [],
		previous_pregnancies: [],
	})

	private mapTrimesterStage(row: any): TrimesterStageLite {
		if (!row) return { trimester_stage_id: null, trimester_stage_name: null }
		return {
			trimester_stage_id: row.trimester_stage_id == null ? null : Number(row.trimester_stage_id),
			trimester_stage_name: row.trimester_stage_name ?? null,
		}
	}

	private mapVisitStatus(row: any): VisitStatusLite {
		if (!row) return { record_status_id: null, record_status_name: null }
		return {
			record_status_id: row.record_status_id == null ? null : Number(row.record_status_id),
			record_status_name: row.record_status_name ?? null,
		}
	}

	private mapAncRow = (row: any): MaternalAncRow => ({
		anc_row_id: Number(row.anc_row_id),
		anc_visit_id: row.anc_visit_id == null ? null : Number(row.anc_visit_id),
		maternal_record_id: Number(row.maternal_record_id),
		anc_date: row.anc_date ?? null,
		aog_weeks: row.aog_weeks == null ? null : Number(row.aog_weeks),
		aog_days: row.aog_days == null ? null : Number(row.aog_days),
		weight_kg: row.weight_kg == null ? null : Number(row.weight_kg),
		bp_systolic: row.bp_systolic == null ? null : Number(row.bp_systolic),
		bp_diastolic: row.bp_diastolic == null ? null : Number(row.bp_diastolic),
		leopolds_findings: row.leopolds_findings ?? null,
		notes: row.notes ?? null,
	})

	private mapPlanAndBaseline = (row: any): PlanAndBaseline => ({
		plan_and_baseline_id: Number(row.plan_and_baseline_id),
		maternal_record_id: Number(row.maternal_record_id),
		anc_visit_id: row.anc_visit_id == null ? null : Number(row.anc_visit_id),
		new_born_screening_plan: row.new_born_screening_plan ?? null,
		place_of_delivery_plan: row.place_of_delivery_plan ?? null,
	})

	private mapPresentPregnancyStatus = (row: any): PresentPregnancyStatus => ({
		preg_status_id: Number(row.preg_status_id),
		maternal_record_id: Number(row.maternal_record_id),
		anc_visit_id: row.anc_visit_id == null ? null : Number(row.anc_visit_id),
		gravida: row.gravida == null ? null : Number(row.gravida),
		para: row.para == null ? null : Number(row.para),
		is_fullterm: row.is_fullterm ?? null,
		is_preterm: row.is_preterm ?? null,
		lmp: row.lmp ?? null,
		edc: row.edc ?? null,
	})

	private mapLabResult = (row: any): LabResult => ({
		lab_result_id: Number(row.lab_result_id),
		maternal_record_id: Number(row.maternal_record_id),
		anc_visit_id: row.anc_visit_id == null ? null : Number(row.anc_visit_id),
		lab_test_id: Number(row.lab_test_id),
		result: row.result ?? null,
		result_img_path: row.result_img_path ?? null,
		date_tested: row.date_tested ?? null,
	})

	/**
	 * Fetch child health records for a single mother (person_id of the mother).
	 * This method accepts a single motherPersonId and returns an array of
	 * ChildHealthRecord summaries with quick counts for immunizations and monitoring logs.
	 */
	async getChildHealthRecordsByMotherId(motherPersonId: number): Promise<ChildHealthRecord[]> {
		if (!Number.isFinite(motherPersonId)) return []
		// include joined person info so we can display the child's name in the UI
		const { data, error } = await supabase
			.from('child_health_record')
			.select(
				`
					*,
					person:person_id(person_id,first_name,middle_name,last_name,suffix)
				`
			)
			.eq('mother_id', motherPersonId)
		if (error) throw error
	const rows = (data ?? []) as RawChildHealthRecord[]
		const childIds = rows.map((r: any) => Number(r.child_record_id)).filter((id) => Number.isFinite(id))

		// We'll fetch full immunization and monitoring records for these child IDs
		const immunByChild = new Map<number, ChildImmunization[]>()
		const monitorByChild = new Map<number, ChildMonitoringLog[]>()
		const immunCount = new Map<number, number>()
		const monitorCount = new Map<number, number>()

		if (childIds.length) {
			const { data: imRows, error: imErr } = await supabase
				.from('child_immunization')
				.select(
					`
					child_immunization_id,
					date_given,
					immunization_type_id,
					immunization_stage_given_id,
					child_record_id,
					visit_id,
					immunization_type:immunization_type_id(immunization_type_id,immunization_type_name),
					immunization_stage:immunization_stage_given_id(immunization_stage_given_id,immunization_stage_name)
				`
				)
				.in('child_record_id', childIds)
				// actual column is date_given
				.order('date_given', { ascending: false })

			if (imErr) throw imErr

			for (const r of (imRows ?? []) as RawChildImmunization[]) {
				const cid = Number(r.child_record_id)
				// normalize joined immunization_type which may be returned as an object or an array
				const immJoined = Normalizers.ensureSingle(r.immunization_type)
				const vaccineName = immJoined && (immJoined.immunization_type_name ?? immJoined.name) ? String(immJoined.immunization_type_name ?? immJoined.name) : (r.immunization_type_id != null ? String(r.immunization_type_id) : null)
				// normalize joined immunization_stage which may be array/object
				const stageJoined = Normalizers.ensureSingle(r.immunization_stage)
				const stageId = r.immunization_stage_given_id == null ? null : Number(r.immunization_stage_given_id)
				const stageName = stageJoined && (stageJoined.immunization_stage_name ?? stageJoined.name) ? String(stageJoined.immunization_stage_name ?? stageJoined.name) : null

				const entry: ChildImmunization = {
					child_immunization_id: Number(r.child_immunization_id ?? 0),
					child_record_id: cid,
					// DB column is date_given
					immunization_date: r.date_given ?? null,
					// human-readable name when available
					vaccine_type: vaccineName,
					immunization_stage_given_id: stageId,
					immunization_stage_name: stageName,
					// table does not include batch_no/notes in current schema
					batch_no: null,
					notes: null,
				}
				if (!immunByChild.has(cid)) immunByChild.set(cid, [])
				immunByChild.get(cid)!.push(entry)
				immunCount.set(cid, (immunCount.get(cid) ?? 0) + 1)
			}

			const { data: monRows, error: monErr } = await supabase
				.from('child_monitoring_log')
				.select('*')
				.in('child_record_id', childIds)
				// actual column is check_date
				.order('check_date', { ascending: false })

			if (monErr) throw monErr

			for (const r of (monRows ?? []) as RawChildMonitoringLog[]) {
				const cid = Number(r.child_record_id)
				const entry: ChildMonitoringLog = {
					child_monitoring_id: Number(r.child_monitoring_id ?? r.id ?? 0),
					child_record_id: cid,
					// DB column is check_date
					visit_date: r.check_date ?? null,
					weight_kg: r.weight == null ? null : Number(r.weight),
					height_cm: r.height == null ? null : Number(r.height),
					muac: r.muac == null ? null : Number(r.muac),
					notes: r.notes ?? null,
				}
				if (!monitorByChild.has(cid)) monitorByChild.set(cid, [])
				monitorByChild.get(cid)!.push(entry)
				monitorCount.set(cid, (monitorCount.get(cid) ?? 0) + 1)
			}
		}

		return (rows as RawChildHealthRecord[]).map((r) => {
			const id = Number(r.child_record_id)
			// normalize joined person (may be object or array), prefer joined values when present
			const personJoined = Array.isArray(r.person) ? r.person[0] : r.person
			const first = personJoined?.first_name ?? null
			const middle = personJoined?.middle_name ?? null
			const last = personJoined?.last_name ?? null
			const suffix = personJoined?.suffix ?? null
			const nameParts = [first, middle, last, suffix].filter((p) => p && String(p).trim() !== '')
			const childName = nameParts.length ? nameParts.join(' ').trim() : null

			return {
				child_record_id: id,
				person_id: Number(personJoined?.person_id ?? r.person_id ?? 0),
				mother_id: r.mother_id == null ? null : Number(r.mother_id),
				father_id: r.father_id == null ? null : Number(r.father_id),
				birth_order: r.birth_order == null ? null : String(r.birth_order),
				created_at: r.created_at ?? null,
				// human-readable name for UI
				child_name: childName,
				immunization_count: immunCount.get(id) ?? 0,
				monitoring_count: monitorCount.get(id) ?? 0,
				immunizations: immunByChild.get(id) ?? [],
				monitoring_logs: monitorByChild.get(id) ?? [],
			}
		})
	}

	private mapChecklist = (row: any): MaternalChecklist => ({
		maternal_checklist_id: Number(row.maternal_checklist_id),
		maternal_record_id: Number(row.maternal_record_id),
		anc_visit_id: row.anc_visit_id == null ? null : Number(row.anc_visit_id),
		checklist_item_id: Number(row.checklist_item_id),
	})

	private mapRiskResponse = (row: any): RiskResponse => ({
		risk_response_id: Number(row.risk_response_id),
		maternal_record_id: Number(row.maternal_record_id),
		anc_visit_id: row.anc_visit_id == null ? null : Number(row.anc_visit_id),
		risk_category_id: Number(row.risk_category_id),
	})

	private mapMicronutrient = (row: any): Micronutrient => ({
		micronutrients_id: Number(row.micronutrients_id),
		maternal_record_id: Number(row.maternal_record_id),
		anc_visit_id: row.anc_visit_id == null ? null : Number(row.anc_visit_id),
		iron_start_date: row.iron_start_date ?? null,
		iron_end_date: row.iron_end_date ?? null,
		deworming_given_date: row.deworming_given_date ?? null,
	})

	private mapPreviousPregnancyInfo = (row: any): PreviousPregnancyInfo => ({
		previous_pregnancy_info_id: Number(row.previous_pregnancy_info_id),
		maternal_record_id: Number(row.maternal_record_id),
		anc_visit_id: row.anc_visit_id == null ? null : Number(row.anc_visit_id),
		date_of_deliveries: row.date_of_deliveries ?? null,
		outcome: row.outcome ?? null,
		baby_weight: row.baby_weight == null ? null : Number(row.baby_weight),
		ballard_score: row.ballard_score == null ? null : Number(row.ballard_score),
		apgar_score: row.apgar_score == null ? null : Number(row.apgar_score),
		delivery_type_id: row.delivery_type_id == null ? null : Number(row.delivery_type_id),
		baby_sex: row.baby_sex == null ? null : Number(row.baby_sex),
	})

	private mapTTVaccine = (row: any): TTVaccineRecord => ({
		tt_id: Number(row.tt_id),
		maternal_record_id: Number(row.maternal_record_id),
		anc_visit_id: row.anc_visit_id == null ? null : Number(row.anc_visit_id),
		tt_type_id: Number(row.tt_type_id),
		date_given: row.date_given,
	})

	private mapSingleByRecord<T>(queryResult: { data: any[] | null; error: any }, mapper: (row: any) => T): Map<number, T> {
		if (queryResult.error) throw queryResult.error
		const map = new Map<number, T>()
		for (const row of queryResult.data ?? []) {
			const recId = Number(row.maternal_record_id)
			if (!Number.isFinite(recId)) continue
			map.set(recId, mapper(row))
		}
		return map
	}

	private mapArrayByRecord<T>(queryResult: { data: any[] | null; error: any }, mapper: (row: any) => T): Map<number, T[]> {
		if (queryResult.error) throw queryResult.error
		const map = new Map<number, T[]>()
		for (const row of queryResult.data ?? []) {
			const recId = Number(row.maternal_record_id)
			if (!Number.isFinite(recId)) continue
			const value = mapper(row)
			if (!map.has(recId)) map.set(recId, [])
			map.get(recId)!.push(value)
		}
		return map
	}

	private mapSingleByVisit<T>(queryResult: { data: any[] | null; error: any }, mapper: (row: any) => T): Map<number, T> {
		if (queryResult.error) throw queryResult.error
		const map = new Map<number, T>()
		for (const row of queryResult.data ?? []) {
			if (row.anc_visit_id == null) continue
			const visitId = Number(row.anc_visit_id)
			if (!Number.isFinite(visitId)) continue
			map.set(visitId, mapper(row))
		}
		return map
	}

		private mapArrayByVisitAndRecord<T>(
			queryResult: { data: any[] | null; error: any },
			mapper: (row: any) => T
		): { byVisit: Map<number, T[]>; byRecord: Map<number, T[]> } {
		if (queryResult.error) throw queryResult.error
		const byVisit = new Map<number, T[]>()
		const byRecord = new Map<number, T[]>()

		for (const row of queryResult.data ?? []) {
			const recId = Number(row.maternal_record_id)
				const mapped = mapper(row)

				if (Number.isFinite(recId) && row.anc_visit_id == null) {
					if (!byRecord.has(recId)) byRecord.set(recId, [])
					byRecord.get(recId)!.push(mapped)
				}

			if (row.anc_visit_id != null) {
				const visitId = Number(row.anc_visit_id)
				if (!Number.isFinite(visitId)) continue
				if (!byVisit.has(visitId)) byVisit.set(visitId, [])
					byVisit.get(visitId)!.push(mapped)
			}
		}

		return { byVisit, byRecord }
	}

	private mapByVisitAndRecord<T>(
		queryResult: { data: any[] | null; error: any },
		mapper: (row: any) => T
	): { byVisit: Map<number, T>; byRecord: Map<number, T[]> } {
		if (queryResult.error) throw queryResult.error
		const byVisit = new Map<number, T>()
		const byRecord = new Map<number, T[]>()

		for (const row of queryResult.data ?? []) {
			const recId = Number(row.maternal_record_id)
				const mapped = mapper(row)

				if (Number.isFinite(recId) && row.anc_visit_id == null) {
					if (!byRecord.has(recId)) byRecord.set(recId, [])
					byRecord.get(recId)!.push(mapped)
				}

			if (row.anc_visit_id != null) {
				const visitId = Number(row.anc_visit_id)
				if (!Number.isFinite(visitId)) continue
					byVisit.set(visitId, mapped)
			}
		}

		return { byVisit, byRecord }
	}
}
