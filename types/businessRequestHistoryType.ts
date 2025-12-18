// types/businessRequestHistoryType.ts

export type RequestType = 'CLEARANCE' | 'RENEWAL' | 'CLOSURE';

export interface BusinessRequestHistory {
  id: string;
  request_code: string;
  type: RequestType;
  business_id: number;
  business_name?: string;
  status: string;
  status_label: string;
  created_at: string;
  paid_on?: string | null;
  or_number?: string | null;
  total_quote?: number | null;
  period_info?: string; // e.g., "Q1 2025" or "2025"
}
