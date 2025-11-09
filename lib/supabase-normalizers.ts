// Helpers to normalize Supabase responses which may return joined relations
// either as arrays or as single objects depending on the query.
// Keep these functions small and defensive so the repository mapping
// functions can assume a stable shape.

class SupabaseNormalizers {
    // Return a single object or null when Supabase returns either an object or an array
    static ensureSingle<T = any>(value: T | T[] | null | undefined): T | null {
        if (value == null) return null
        if (Array.isArray(value)) return value[0] ?? null
        return value as T
    }

    static normalizeScheduleRows(rows: any[] | null | undefined): any[] {
        const input = rows ?? []
        return input.map((r: any) => {
            const status = SupabaseNormalizers.ensureSingle(r.status)
            return {
                ...r,
                status,
            } as any
        }) as any[]
    }

    static normalizeBaseRecords(rows: any[] | null | undefined): any[] {
        const input = rows ?? []
        return input.map((r: any) => {
            const bmi_status = SupabaseNormalizers.ensureSingle(r.bmi_status)
            const record_status = SupabaseNormalizers.ensureSingle(r.record_status)
            return {
                ...r,
                bmi_status,
                record_status,
            } as any
        }) as any[]
    }
}

export { SupabaseNormalizers }
export default SupabaseNormalizers
