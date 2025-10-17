import { Household } from "@/types/householdType";

export class HouseholdDataTransformation {

    static TransformFilteredAndSearchHouseholdData(rawData: any[]): Household[] {
        const transformedHouseholds = rawData.map((data: any) => ({
            id: data.household.household_id,
            householdNum: data.household.household_num,
            householdHead: data.household.household_head_name,
            houseType: data.household.house_type,
            houseOwnership: data.household.house_ownership,
            address: data.household.address,
            families: data.families.map((fam: any) => ({
                familyNum: fam.family_num,
                headName: fam.family_head_name,
                type: fam.household_type,
                nhts: fam.nhts_status,
                indigent: fam.indigent_status,
                monthlyIncome: fam.monthly_income,
                sourceIncome: fam.source_of_income,
                members: fam.members.map((mem: any) => ({
                    id: mem.person_id.toString(),
                    name: mem.full_name,
                    relation: mem.relationship_to_household_head,
                    age: mem.age,
                    sex: mem.sex,
                })),
            })),
        }));
        return transformedHouseholds;
    }

    static TransformHouseholdData(rawData: any[]): Household[] {
        return rawData.map((item: any) => {
            const parsed = JSON.parse(item.members);
            return {
                id: String(item.household_id),
                householdNum: item.household_num,
                householdHead: item.household_head_name,
                address: item.address,
                houseType: parsed.household.house_type,
                houseOwnership: parsed.household.house_ownership,
                families: parsed.families.map((fam: any) => ({
                    familyNum: fam.family_num,
                    headName: fam.family_head_name,
                    type: fam.household_type,
                    nhts: fam.nhts_status,
                    indigent: fam.indigent_status,
                    monthlyIncome: fam.monthly_income,
                    sourceIncome: fam.source_of_income,
                    members: fam.members.map((m: any, idx: number) => ({
                        id: `${m.person_id}-${idx}`,
                        name: m.full_name,
                        relation: "",
                        age: 0,
                        sex: "Male",
                    })),
                })),
            };
        });
    };

}
