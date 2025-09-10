/**
 * 
 * Use this store to persist a specific user id across app sessions.
 * 
 */

import { create } from "zustand";

export const useHouseMateStore = create((set) => ({
    memberId: null as number | null,
    householdId: null as number | null,
    familyId: null as number | null,
    setMemberId: (id: number) => set({ memberId: id }),
    setHouseholdId: (id: number) => set({ householdId: id }),
    setFamilyId: (id: number) => set({ familyId: id }),
    clearAll: () => set({ memberId: null, householdId: null, familyId: null}),
}));