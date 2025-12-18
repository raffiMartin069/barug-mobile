import { HealthWorkerRepository } from "@/repository/HealthWorkerRepository";
import { ScheduleCompletedType } from "@/types/scheduleCompleted";

export class ConfirmScheduleService {

    private readonly schedulingRepo: HealthWorkerRepository;

    constructor(schedulingRepo: HealthWorkerRepository) {
        this.schedulingRepo = schedulingRepo;
    }

    public async Execute(info: ScheduleCompletedType) {
        const schedId = await this.schedulingRepo.GetScheduleIdByHouseholdId(Number(info.p_hth_id));
        const res = await this.schedulingRepo.InsertMarkAsDone({
            p_hth_id: schedId,
            p_staff_id: info.p_staff_id,
            p_remarks: info.p_remarks ?? "N/A"
        });
        return res;
    }


}