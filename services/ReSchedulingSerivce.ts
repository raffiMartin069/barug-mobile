import { HealthWorkerRepository } from "@/repository/HealthWorkerRepository";
import { RescheduleType } from "@/types/rescheduleTypes";
import { ScheduleCompletedType } from "@/types/scheduleCompleted";

export class ReSchedulingService {

    private readonly schedulingRepo: HealthWorkerRepository;

    constructor(schedulingRepo: HealthWorkerRepository) {
        this.schedulingRepo = schedulingRepo;
    }

    public async Execute(info: RescheduleType) {
        const schedId = await this.schedulingRepo.GetScheduleIdByHouseholdId(info.p_schedule_id);
        if (!schedId) {
            return null;
        }
        const res = await this.schedulingRepo.InsertReschedule({
            p_schedule_id: schedId,
            p_new_week_id: info.p_new_week_id,
            p_resched_by_id: info.p_resched_by_id,
            p_reason: info.p_reason
        });
        return res;
    }

}