import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

type Gender = 'male' | 'female'

type StoreShape = {
  fname: string
  mname: string
  lname: string
  suffix: string
  gender: Gender | ''
  dob: string

  civilStatus: string
  nationality: string
  religion: string

  haddress: string
  street: string
  puroksitio: string
  brgy: string
  city: string

  mobnum: string
  email: string
  password: string
  cpassword: string

  setField: <K extends keyof StoreShape>(key: K, value: StoreShape[K]) => void
  setAddress: (p: Partial<Pick<StoreShape, 'street' | 'puroksitio' | 'brgy' | 'city'>>) => void
  clear: () => void
}

function fmtAddress(street?: string, purok?: string, brgy?: string, city?: string) {
  return [street, purok, brgy, city].map(s => (s || '').trim()).filter(Boolean).join(', ')
}

export function createFormStore() {
  return create<StoreShape>()(
    persist(
      (set, get) => ({
        fname: '', mname: '', lname: '', suffix: '',
        gender: '', dob: '',
        civilStatus: '', nationality: '', religion: '',
        haddress: '', street: '', puroksitio: '', brgy: '', city: '',
        mobnum: '', email: '', password: '', cpassword: '',

        setField: (key, value) => set({ [key]: value } as any),

        setAddress: (p) => {
          const prev = get()
          const street = p.street ?? prev.street
          const purok  = p.puroksitio ?? prev.puroksitio
          const brgy   = p.brgy ?? prev.brgy
          const city   = p.city ?? prev.city
          set({
            street,
            puroksitio: purok,
            brgy,
            city,
            haddress: fmtAddress(street, purok, brgy, city),
          })
        },

        clear: () => set({
          fname: '', mname: '', lname: '', suffix: '',
          gender: '', dob: '',
          civilStatus: '', nationality: '', religion: '',
          haddress: '', street: '', puroksitio: '', brgy: '', city: '',
          mobnum: '', email: '', password: '', cpassword: '',
        }),
      }),
      {
        name: 'barug.registration',
        storage: createJSONStorage(() => AsyncStorage),
        // strip sensitive fields from persistence
        partialize: (s) => ({
          ...s,
          password: '',
          cpassword: '',
        }),
      }
    )
  )
}
