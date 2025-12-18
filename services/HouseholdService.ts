import { HouseholdException } from "@/exception/HouseholdException";
import { HouseholdRepository } from "@/repository/householdRepository";
import { HouseholdUpdateType } from "@/types/request/householdUpdateType";

export class HouseholdService {

    private readonly _HouseholdRepository: HouseholdRepository;

    constructor(householdRepository?: HouseholdRepository) {
        this._HouseholdRepository = householdRepository;
    }

    async ExecuteUpdateHouseholdInformation(request: HouseholdUpdateType) {
        if(!request) {
            throw new Error("Request object is required");
        }
        console.log("Initial Request:", request);
        const householdId = await this._HouseholdRepository.GetHouseholdIdByHouseholdNumber(request.p_household_id.toString());
        console.log("Fetched Household ID:", householdId);
        if (!householdId) {
            throw new HouseholdException("Household not found");
        }
        request.p_household_id = householdId;
        console.log("Updated Request:", request);
        return this._HouseholdRepository.UpdateHouseholdInformation(request);
    }


}