import { PaymentHistoryRepository } from "@/repository/paymentHistoryRepository";

export class PaymentHistoryService {
  constructor(private repo = new PaymentHistoryRepository()) {}

  async fetchPaymentHistory(ownerPersonId: number, fromDate?: string, toDate?: string, limit?: number, offset?: number) {
    return this.repo.getPaymentHistoryByOwner(ownerPersonId, fromDate, toDate, limit, offset);
  }
}