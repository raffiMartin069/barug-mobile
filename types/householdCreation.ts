export type HouseholdCreation = {
    householdNumber: '';
    address: '';
    householdHead: '';
    houseType: '';
    houseOwnership: '';
    setHouseholdNumber: (value: string) => void;
    setAddress: (value: string) => void;
    setHouseholdHead: (value: string) => void;
    setHouseType: (value: string) => void;
    setHouseOwnership: (value: string) => void;
}