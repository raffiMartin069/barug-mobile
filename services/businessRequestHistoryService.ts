// services/businessRequestHistoryService.ts
import { getBusinessRequestHistory } from '@/repository/businessRequestHistoryRepository';
import type { BusinessRequestHistory } from '@/types/businessRequestHistoryType';

export async function fetchBusinessRequestHistory(
  businessOwnerId: number
): Promise<BusinessRequestHistory[]> {
  return await getBusinessRequestHistory(businessOwnerId);
}
