/**
 * @file User ID types
 * @description Defines types for user identification in the application.
 * @module types/userId
 * @requires zustand
 * 
 * MgaKaHouseMates - Represents the structure for user identification including memberId, householdId, and familyId.
 * Member sa bahay ni kuya.
 */

export type MgaKaHouseMates = {
    householdHeadId: number | null;
    memberId: number | null;
    householdId: number | null;
    familyId: number | null;
    setHouseholdHeadId: (id: number) => void;
    setMemberId: (id: number) => void;
    setHouseholdId: (id: number) => void;
    setFamilyId: (id: number) => void;
    clearAll: () => void;
}