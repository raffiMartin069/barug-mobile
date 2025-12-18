import { HealthWorkerRepository } from "@/repository/HealthWorkerRepository";
import { SchedulingService } from "@/services/SchedulingService";
import { Household } from "@/types/householdType";
import { SchedulingUtility } from "@/utilities/SchedulingUtlitiy";
import { useState } from "react";

export const useFetchSchedule = () => {
    const [households, setHouseholds] = useState<Household[]>([])
    
    const fetchSchedules = async () => {
        try {
            const service = new SchedulingService(new HealthWorkerRepository());
            const raw = await service.Execute();
            const docs = (Array.isArray(raw) ? raw : [])
                .map((r) => {
                    if (typeof r === "string") {
                        try { return JSON.parse(r); } catch { return null; }
                    }
                    return r;
                })
                .filter(Boolean);
            return setHouseholds(SchedulingUtility.NormalizeDocs(docs));
        } catch (err) {
            console.error("Failed to fetch/normalize households:", err);
            setHouseholds([]);
        }
    }
    return { households, setHouseholds, fetchSchedules }
}