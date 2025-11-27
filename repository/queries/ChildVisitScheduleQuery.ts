import { supabase } from '@/constants/supabase';
import { PersonLite } from '../../types/ChildLiteTypes';

export type RecordStatusLite = {
	record_status_id: number;
	record_status_name: string | null;
};

export type ChildVisitDto = {
	visit_id: number;
	child_record_id: number | null;
	visit_no: number | null;
	assessed_by_id: number | null;
	assessed_by?: PersonLite | null;
	recorded_by_id: number | null;
	recorded_by?: PersonLite | null;
	created_at: string | null;
	visit_date: string | null;
	visit_status_id: number | null;
	record_status?: RecordStatusLite | null;
};

export class ChildVisitScheduleQuery {
	private async buildRelatedMaps(records: any[]) {
		const personIds = new Set<number>();
		const statusIds = new Set<number>();

		for (const r of records) {
			if (r.assessed_by_id) personIds.add(Number(r.assessed_by_id));
			if (r.recorded_by_id) personIds.add(Number(r.recorded_by_id));
			if (r.visit_status_id) statusIds.add(Number(r.visit_status_id));
		}

		const personsMap: Record<number, PersonLite> = {};
		if (personIds.size > 0) {
			const uniq = Array.from(personIds);
			const { data: persons, error: personsErr } = await supabase
				.from('person')
				.select('person_id, first_name, middle_name, last_name, suffix, birthdate, sex_id, person_img, mobile_num')
				.in('person_id', uniq);

			if (personsErr) {
				console.error('Error fetching person rows for child_visit:', personsErr);
			} else if (persons && Array.isArray(persons)) {
				for (const p of persons) {
					personsMap[Number(p.person_id)] = {
						person_id: Number(p.person_id),
						first_name: p.first_name ?? null,
						middle_name: p.middle_name ?? null,
						last_name: p.last_name ?? null,
						suffix: p.suffix ?? null,
						birthdate: p.birthdate ?? null,
						sex_id: p.sex_id ?? null,
						person_img: p.person_img ?? null,
						mobile_num: p.mobile_num ?? null,
					};
				}
			}
		}

		const recordStatusMap: Record<number, RecordStatusLite | null> = {};
		if (statusIds.size > 0) {
			const uniqS = Array.from(statusIds);
			const { data: statuses, error: statusErr } = await supabase
				.from('record_status')
				.select('record_status_id, record_status_name')
				.in('record_status_id', uniqS);

			if (statusErr) {
				console.error('Error fetching record_status rows:', statusErr);
			} else if (statuses && Array.isArray(statuses)) {
				for (const s of statuses) {
					recordStatusMap[Number(s.record_status_id)] = {
						record_status_id: Number(s.record_status_id),
						record_status_name: s.record_status_name ?? null,
					};
				}
			}
		}

		return { personsMap, recordStatusMap };
	}

	private mapRecordToDto(
		rec: any,
		personsMap: Record<number, PersonLite>,
		recordStatusMap: Record<number, RecordStatusLite | null>
	): ChildVisitDto {
		return {
			visit_id: Number(rec.visit_id),
			child_record_id: rec.child_record_id ? Number(rec.child_record_id) : null,
			visit_no: rec.visit_no ? Number(rec.visit_no) : null,
			assessed_by_id: rec.assessed_by_id ? Number(rec.assessed_by_id) : null,
			assessed_by: rec.assessed_by_id ? (personsMap[Number(rec.assessed_by_id)] ?? null) : null,
			recorded_by_id: rec.recorded_by_id ? Number(rec.recorded_by_id) : null,
			recorded_by: rec.recorded_by_id ? (personsMap[Number(rec.recorded_by_id)] ?? null) : null,
			created_at: rec.created_at ?? null,
			visit_date: rec.visit_date ?? null,
			visit_status_id: rec.visit_status_id ? Number(rec.visit_status_id) : null,
			record_status: rec.visit_status_id ? (recordStatusMap[Number(rec.visit_status_id)] ?? null) : null,
		};
	}

	async GetChildVisitById(visitId: number): Promise<ChildVisitDto | null> {
		try {
			const { data: rec, error } = await supabase
				.from('child_visit')
				.select('*')
				.eq('visit_id', visitId)
				.single();

			if (error) {
				console.error('Error fetching child_visit by id:', error);
				return null;
			}
			if (!rec) return null;

			const { personsMap, recordStatusMap } = await this.buildRelatedMaps([rec]);
			return this.mapRecordToDto(rec, personsMap, recordStatusMap);
		} catch (err) {
			console.error('Unexpected error fetching child_visit by id:', err);
			return null;
		}
	}

	async GetAllChildVisits(): Promise<ChildVisitDto[] | null> {
		try {
			const { data: recs, error } = await supabase
				.from('child_visit')
				.select('*')
				.order('visit_id', { ascending: true });

			if (error) {
				console.error('Error fetching child_visit rows:', error);
				return null;
			}
			if (!recs || !Array.isArray(recs)) return [];

			const { personsMap, recordStatusMap } = await this.buildRelatedMaps(recs);
			return recs.map((r: any) => this.mapRecordToDto(r, personsMap, recordStatusMap));
		} catch (err) {
			console.error('Unexpected error fetching all child visits:', err);
			return null;
		}
	}

	async GetChildVisitsByChildRecordId(childRecordId: number): Promise<ChildVisitDto[] | null> {
		try {
			const { data: recs, error } = await supabase
				.from('child_visit')
				.select('*')
				.eq('child_record_id', childRecordId)
				.order('visit_no', { ascending: true });

			if (error) {
				console.error('Error fetching child_visit by child_record_id:', error);
				return null;
			}
			if (!recs || !Array.isArray(recs)) return [];

			const { personsMap, recordStatusMap } = await this.buildRelatedMaps(recs);
			return recs.map((r: any) => this.mapRecordToDto(r, personsMap, recordStatusMap));
		} catch (err) {
			console.error('Unexpected error fetching child visits by child record id:', err);
			return null;
		}
	}

	async CreateChildVisit(info: Record<string, any>): Promise<ChildVisitDto | null> {
		try {
			const { data, error } = await supabase
				.from('child_visit')
				.insert(info)
				.single();

			if (error) {
				console.error('Error inserting child_visit:', error);
				return null;
			}
			if (!data) return null;

			return await this.GetChildVisitById(Number((data as any).visit_id));
		} catch (err) {
			console.error('Unexpected error creating child visit:', err);
			return null;
		}
	}

	async UpdateChildVisit(visitId: number, info: Record<string, any>): Promise<ChildVisitDto | null> {
		try {
			const { data, error } = await supabase
				.from('child_visit')
				.update(info)
				.eq('visit_id', visitId)
				.single();

			if (error) {
				console.error('Error updating child_visit:', error);
				return null;
			}
			if (!data) return null;

			return await this.GetChildVisitById(Number((data as any).visit_id));
		} catch (err) {
			console.error('Unexpected error updating child visit:', err);
			return null;
		}
	}

	async DeleteChildVisit(visitId: number): Promise<boolean> {
		try {
			const { error } = await supabase
				.from('child_visit')
				.delete()
				.eq('visit_id', visitId);

			if (error) {
				console.error('Error deleting child_visit:', error);
				return false;
			}
			return true;
		} catch (err) {
			console.error('Unexpected error deleting child visit:', err);
			return false;
		}
	}
}

export default ChildVisitScheduleQuery;