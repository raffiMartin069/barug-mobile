import { HouseholdCreation } from "@/repository/householCreation";

export class PersonSearchService {

    private readonly key;

    constructor(key: string) {
        this.key = key;
    }

    public async execute() {
        return await new HouseholdCreation().findHouseholdHeadByName(this.key);
    }
}