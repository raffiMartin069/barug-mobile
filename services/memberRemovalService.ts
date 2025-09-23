import { PolicyException } from "@/exception/policyException";
import { HouseholdRepository } from "@/repository/householdRepository";
import { MemberRemovalType } from "@/types/memberRemoval";

export class MemberRemovalService {

    private readonly repo: HouseholdRepository;

    constructor(repo: HouseholdRepository) {
        this.repo = repo;
    }

    async execute(data: MemberRemovalType): Promise<boolean> {
        const memberId = await this.repo.GetMemberId(Number(data.p_house_member_id));
        
        if (memberId === null) {
            throw new PolicyException("House member not found");
        }

        if (data.p_reason === "") {
            throw new PolicyException("Reason is required");
        }

        data.p_house_member_id = memberId;
        return await this.repo.RemoveMember(data);
    }

}