import { create  } from "zustand";

export const useFamilyCreationStore = create((set) => ({
    houseNumber: '',
    relationship: 0,
    nhts: 2,
    indigent: 2,
    sourceOfIncome: '',
    familyMonthlyIncome: 0,
    setHouseNumber: (val) => set({ houseNumber: val }),
    setFamilyHead: (val) => set({ familyHead: val }),
    setRelationship: (val) => set({ relationship: val }),
    setNhts: (val) => set({ nhts: val }),
    setIndigent: (val) => set({ indigent: val }),
    setSourceOfIncome: (val) => set({ sourceOfIncome: val }),
    setFamilyMonthlyIncome: (val) => set({ familyMonthlyIncome: val }),
    clearAll: () => set({
        houseNumber: '',
        relationship: 0,
        nhts: 2,
        indigent: 2,
        sourceOfIncome: '',
        familyMonthlyIncome: 0,
    })
}))