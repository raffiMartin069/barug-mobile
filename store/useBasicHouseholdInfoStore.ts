import { create } from 'zustand';


interface BasicHouseholdInfoState {
    householdNumber: string;
    householdHead: string;
    setHouseholdNumber: (number: string) => void;
    setHouseholdHead: (name: string) => void;
    clearHouseholdInfo?: () => void;
}

export const useBasicHouseholdInfoStore = create<BasicHouseholdInfoState>((set) => ({
    householdNumber: '',
    householdHead: '',
    setHouseholdNumber: (number) => set({ householdNumber: number }),
    setHouseholdHead: (name) => set({ householdHead: name }),
    clearHouseholdInfo: () => set({ householdNumber: '', householdHead: '' }),
}));