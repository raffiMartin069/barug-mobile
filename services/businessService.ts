import { BusinessRepository } from "@/repository/businessRepository";
import { QuoteBreakdown } from "@/types/businessType";

export class BusinessService {
    constructor(private repo = new BusinessRepository()) {}

    async fetchByOwner(ownerId: number) {
        return this.repo.getBusinessesByOwner(ownerId);
    }

    async fetchDetails(businessId: number) {
        return this.repo.getDetails(businessId)
    }

    async fetchAutoQuote(businessId: number, year: number): Promise<QuoteBreakdown> {
        const rows = await this.repo.fetchAutoQuote(businessId, year);
        const grand_total = await this.repo.fetchAutoGrandTotal(businessId, year);
        return { rows, grand_total };
    }
    
}