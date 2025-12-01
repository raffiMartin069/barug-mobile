import { supabase } from '@/constants/supabase';

// Types for child visit entities
export type ChildVisitDto = {
	visit_id: number;
	child_record_id: number | null;
	visit_no: number | null;
	assessed_by_id: number | null;
	created_at: string | null;
	visit_date: string | null;
	recorded_by_id: number | null;
	visit_status_id: number | null;
};

export type ChildMonitoringLogDto = {
	child_monitoring_id: number;
	check_date: string | null;
	age: number | null;
	weight: number | null;
	temperature: number | null;
	height: number | null;
	findings: string | null;
	notes: string | null;
	child_record_id: number | null;
	visit_id: number | null;
};

export type ChildVisitScheduleDto = {
	child_visit_schedule_id: number;
	child_record_id: number | null;
	scheduled_date: string | null;
	scheduled_time: string | null;
	fulfilled_visit_id: number | null;
	date_time_completed: string | null;
	status_id: number | null;
	visit_purpose: string | null;
	notes: string | null;
	marked_completed_by_id: number | null;
	created_at: string | null;
	created_by_id: number | null;
	updated_at: string | null;
};

export class ChildVisitQuery {
	
	// ==================== CHILD VISIT ====================
	
	/**
	 * Fetch all child visits
	 */
	async GetAllChildVisits(): Promise<ChildVisitDto[] | null> {
		try {
			const { data, error } = await supabase
				.from('child_visit')
				.select('*')
				.order('visit_id', { ascending: false });

			if (error) {
				console.error('Error fetching child_visit rows:', error);
				return null;
			}
			return (data as ChildVisitDto[]) ?? [];
		} catch (err) {
			console.error('Unexpected error fetching all child visits:', err);
			return null;
		}
	}

	/**
	 * Fetch child visit by ID
	 */
	async GetChildVisitById(visitId: number): Promise<ChildVisitDto | null> {
		try {
			const { data, error } = await supabase
				.from('child_visit')
				.select('*')
				.eq('visit_id', visitId)
				.single();

			if (error) {
				console.error('Error fetching child_visit by id:', error);
				return null;
			}
			return data as ChildVisitDto;
		} catch (err) {
			console.error('Unexpected error fetching child visit by id:', err);
			return null;
		}
	}

	/**
	 * Fetch child visits by child record ID
	 */
	async GetChildVisitsByChildRecordId(childRecordId: number): Promise<ChildVisitDto[] | null> {
		try {
			const { data, error } = await supabase
				.from('child_visit')
				.select('*')
				.eq('child_record_id', childRecordId)
				.order('visit_date', { ascending: false });

			if (error) {
				console.error('Error fetching child_visit by child_record_id:', error);
				return null;
			}
			return (data as ChildVisitDto[]) ?? [];
		} catch (err) {
			console.error('Unexpected error fetching child visits by child_record_id:', err);
			return null;
		}
	}

	// ==================== CHILD MONITORING LOG ====================

	/**
	 * Fetch all monitoring logs
	 */
	async GetAllMonitoringLogs(): Promise<ChildMonitoringLogDto[] | null> {
		try {
			const { data, error } = await supabase
				.from('child_monitoring_log')
				.select('*')
				.order('child_monitoring_id', { ascending: false });

			if (error) {
				console.error('Error fetching child_monitoring_log rows:', error);
				return null;
			}
			return (data as ChildMonitoringLogDto[]) ?? [];
		} catch (err) {
			console.error('Unexpected error fetching all monitoring logs:', err);
			return null;
		}
	}

	/**
	 * Fetch monitoring log by ID
	 */
	async GetMonitoringLogById(monitoringId: number): Promise<ChildMonitoringLogDto | null> {
		try {
			const { data, error } = await supabase
				.from('child_monitoring_log')
				.select('*')
				.eq('child_monitoring_id', monitoringId)
				.single();

			if (error) {
				console.error('Error fetching child_monitoring_log by id:', error);
				return null;
			}
			return data as ChildMonitoringLogDto;
		} catch (err) {
			console.error('Unexpected error fetching monitoring log by id:', err);
			return null;
		}
	}

