import { FamilyRepository } from "@/repository/familyRepository";
import { HouseholdRepository } from "@/repository/householdRepository";

export class HouseholdListService {

    private readonly familyRepository: FamilyRepository;
    private readonly householdRepository: HouseholdRepository;

    constructor(familyRepository: FamilyRepository, householdRepository: HouseholdRepository) {
        this.familyRepository = familyRepository;
        this.householdRepository = householdRepository;
    }

    async execute(p_staff_id: number = null, isExit: boolean = false) {
        let households;

        if (!p_staff_id && isExit) {
            return [];
        }

        if (!p_staff_id) {
            households = await this.householdRepository.GetActiveHousehold();
        } else {
            households = await this.householdRepository.GetActiveDesignatedHouseholdByStaffId(p_staff_id);
        }
        const fullHouseholdData = [];
        if (!households) {
            return [];
        }
        for (const household of households) {
            const members = await this.familyRepository.getFamilyDetails(household.household_id);
            fullHouseholdData.push({
                ...household,
                members: members || []
            });
        }
        return fullHouseholdData;
    }

}