import { HealthWorkerRepository } from "@/repository/HealthWorkerRepository";

export class SchedulingService {

    private readonly schedulingRepo: HealthWorkerRepository;

    constructor(schedulingRepo: HealthWorkerRepository) {
        this.schedulingRepo = schedulingRepo;
    }

    public async Execute() {
        const householdId = await HealthWorkerRepository.GetHouseholdIdWithSchedule()
        const households = [];
        for (let i = 0; i < householdId?.length!; i++) {
            households.push(await HealthWorkerRepository.CallActiveSchedulingFunc(householdId![i]));
        }
        return households;
    }

}