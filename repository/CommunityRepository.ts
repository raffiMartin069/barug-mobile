import { supabase } from '@/constants/supabase';

export class CommunityRepository {

	/**
	 * Get count of existing residents filtered by residential_status_id = 2
	 * Returns the numeric count on success, or null on error.
	 */
	async GetResidentsCount(): Promise<number | null> {
		try {
			const { count, error } = await supabase
				.from('person')
				.select('person_id', { count: 'exact', head: true })
				.eq('residential_status_id', 2);

			if (error) {
				console.error('Error counting residents:', error);
				return null;
			}

			return count === null ? null : count;
		} catch (err) {
			console.error('Unexpected error counting residents:', err);
			return null;
		}
	}

	/**
	 * Get total count of households (no filters)
	 * Returns the numeric count on success, or null on error.
	 */
	async GetHouseholdsCount(): Promise<number | null> {
		try {
			const { count, error } = await supabase
				.from('household_info')
				.select('household_id', { count: 'exact', head: true });

			if (error) {
				console.error('Error counting households:', error);
				return null;
			}

			return count === null ? null : count;
		} catch (err) {
			console.error('Unexpected error counting households:', err);
			return null;
		}
	}

	/**
	 * Get total count of families (no filters)
	 * Returns the numeric count on success, or null on error.
	 */
	async GetFamiliesCount(): Promise<number | null> {
		try {
			const { count, error } = await supabase
				.from('family_unit')
				.select('family_id', { count: 'exact', head: true });

			if (error) {
				console.error('Error counting families:', error);
				return null;
			}

			return count === null ? null : count;
		} catch (err) {
			console.error('Unexpected error counting families:', err);
			return null;
		}
	}

}

