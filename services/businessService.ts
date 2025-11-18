import { BusinessRepository } from "@/repository/businessRepository";

export class BusinessService {
    constructor(private repo = new BusinessRepository()) {}

    async fetchByOwner(ownerId: number) {
        return this.repo.getBusinessesByOwner(ownerId);
    }

    async fetchDetails(businessId: number) {
        return this.repo.getDetails(businessId)
    }
    
}