import { HealthWorkerRepository } from "@/repository/HealthWorkerRepository";

export class SearchSchedulingService {

    private readonly schedulingRepo: HealthWorkerRepository;

    constructor(schedulingRepo: HealthWorkerRepository) {
        this.schedulingRepo = schedulingRepo;
    }

    public async Execute(key: string | number, executionType: number) {
        const households = [];
        let res = null;
        switch (executionType) {
            case 1:
                res = await HealthWorkerRepository.FindByKey(String(key))
                for (let i = 0; i < res?.length!; i++) {
                    households.push(await HealthWorkerRepository.CallActiveSchedulingFunc(res![i]));
                }
                break;
            case 2:
                res = await HealthWorkerRepository.FilterByStatus(parseInt(String(key)));
                for (let i = 0; i < res?.length!; i++) {
                    households.push(await HealthWorkerRepository.CallActiveSchedulingFunc(res![i]));
                }
                break;
            case 3:
                res = await HealthWorkerRepository.GetWeeklyScheduleId(String(key));
                if (res === null) {
                    return [];
                }
                for (let i = 0; i < res?.length!; i++) {
                    households.push(await HealthWorkerRepository.CallActiveSchedulingFunc(res![i]));
                }
                break;
            default:
                break;
        }
        return households;
    }

}