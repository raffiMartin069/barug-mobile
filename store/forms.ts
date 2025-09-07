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

  // 🔗 RELATIONSHIPS
  motherId: string | null
  motherName: string | null
  fatherId: string | null
  fatherName: string | null

  // ✅ single guardian to match backend
  guardianId: string | null
  guardianName: string | null

  childIds: string[]
  childNames: string[]           // same order as childIds

  // helpers
  setMany: (patch: Partial<ResidentFormState>) => void
  reset: () => void

  // relationship helpers
  setMother: (id: string | null, name?: string | null) => void
  setFather: (id: string | null, name?: string | null) => void
  setGuardian: (id: string | null, name?: string | null) => void
  clearGuardian: () => void
  addChild: (id: string, name?: string) => void
  removeChild: (id: string) => void

  // optional: adapter when loading DB row
  loadFromProfileRow: (row: any) => void
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

  // RELATIONSHIPS
  motherId: null, motherName: null,
  fatherId: null, fatherName: null,

  // ✅ single guardian
  guardianId: null, guardianName: null,

  childIds: [], childNames: [],

  setMany: (patch) => set(patch),

  reset: () =>
    set({
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
      guardianId: null, guardianName: null,
      childIds: [], childNames: [],
    }),

  // RELATIONSHIP HELPERS
  setMother: (id, name = null) => set({ motherId: id, motherName: name }),
  setFather: (id, name = null) => set({ fatherId: id, fatherName: name }),

  setGuardian: (id, name = null) => set({ guardianId: id, guardianName: name }),
  clearGuardian: () => set({ guardianId: null, guardianName: null }),

  addChild: (id, name = '') => {
    const { childIds, childNames } = get();
    if (childIds.includes(id)) return;
    set({ childIds: [...childIds, id], childNames: [...childNames, name] });
  },

  removeChild: (id) => {
    const { childIds, childNames } = get();
    const idx = childIds.indexOf(id);
    if (idx === -1) return;
    const ids = childIds.slice(); ids.splice(idx, 1);
    const names = childNames.slice(); names.splice(idx, 1);
    set({ childIds: ids, childNames: names });
  },

  // 🔌 Load a DB row (like your sample) into the store
  loadFromProfileRow: (row: any) => {
    set({
      fname: row.first_name ?? '',
      mname: row.middle_name ?? '',
      lname: row.last_name ?? '',
      suffix: row.suffix ?? '',
      gender: row.sex ?? '',
      dob: row.birthdate ? new Date(row.birthdate) : null,
      civilStatus: row.civil_status ?? '',
      nationality: row.nationality ?? '',
      religion: row.religion ?? '',
      haddress: row.street_name ?? '',
      street: row.street_name ?? '',
      purokSitio: row.purok_sitio_name ?? '',
      brgy: row.barangay_name ?? '',
      city: row.city_name ?? '',
      latitude: '', longitude: '',
      mobnum: row.mobile_num ?? '',
      email: row.email ?? '',
      educattainment: row.education ?? '',
      employmentstat: row.employment_status ?? '',
      occupation: row.occupation ?? '',
      mnthlypersonalincome: row.personal_monthly_income ?? '',
      govprogrm: row.gov_program ?? '',
      motherId: row.mother_id?.toString?.() ?? null,
      motherName: row.mother_name ?? null,
      fatherId: row.father_id?.toString?.() ?? null,
      fatherName: row.father_name ?? null,
      guardianId: row.guardian_id?.toString?.() ?? null,
      guardianName: row.guardian_name ?? null,
      childIds: Array.isArray(row.children_ids) ? row.children_ids.map((x: any) => String(x)) : [],
      childNames: Array.isArray(row.children_names) ? row.children_names : [],
    });
  },
}));
