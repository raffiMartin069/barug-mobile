import { BusinessStatsRepository } from "@/repository/businessStatsRepository";
import { BusinessStats } from "@/types/businessStatsType";

export class BusinessStatsService {
  constructor(private repo = new BusinessStatsRepository()) {}

  async getStats(ownerPersonId: number): Promise<BusinessStats> {
    return this.repo.getBusinessStats(ownerPersonId);
  }
}
