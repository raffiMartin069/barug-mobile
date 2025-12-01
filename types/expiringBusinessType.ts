export type ExpiringBusiness = {
  business_id: number;
  business_name: string;
  business_status_name: string;
  expiry_year: number;
  renewal_deadline: string; // Jan 20 of next year
  days_until_deadline: number;
  urgency: 'critical' | 'warning' | 'info'; // <30 days, <60 days, >60 days
};
