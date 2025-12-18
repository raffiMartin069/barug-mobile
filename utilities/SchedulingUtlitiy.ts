import { HealthWorkerRepository } from "@/repository/HealthWorkerRepository";
import { ConfirmScheduleService } from "@/services/ConfirmScheduleService";
import { Household } from "@/types/householdType";
import { ScheduleCompletedType } from "@/types/scheduleCompleted";
import { Alert } from "react-native";

export class SchedulingUtility {

    public static async MarkAsDone (info: ScheduleCompletedType) {
            try {
                const service = new ConfirmScheduleService(new HealthWorkerRepository());
                const res = await service.Execute(info);
                if (!res) {
                    return 'Failed, Unable to mark as done. Please try again later.';
                }
                return 'Household marked as done.';
            } catch (error) {
                throw error;
            }
        }

    public static NormalizeDocs(docs: any[]): Household[] {
        return docs.map((doc: any) => {
            const hh = doc.household ?? {};
            const families = Array.isArray(doc.families) ? doc.families : [];
            return {
                id: hh.household_id ? `HH-${hh.household_id}` : `HH-${hh.household_num ?? Math.random().toString(36).slice(2, 8)}`,
                householdNum: hh.household_num ?? String(hh.household_id ?? ""),
                householdHead: hh.household_head_name ?? "",
                address: hh.address ?? "",
                houseType: hh.house_type ?? "",
                houseOwnership: hh.house_ownership ?? "",
                families: families.map((f: any) => ({
                    familyNum: f.family_num ?? (f.family_id ? `FAM-${f.family_id}` : ""),
                    headName: f.family_head_name ?? "",
                    type: f.household_type ?? "",
                    nhts: f.nhts_status ?? "",
                    indigent: f.indigent_status ?? "",
                    monthlyIncome: f.monthly_income ?? "",
                    sourceIncome: f.source_of_income ?? "",
                    members: Array.isArray(f.members)
                        ? f.members.map((m: any) => ({
                            id: m.person_id ? `P-${m.person_id}` : (m.full_name ?? "").replace(/\s+/g, "_"),
                            name: m.full_name ?? "",
                            relation: m.relationship_to_household_head ?? m.relationship ?? "",
                            age: typeof m.age === "number" ? m.age : parseInt(m.age, 10) || 0,
                            sex: m.sex ?? "",
                        }))
                        : [],
                })),
            };
        });
    }

}