import { create } from 'zustand'

export type UpdateHouseholdInforState = {
    householdNumber: number;
    householdHead: string;
    address: string;
    houseType: string;
    houseOwnership: string;
    setHouseholdNumber: (number: number) => void;
    setHouseholdHead: (head: string) => void;
    setAddress: (address: string) => void;
    setHouseType: (type: string) => void;
    setHouseOwnership: (ownership: string) => void;
    clear: () => void;
};

export const useUpdateHouseholdInforStore = create<UpdateHouseholdInforState>((set) => ({
    householdNumber: 0,
    householdHead: '',
    address: '',
    houseType: '',
    houseOwnership: '',
    setHouseholdNumber: (number: number) => set({ householdNumber: number }),
    setHouseholdHead: (head: string) => set({ householdHead: head }),
    setAddress: (address: string) => set({ address }),
    setHouseType: (type: string) => set({ houseType: type }),
    setHouseOwnership: (ownership: string) => set({ houseOwnership: ownership }),
    clear: () => set({
        householdNumber: 0,
        householdHead: '',
        address: '',
        houseType: '',
        houseOwnership: '',
    })
}));