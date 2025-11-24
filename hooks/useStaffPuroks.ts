// hooks/useStaffPuroks.ts
import { useAccountRole } from '@/store/useAccountRole'
import { useMemo } from 'react'

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
 * Hook to get staff's assigned puroks from the profile store
 */
export function useStaffPuroks() {
  const { getProfile } = useAccountRole()
  const residentProfile = getProfile('resident')

  const assignments = useMemo<StaffPurokAssignment[]>(() => {
    return residentProfile?.staff_purok_assignments || []
  }, [residentProfile?.staff_purok_assignments])

  const purokIds = useMemo(() => {
    return assignments.map(a => a.purok_sitio_id)
  }, [assignments])

  const purokNames = useMemo(() => {
    return assignments.map(a => a.purok_sitio_name).filter(Boolean)
  }, [assignments])

  return {
    assignments,
    purokIds,
    purokNames,
    hasAssignments: assignments.length > 0,
  }
}
