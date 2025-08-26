export type FamilyApplication = {
    houseNumber: string;
    relationship: number;
    nhts: number;
    indigent: number;
    sourceOfIncome: string;
    familyMonthlyIncome: number;
    setHouseNumber: (val: string) => void,
    setFamilyHead: (val: string) => void,
    setRelationship: (val: number) => void,
    setNhts: (val: number) => void,
    setIndigent: (val: number) => void,
    setSourceOfIncome: (val: number) => void,
    setFamilyMonthlyIncome: (val: number) => void,
    clearAll: () => void
}
