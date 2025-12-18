import { HouseholdCreation } from "@/repository/householCreation";
import { HouseholdCreationRequest } from "@/types/request/householdCreationRequest";

export class HouseholdCreationService {
    
    private readonly repo;

    constructor(repo: HouseholdCreation) {
        this.repo = repo;
    }

    public execute(req: HouseholdCreationRequest) {
        return this.repo.createHousehold(req);
    }
}