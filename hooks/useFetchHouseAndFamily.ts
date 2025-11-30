import { HouseholdListService } from "@/services/householdList";
import { Household } from "@/types/householdType";
import { HouseholdDataTransformation } from "@/utilities/HouseholdDataTransformation";
import { useState } from "react";

export const useFetchHouseAndFamily = (staffId: number = null, isExit: boolean = false) => {
    const [households, setHouseholds] = useState<Household[]>([]);
    const [selectedHousehold, setSelectedHousehold] = useState<Household | null>(null);
    // HouseholdListService
    const getHouseholds = async (service: HouseholdListService) => {
        const rawData = await service.execute(staffId, isExit);
        if (!rawData) return;
        const transformed = HouseholdDataTransformation.TransformHouseholdData(rawData);
        setHouseholds(transformed);
        setSelectedHousehold(prev => {
            if (!prev) return prev;
            const found = transformed.find(h => h.id === prev.id);
            return found ?? prev;
        });

    }
    return { households, setHouseholds, getHouseholds, selectedHousehold, setSelectedHousehold };
}