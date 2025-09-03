import { create } from "zustand"


export const useHouseholdCreationStore = create((set) => ({
    householdNumber: '',
    address: '',
    householdHead: '',
    houseType: '',
    houseOwnership: '',
    setHouseholdNumber: (value: string) => set({ householdNumber: value }),
    setAddress: (value: string) => set({ address: value }),
    setHouseholdHead: (value: string) => set({ householdHead: value }),
    setHouseType: (value: string) => set({ houseType: value }),
    setHouseOwnership: (value: string) => set({ houseOwnership: value }),
    clear: () => set({
        householdNumber: '',
        address: '',
        householdHeadId: '',
        houseType: '',
        houseOwnership: '',
    })
}))