import { Family } from "./familyTypes";

export type Household = {
    id: string;
    householdNum: string;
    householdHead: string;
    address: string;
    houseType: string;
    houseOwnership: string;
    families: Family[];
};