// store/forms.ts
import { createFormStore } from './createFormStore';

export const useProfilingWizard = createFormStore();
export const useRegistrationStore = createFormStore();

// store/forms.ts
import { create } from 'zustand';

type ResidentFormState = {
  // PERSONAL
  fname: string
  mname: string
  lname: string
  suffix: string
  gender: string       // should store the ID you send to backend
  dob: Date | null          // "YYYY-MM-DD"
  civilStatus: string  // id
  nationality: string  // id
  religion: string     // id    

  latitude: string   // keep as string; convert to number at submit
  longitude: string
  haddress: string
  street: string
  purokSitio: string
  brgy: string
  city: string
  mobnum: string
  email: string

  // SOCIOECON
  educattainment: string      // id
  employmentstat: string      // id
  occupation: string
  mnthlypersonalincome: string // id
  govprogrm: string            // id

  // helpers
  setMany: (patch: Partial<ResidentFormState>) => void
  reset: () => void
}

export const useResidentFormStore = create<ResidentFormState>((set) => ({
  // PERSONAL
  fname: '',
  mname: '',
  lname: '',
  suffix: '',
  gender: '',  // default to "male" id if that’s 1
  dob: null,
  civilStatus: '',
  nationality: '',
  religion: '',
  haddress: '',
  latitude: '',
  longitude: '',
  street: '',
  purokSitio: '',
  brgy: '',
  city: '',
  mobnum: '',
  email: '',

  // SOCIOECON
  educattainment: '',
  employmentstat: '',
  occupation: '',
  mnthlypersonalincome: '',
  govprogrm: '',

  setMany: (patch) => set(patch),
  reset: () => set({
    fname: '', mname: '', lname: '', suffix: '',
    gender: '1', dob: '',
    civilStatus: '', nationality: '', religion: '',
    haddress: '', street: '', purokSitio: '', brgy: '', city: '',    latitude: '', longitude: '',
    mobnum: '', email: '',
    educattainment: '', employmentstat: '', occupation: '',
    mnthlypersonalincome: '', govprogrm: '',
  }),
}))
