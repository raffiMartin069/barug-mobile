// stores/useDocRequestStore.ts
import { create } from 'zustand'

type State = {
  documentTypeId: number | null
  purposeId: number | null
  quantity: number
  forWhom: 'SELF' | 'OTHER'
  otherPersonId: number | null
}

type Actions = {
  set: (patch: Partial<State>) => void
  reset: () => void
}

export const useDocRequestStore = create<State & Actions>((set) => ({
  documentTypeId: null,
  purposeId: null,
  quantity: 1,
  forWhom: 'SELF',
  otherPersonId: null,
  set: (patch) => set(patch),
  reset: () => set({ documentTypeId: null, purposeId: null, quantity: 1, forWhom: 'SELF', otherPersonId: null })
}))
