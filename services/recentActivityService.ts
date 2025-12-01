import { RecentActivityRepository } from "@/repository/recentActivityRepository";
import { RecentActivity } from "@/types/recentActivityType";

export class RecentActivityService {
  constructor(private repo = new RecentActivityRepository()) {}

  async getRecentActivities(ownerPersonId: number, limit: number = 10): Promise<RecentActivity[]> {
    return this.repo.getRecentActivities(ownerPersonId, limit);
  }
}
