import { create } from "zustand"

export const useDropdownValueStore = create((set) => ({
  householdId: "",
  familyId: "",
  setHouseholdId: (val) => set({ householdId: val }),
  setFamilyId: (val) => set({ familyId: val }),
  clearValues: () => set({ householdId: null, familyId: null }),
}))