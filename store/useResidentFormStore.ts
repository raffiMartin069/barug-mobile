import { create } from 'zustand';

interface ResidentFormState {
  fname: string;
  mname: string;
  lname: string;
  suffix: string;
  gender: string;
  dob: string;
  civilStatus: string;
  nationality: string;
  religion: string;
  haddress: string;
  mobnum: string;
  email: string;
  password: string;
  cpassword: string;
  setField: (field: string, value: string) => void;
  resetForm: () => void;
}

export const useResidentFormStore = create<ResidentFormState>((set) => ({
  fname: '',
  mname: '',
  lname: '',
  suffix: '',
  gender: 'male',
  dob: '',
  civilStatus: '',
  nationality: '',
  religion: '',
  haddress: '',
  mobnum: '',
  email: '',
  password: '',
  cpassword: '',
  setField: (field, value) => set({ [field]: value }),
  resetForm: () =>
    set({
      fname: '',
      mname: '',
      lname: '',
      suffix: '',
      gender: 'male',
      dob: '',
      civilStatus: '',
      nationality: '',
      religion: '',
      haddress: '',
      mobnum: '',
      email: '',
      password: '',
      cpassword: '',
    }),
}));