	/**
	 * Fetch monitoring logs by visit ID
	 */
	async GetMonitoringLogsByVisitId(visitId: number): Promise<ChildMonitoringLogDto[] | null> {
		try {
			const { data, error } = await supabase
				.from('child_monitoring_log')
				.select('*')
				.eq('visit_id', visitId)
				.order('check_date', { ascending: false });

			if (error) {
				console.error('Error fetching child_monitoring_log by visit_id:', error);
				return null;
			}
			return (data as ChildMonitoringLogDto[]) ?? [];
		} catch (err) {
			console.error('Unexpected error fetching monitoring logs by visit_id:', err);
			return null;
		}
	}

	/**
	 * Fetch monitoring logs by child record ID
	 */
	async GetMonitoringLogsByChildRecordId(childRecordId: number): Promise<ChildMonitoringLogDto[] | null> {
		try {
			const { data, error } = await supabase
				.from('child_monitoring_log')
				.select('*')
				.eq('child_record_id', childRecordId)
				.order('check_date', { ascending: false });

			if (error) {
				console.error('Error fetching child_monitoring_log by child_record_id:', error);
				return null;
			}
			return (data as ChildMonitoringLogDto[]) ?? [];
		} catch (err) {
			console.error('Unexpected error fetching monitoring logs by child_record_id:', err);
			return null;
		}
	}

	// ==================== CHILD VISIT SCHEDULE ====================

	/**
	 * Fetch all visit schedules
	 */
	async GetAllVisitSchedules(): Promise<ChildVisitScheduleDto[] | null> {
		try {
			const { data, error } = await supabase
				.from('child_visit_schedule')
				.select('*')
				.order('scheduled_date', { ascending: true });

			if (error) {
				console.error('Error fetching child_visit_schedule rows:', error);
				return null;
			}
			return (data as ChildVisitScheduleDto[]) ?? [];
		} catch (err) {
			console.error('Unexpected error fetching all visit schedules:', err);
			return null;
		}
	}

	/**
	 * Fetch visit schedule by ID
	 */
	async GetVisitScheduleById(scheduleId: number): Promise<ChildVisitScheduleDto | null> {
		try {
			const { data, error } = await supabase
				.from('child_visit_schedule')
				.select('*')
				.eq('child_visit_schedule_id', scheduleId)
				.single();

			if (error) {
				console.error('Error fetching child_visit_schedule by id:', error);
				return null;
			}
			return data as ChildVisitScheduleDto;
		} catch (err) {
			console.error('Unexpected error fetching visit schedule by id:', err);
			return null;
		}
	}

	/**
	 * Fetch visit schedules by child record ID
	 */
	async GetVisitSchedulesByChildRecordId(childRecordId: number): Promise<ChildVisitScheduleDto[] | null> {
		try {
			const { data, error } = await supabase
				.from('child_visit_schedule')
				.select('*')
				.eq('child_record_id', childRecordId)
				.order('scheduled_date', { ascending: true });

			if (error) {
				console.error('Error fetching child_visit_schedule by child_record_id:', error);
				return null;
			}
			return (data as ChildVisitScheduleDto[]) ?? [];
		} catch (err) {
			console.error('Unexpected error fetching visit schedules by child_record_id:', err);
			return null;
		}
	}

	/**
	 * Fetch pending (unfulfilled) visit schedules
	 */
	async GetPendingVisitSchedules(childRecordId?: number): Promise<ChildVisitScheduleDto[] | null> {
		try {
			let query = supabase
				.from('child_visit_schedule')
				.select('*')
				.is('fulfilled_visit_id', null)
				.order('scheduled_date', { ascending: true });

			if (childRecordId) {
				query = query.eq('child_record_id', childRecordId);
			}

			const { data, error } = await query;

			if (error) {
				console.error('Error fetching pending child_visit_schedule rows:', error);
				return null;
			}
			return (data as ChildVisitScheduleDto[]) ?? [];
		} catch (err) {
			console.error('Unexpected error fetching pending visit schedules:', err);
			return null;
		}
	}
}

export default ChildVisitQuery;
