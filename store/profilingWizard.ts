import { create } from 'zustand';

type Personal = {
  first_name: string; middle_name: string | null; last_name: string; suffix: string | null;
  date_of_birth: string; email: string; mobile_number: string; sex_id: 1|2;
  civil_status_id: number; nationality_id: number; religion_id: number;
  city: string; barangay: string; purok: string; street: string;
  username: string; password: string;
};

type Socio = {
  indigent_status_id?: number | null;
  nhts_status_id?: number | null;
  monthly_income_range_id?: number | null;
  source_of_income_note?: string | null;
};

type ValidID = {
  id_type_id: number | null
  id_number: string | null
  id_front_uri: string | null
  id_front_name: string | null      // NEW
  id_back_uri: string | null
  id_back_name: string | null       // NEW
  id_selfie_uri: string | null
  id_selfie_name: string | null     // NEW
};

type State = {
  personal?: Personal;
  socio?: Socio;
  validId?: ValidID;
  setPersonal: (v: Personal) => void;
  setSocio: (v: Socio) => void;
  setValidId: (v: ValidID) => void;
  clear: () => void;
};

export const useProfilingWizard = create<State>((set) => ({
  personal: undefined,
  socio: undefined,
  validId: undefined,
  setPersonal: (v) => set({ personal: v }),
  setSocio: (v) => set({ socio: v }),
  setValidId: (v) => set({ validId: v }),
  clear: () => set({ personal: undefined, socio: undefined, validId: undefined }),
}));