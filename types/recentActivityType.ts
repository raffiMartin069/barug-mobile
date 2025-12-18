export type ActivityType = 
  | 'PAYMENT'
  | 'RENEWAL_REQUEST'
  | 'CLOSURE_REQUEST'
  | 'BUSINESS_UPDATE';

export type ActivityStatus = 
  | 'PAID'
  | 'PENDING'
  | 'PROCESSING'
  | 'APPROVED'
  | 'REJECTED'
  | 'COMPLETED';

export type RecentActivity = {
  activity_id: string;
  activity_type: ActivityType;
  business_id: number;
  business_name: string;
  title: string;
  description: string;
  timestamp: string;
  status: ActivityStatus;
  reference?: string;
  amount?: number;
  icon: {
    name: string;
    color: string;
    bgColor: string;
  };
  badge: {
    text: string;
    color: string;
  };
};

// Raw data types from database
export type PaymentActivityRaw = {
  or_id: number;
  or_number: string;
  issued_at: string;
  amount_paid: number;
  business_id: number;
  business_name: string;
};

export type RenewalActivityRaw = {
  renewal_request_id: number;
  request_code: string;
  business_id: number;
  business_name: string;
  period_year: number;
  request_status_id: number;
  request_status_name: string;
  created_at: string;
  paid_on?: string | null;
  total_quote: number;
};

export type ClosureActivityRaw = {
  closure_payment_request_id: number;
  request_code: string;
  business_id: number;
  business_name: string;
  request_status_id: number;
  request_status_name: string;
  created_at: string;
  paid_on?: string | null;
  total_quote: number;
};

export type BusinessUpdateActivityRaw = {
  business_id: number;
  business_name: string;
  updated_at: string;
  updated_fields?: string[];
};
