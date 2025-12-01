import { supabase } from "@/constants/supabase";
import { PaymentHistory } from "@/types/paymentHistoryType";

export class PaymentHistoryRepository {
  async getPaymentHistoryByOwner(
    ownerPersonId: number,
    fromDate?: string,
    toDate?: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<PaymentHistory[] | null> {
    const { data, error } = await supabase.rpc('treasurer_or_payment_summary_by_owner', {
      p_owner_person_id: ownerPersonId,
      p_from: fromDate || null,
      p_to: toDate || null
    });

    if (error) {
      console.error('Error calling treasurer_or_payment_summary_by_owner:', error);
      throw new Error(error.message);
    }
    
    const allData = (data as PaymentHistory[]) || [];
    return allData.slice(offset, offset + limit);
  }
}