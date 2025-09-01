// services/profiling.ts
import { supabase } from '@/constants/supabase'

export async function registerResident(payload: {
  first_name: string
  middle_name?: string | null
  last_name: string
  suffix?: string | null
  date_of_birth: string
  email: string
  mobile_number: string
  sex_id: number
  civil_status_id: number
  nationality_id: number
  religion_id: number
  city: string
  barangay: string
  purok: string
  street: string
  username: string
  password: string
}) {
  const { data, error } = await supabase.rpc(
    'register_resident_with_verification', // 👈 match your SQL function
    payload
  )
  if (error) throw error
  return data
}
