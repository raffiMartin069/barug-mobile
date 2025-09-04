import { create } from 'zustand'

type Role = 'resident' | 'staff' | null

type State = {
  role: Role
  staff_id?: number | null
  setResident: () => void
  setStaff: (staff_id: number) => void
  clear: () => void
}

export const useAccountRole = create<State>((set) => ({
  role: null,
  staff_id: null,
  setResident: () => set({ role: 'resident', staff_id: null }),
  setStaff: (staff_id) => set({ role: 'staff', staff_id }),
  clear: () => set({ role: null, staff_id: null }),
}))
