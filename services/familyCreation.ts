import { FamilyCreationRepository } from "@/repository/familyCreation";
import { HouseholdRepository } from "@/repository/householdRepository";
import { FamilyCreationRequest } from "@/types/request/familyCreationRequest";

export class FamilyCreationService {
    private readonly familyCreationRepo: FamilyCreationRepository;
    private readonly householdRepo: HouseholdRepository;

    constructor(
        familyCreationRepo: FamilyCreationRepository, 
        householdRepo: HouseholdRepository
    ) {
        this.familyCreationRepo = familyCreationRepo;
        this.householdRepo = householdRepo;
    }

    async createFamily(req: FamilyCreationRequest) {
        const householdId = await this.householdRepo.getHouseholdIdByResidentId(req.p_household_id);
        if(!householdId) {
            throw new Error("The selected household does not have an existing household.");
        }
        req.p_household_id = householdId;
        return await this.familyCreationRepo.createFamily(req);
    }
}