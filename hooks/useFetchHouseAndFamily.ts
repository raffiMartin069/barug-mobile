import { HouseholdListService } from "@/services/householdList";
import { Household } from "@/types/householdType";
import { useState } from "react";

export const useFetchHouseAndFamily = () => {
    const [households, setHouseholds] = useState<Household[]>([]);
    const [selectedHousehold, setSelectedHousehold] = useState<Household | null>(null);
    // HouseholdListService
    const getHouseholds = async (service: HouseholdListService) => {
        const rawData = await service.execute();

        const transformed: Household[] = rawData.map((item: any) => {
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
        if (!rawData) return;
        setHouseholds(transformed);
        setSelectedHousehold(prev => {
            if (!prev) return prev;
            const found = transformed.find(h => h.id === prev.id);
            return found ?? prev;
        });

    }
    return { households, getHouseholds, selectedHousehold, setSelectedHousehold };
}