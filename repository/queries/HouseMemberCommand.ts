import { supabase } from '@/constants/supabase';

export class HouseMemberCommand {
    /**
     * Fetch an active house_member record by person id.
     * Returns the first active house_member row for the given person, or null.
     */
    async FetchActiveHouseMemberByPersonId(personId: number) {
        try {
            const { data, error } = await supabase
                .from('house_member')
                .select('*')
                .eq('person_id', personId)
                .eq('is_active', true)
                .limit(1)
            if (error) throw error
            return Array.isArray(data) && data.length > 0 ? data[0] : null
        } catch (e) {
            console.error('FetchActiveHouseMemberByPersonId error', e)
            return null
        }
    }

    /**
     * Get a house_member row by its primary id.
     */
    async GetHouseMemberById(houseMemberId: number | string) {
        try {
            const { data, error } = await supabase
                .from('house_member')
                .select('*')
                .eq('house_member_id', String(houseMemberId))
                .limit(1)
            if (error) throw error
            return Array.isArray(data) && data.length > 0 ? data[0] : null
        } catch (e) {
            console.error('GetHouseMemberById error', e)
            return null
        }
    }

    /**
     * List house members by family id.
     */
    async GetHouseMembersByFamilyId(familyId: number | string) {
        try {
            const { data, error } = await supabase
                .from('house_member')
                .select('*')
                .eq('family_id', String(familyId))
            if (error) throw error
            return Array.isArray(data) ? data : []
        } catch (e) {
            console.error('GetHouseMembersByFamilyId error', e)
            return []
        }
    }

    /**
     * Insert a new house_member record.
     * Accepts a partial object with appropriate fields.
     */
    async AddHouseMember(payload: any) {
        try {
            const { data, error } = await supabase
                .from('house_member')
                .insert([payload])
                .select()
            if (error) throw error
            return Array.isArray(data) && data.length > 0 ? data[0] : null
        } catch (e) {
            console.error('AddHouseMember error', e)
            return null
        }
    }

    /**
     * Soft remove a house member by setting is_active = false.
     * Accepts either house_member_id or person_id (prefer houseMemberId).
     */
    async RemoveHouseMember({ houseMemberId, personId }: { houseMemberId?: number | string, personId?: number | string }) {
        try {
            let query = supabase.from('house_member').update({ is_active: false })
            if (houseMemberId) query = query.eq('house_member_id', String(houseMemberId))
            else if (personId) query = query.eq('person_id', Number(personId))
            else throw new Error('houseMemberId or personId required')

            const { data, error } = await query.select()
            if (error) throw error
            return Array.isArray(data) && data.length > 0 ? data[0] : null
        } catch (e) {
            console.error('RemoveHouseMember error', e)
            return null
        }
    }

    /**
     * Mark a house_member as quarterly confirmed.
     */
    async ConfirmQuarterly(houseMemberId: number | string, confirmedById: number | string) {
        try {
            const { data, error } = await supabase
                .from('house_member')
                .update({ is_quarterly_confirmed: true, quarterly_confirmed_by_id: String(confirmedById) })
                .eq('house_member_id', String(houseMemberId))
                .select()
            if (error) throw error
            return Array.isArray(data) && data.length > 0 ? data[0] : null
        } catch (e) {
            console.error('ConfirmQuarterly error', e)
            return null
        }
    }
}