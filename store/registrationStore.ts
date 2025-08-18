import { create } from 'zustand';

type Gender = 'male' | 'female';

type State = {
  fname: string;
  mname: string;
  lname: string;
  suffix: string;
  gender: Gender;
  dob: string;

  civilStatus: string;
  nationality: string;
  religion: string;

  mobnum: string;
  email: string;
  password: string;
  cpassword: string;

  street: string;
  puroksitio: string;
  brgy: string;
  city: string;
  haddress: string;
};

const initial: State = {
  fname: '',
  mname: '',
  lname: '',
  suffix: '',
  gender: 'male',
  dob: '',
  civilStatus: '',
  nationality: '',
  religion: '',
  mobnum: '',
  email: '',
  password: '',
  cpassword: '',
  street: '',
  puroksitio: '',
  brgy: '',
  city: '',
  haddress: '',
};

type Actions = {
  setField: <K extends keyof State>(key: K, value: State[K]) => void;
  setAddress: (addr: Partial<Pick<State, 'street' | 'puroksitio' | 'brgy' | 'city'>>) => void;
  reset: () => void;
};

export const useRegistrationStore = create<State & Actions>((set) => ({
  ...initial,
  setField: (key, value) => set((s) => ({ ...s, [key]: value })),
  setAddress: ({ street = '', puroksitio = '', brgy = '', city = '' }) =>
    set((s) => ({
      ...s,
      street,
      puroksitio,
      brgy,
      city,
      haddress: [street, puroksitio, brgy, city].filter(Boolean).join(', '),
    })),
  reset: () => set(initial),
}));
