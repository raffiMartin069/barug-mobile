// services/staffPurok.ts
import { supabase } from '@/constants/supabase'

export type StaffPurokAssignment = {
  staff_purok_id: number
  assigned_from: string
  assigned_to: string | null
  is_active: boolean
  purok_sitio_id: number
  staff_id: number
  staff_acc_req_id: number | null
  purok_sitio_name?: string
  purok_sitio_code?: string
}

/**
 * Fetch active purok assignments for a staff member with purok details
 */
export async function fetchStaffPurokAssignments(staffId: number): Promise<StaffPurokAssignment[]> {
  const { data, error } = await supabase
    .from('staff_purok_assignment')
    .select(`
      staff_purok_id,
      assigned_from,
      assigned_to,
      is_active,
      purok_sitio_id,
      staff_id,
      staff_acc_req_id,
      purok_sitio:purok_sitio_id (
        purok_sitio_name,
        purok_sitio_code
      )
    `)
    .eq('staff_id', staffId)
    .eq('is_active', true)

  if (error) throw error

  return (data || []).map((item: any) => ({
    staff_purok_id: item.staff_purok_id,
    assigned_from: item.assigned_from,
    assigned_to: item.assigned_to,
    is_active: item.is_active,
    purok_sitio_id: item.purok_sitio_id,
    staff_id: item.staff_id,
    staff_acc_req_id: item.staff_acc_req_id,
    purok_sitio_name: item.purok_sitio?.purok_sitio_name,
    purok_sitio_code: item.purok_sitio?.purok_sitio_code,
  }))
}
