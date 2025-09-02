// /store/validId.ts
import { create } from 'zustand'

export type Picked = {
  uri?: string
  path?: string
  name?: string
  fileName?: string
  mimeType?: string
  type?: string
  base64?: string
  width?: number
  height?: number
} | null

type ValidIdState = {
  id_type_id: number | null
  id_front_uri: string | null
  id_front_name: string | null
  id_back_uri: string | null
  id_back_name: string | null
  id_selfie_uri: string | null
  id_selfie_name: string | null
  // bulk setter to save page payload
  setValidId: (payload: Partial<ValidIdState>) => void
  // reset if you need to clear (optional)
  reset: () => void
}

const initialState: Omit<ValidIdState, 'setValidId' | 'reset'> = {
  id_type_id: null,
  id_front_uri: null,
  id_front_name: null,
  id_back_uri: null,
  id_back_name: null,
  id_selfie_uri: null,
  id_selfie_name: null,
}

export const useValidIdStore = create<ValidIdState>((set) => ({
  ...initialState,
  setValidId: (payload) => set((s) => ({ ...s, ...payload })),
  reset: () => set(() => ({ ...initialState })),
}))
