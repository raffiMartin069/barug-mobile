// store/validIdStore.ts
import { create } from 'zustand'

export type ValidIdPayload = {
  id_type_id: number | null
  id_front_uri: string
  id_front_name: string | null
  id_back_uri: string | null
  id_back_name: string | null
  id_selfie_uri: string
  id_selfie_name: string | null
}

type State = {
  validId: ValidIdPayload | null
  setValidId: (v: ValidIdPayload | null) => void
  clear: () => void
}

export const useValidIdStore = create<State>((set) => ({
  validId: null,
  setValidId: (v) => set({ validId: v }),
  clear: () => set({ validId: null }),
}))
