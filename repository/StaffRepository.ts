import { supabase } from '@/constants/supabase';

export class StaffRepository {

	/**
	 * Get all staff records
	 */
	async GetAllStaff(): Promise<any[] | null> {
		try {
			const { data, error } = await supabase
				.from('staff')
				.select('*')
				.order('staff_id', { ascending: true });

			if (error) {
				console.error('Error fetching staff records:', error);
				return null;
			}

			return data || null;
		} catch (err) {
			console.error('Unexpected error fetching staff records:', err);
			return null;
		}
	}

	/**
	 * Get a single staff record by staff_id
	 */
	async GetStaffById(staffId: number): Promise<any | null> {
		try {
			const { data, error } = await supabase
				.from('staff')
				.select('*')
				.eq('staff_id', staffId)
				.single();

			if (error) {
				console.error('Error fetching staff by id:', error);
				return null;
			}

			return data || null;
		} catch (err) {
			console.error('Unexpected error fetching staff by id:', err);
			return null;
		}
	}

	/**
	 * Get staff record by person_id
	 */
	async GetStaffByPersonId(personId: number): Promise<any | null> {
		try {
			const { data, error } = await supabase
				.from('staff')
				.select('*')
				.eq('person_id', personId)
				.single();

			if (error) {
				console.error('Error fetching staff by person id:', error);
				return null;
			}

			return data || null;
		} catch (err) {
			console.error('Unexpected error fetching staff by person id:', err);
			return null;
		}
	}

	/**
	 * Insert a new staff record. Expects an object matching the staff table columns.
	 */
	async CreateStaff(info: Record<string, any>): Promise<any | null> {
		try {
			const { data, error } = await supabase
				.from('staff')
				.insert(info)
				.single();

			if (error) {
				console.error('Error creating staff record:', error);
				return null;
			}

			return data || null;
		} catch (err) {
			console.error('Unexpected error creating staff record:', err);
			return null;
		}
	}

	/**
	 * Update an existing staff record.
	 */
	async UpdateStaff(staffId: number, info: Record<string, any>): Promise<any | null> {
		try {
			const { data, error } = await supabase
				.from('staff')
				.update(info)
				.eq('staff_id', staffId)
				.single();

			if (error) {
				console.error('Error updating staff record:', error);
				return null;
			}

			return data || null;
		} catch (err) {
			console.error('Unexpected error updating staff record:', err);
			return null;
		}
	}

	/**
	 * Get total count of staff rows
	 */
	async GetStaffCount(): Promise<number | null> {
		try {
			const { count, error } = await supabase
				.from('staff')
				.select('staff_id', { count: 'exact', head: true });

			if (error) {
				console.error('Error counting staff:', error);
				return null;
			}

			return count === null ? null : count;
		} catch (err) {
			console.error('Unexpected error counting staff:', err);
			return null;
		}
	}

}

export default StaffRepository;
