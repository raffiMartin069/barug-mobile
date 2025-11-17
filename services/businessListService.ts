import { BusinessRepository } from "@/repository/businessRepository";

export class BusinessListService {
    constructor(private repo = new BusinessRepository()) {}

    async fetchByOwner(ownerId: number) {
        return this.repo.getBusinessesByOwner(ownerId);
    }
    
}