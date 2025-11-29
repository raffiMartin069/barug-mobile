import { supabase } from '@/constants/supabase';
import { ChildMonitoringException } from '@/exception/ChildMonitoringException';

export class ChildHealthCommands {

	/**
	 * Call the Postgres function `add_monitoring_log_unique_date` which
	 * inserts (or upserts) a monitoring log for a child for a given date.
	 * Returns `true` on success, or `null` on error.
	 */
	async AddMonitoringLogUniqueDate(params: {
		p_child_record_id: number;
		p_assessed_by_id: number;
		p_check_date: string; // ISO date or date string expected by the RPC
		p_age?: number | null;
		p_weight?: number | null;
		p_temperature?: number | null;
		p_height?: number | null;
		p_findings?: string | null;
		p_notes?: string | null;
	}): Promise<any | null> {
		try {
			const rpcParams = {
				p_child_record_id: params.p_child_record_id,
				p_assessed_by_id: params.p_assessed_by_id,
				p_check_date: params.p_check_date,
				p_age: params.p_age ?? null,
				p_weight: params.p_weight ?? null,
				p_temperature: params.p_temperature ?? null,
				p_height: params.p_height ?? null,
				p_findings: params.p_findings ?? null,
				p_notes: params.p_notes ?? null,
			};

			const { data, error } = await supabase.rpc('add_monitoring_log_unique_date', rpcParams);

			if (error) {
				const code = String(error.code ?? '').trim();
				// Known domain errors -> rethrow as custom exception
				if (code && ChildMonitoringException.getErrorCodes().has(code)) {
					console.warn('Child monitoring RPC domain error:', code, error.message);
					throw new ChildMonitoringException(error.message ?? 'Child monitoring error');
				}

				// Unknown RPC error -> log and throw generic Error
				console.error('Error calling add_monitoring_log_unique_date:', error);
				throw new Error(error.message ?? 'Failed to call add_monitoring_log_unique_date');
			}

			return data ?? null;
		} catch (err: any) {
			// Re-throw domain exception unchanged, wrap others in a generic Error after logging
			if (err instanceof ChildMonitoringException) throw err;
			console.error('Unexpected error calling add_monitoring_log_unique_date:', err);
			throw new Error('Unexpected error calling add_monitoring_log_unique_date');
		}
	}

}