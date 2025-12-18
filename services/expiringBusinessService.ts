import { ExpiringBusinessRepository } from "@/repository/expiringBusinessRepository";
import { ExpiringBusiness } from "@/types/expiringBusinessType";

export class ExpiringBusinessService {
  constructor(private repo = new ExpiringBusinessRepository()) {}

  async getExpiringBusinesses(ownerPersonId: number): Promise<ExpiringBusiness[]> {
    return this.repo.getExpiringBusinesses(ownerPersonId);
  }
}
