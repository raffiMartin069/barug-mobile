import { Member } from "./memberTypes";

export type Family = {
    familyNum: string;
    headName: string;
    type: string;
    nhts: string | boolean;
    indigent: string | boolean;
    monthlyIncome: string;
    sourceIncome: string;
    members: Member[];
};