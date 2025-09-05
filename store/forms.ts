// store/forms.ts
import { create } from 'zustand';

type ResidentFormState = {
  // PERSONAL (unchanged)
  fname: string
  mname: string
  lname: string
  suffix: string
  gender: string
  dob: Date | null
  civilStatus: string
  nationality: string
  religion: string
  latitude: string
  longitude: string
  haddress: string
  street: string
  purokSitio: string
  brgy: string
  city: string
  mobnum: string
  email: string

  // SOCIOECON (unchanged)
  educattainment: string
  employmentstat: string
  occupation: string
  mnthlypersonalincome: string
  govprogrm: string

  // 🔗 RELATIONSHIPS (NEW)
  motherId: string | null
  motherName: string | null
  fatherId: string | null
  fatherName: string | null
  guardianIds: string[]
  guardianNames: string[]        // same order as guardianIds
  childIds: string[]
  childNames: string[]           // same order as childIds

  // helpers
  setMany: (patch: Partial<ResidentFormState>) => void
  reset: () => void

  // 🔧 relationship helpers
  setMother: (id: string | null, name?: string | null) => void
  setFather: (id: string | null, name?: string | null) => void
  addGuardian: (id: string, name?: string) => void
  removeGuardian: (id: string) => void
  addChild: (id: string, name?: string) => void
  removeChild: (id: string) => void
}

export const useResidentFormStore = create<ResidentFormState>((set, get) => ({
  // PERSONAL
  fname: '', mname: '', lname: '', suffix: '',
  gender: '', dob: null,
  civilStatus: '', nationality: '', religion: '',
  haddress: '', street: '', purokSitio: '', brgy: '', city: '',
  latitude: '', longitude: '',
  mobnum: '', email: '',

  // SOCIOECON
  educattainment: '', employmentstat: '', occupation: '',
  mnthlypersonalincome: '', govprogrm: '',

  // 🔗 RELATIONSHIPS (NEW defaults)
  motherId: null, motherName: null,
  fatherId: null, fatherName: null,
  guardianIds: [], guardianNames: [],
  childIds: [], childNames: [],

  setMany: (patch) => set(patch),

  reset: () => set({
    fname: '', mname: '', lname: '', suffix: '',
    gender: '', dob: null,
    civilStatus: '', nationality: '', religion: '',
    haddress: '', street: '', purokSitio: '', brgy: '', city: '',
    latitude: '', longitude: '',
    mobnum: '', email: '',
    educattainment: '', employmentstat: '', occupation: '',
    mnthlypersonalincome: '', govprogrm: '',
    motherId: null, motherName: null,
    fatherId: null, fatherName: null,
    guardianIds: [], guardianNames: [],
    childIds: [], childNames: [],
  }),

  // 🔧 RELATIONSHIP HELPERS
  setMother: (id, name = null) => set({ motherId: id, motherName: name }),
  setFather: (id, name = null) => set({ fatherId: id, fatherName: name }),

  addGuardian: (id, name = '') => {
    const { guardianIds, guardianNames } = get()
    if (guardianIds.includes(id)) return
    set({ guardianIds: [...guardianIds, id], guardianNames: [...guardianNames, name] })
  },

  removeGuardian: (id) => {
    const { guardianIds, guardianNames } = get()
    const idx = guardianIds.indexOf(id)
    if (idx === -1) return
    const ids = guardianIds.slice(); ids.splice(idx, 1)
    const names = guardianNames.slice(); names.splice(idx, 1)
    set({ guardianIds: ids, guardianNames: names })
  },

  addChild: (id, name = '') => {
    const { childIds, childNames } = get()
    if (childIds.includes(id)) return
    set({ childIds: [...childIds, id], childNames: [...childNames, name] })
  },

  removeChild: (id) => {
    const { childIds, childNames } = get()
    const idx = childIds.indexOf(id)
    if (idx === -1) return
    const ids = childIds.slice(); ids.splice(idx, 1)
    const names = childNames.slice(); names.splice(idx, 1)
    set({ childIds: ids, childNames: names })
  },
}));
