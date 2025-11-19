export type Business = {
    business_id: number;
    business_name: string;
    business_category_name: string | null;
    business_nature: string | null;
    business_owner_name: string | null;
    business_address: string | null;
    business_status_name: string | null;
    ownership_type_name: string | null;
}

export type BusinessDetails = {
  business_id: number;
  business_name: string;
  business_nature?: string | null;
  business_type?: string | null;
  ownership_type?: string | null;
  business_address?: string | null;
  description?: string | null;
  date_established?: string | null; 
  mnthly_gross_incom_est?: number | null;
  capital_invested?: string | null;
  operating_days?: string | null;
  num_of_employees?: number | null;
  proof_images?: string[] | null;
  dti_reg_num?: string | null;
  prev_year_gross_sales?: string | null; 
  operating_hours?: string | null;
  business_category?: string | null;
  business_status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  owner_person_id?: number | null;
  owner_full_name?: string | null;
};

export type QuoteRow = {
  item_year: number;
  kind: "ARREARS" | "CURRENT" | string;
  base_fee: number | null;
  offense_no?: string | null;
  surcharge: number | null;
  total: number | null;
  deadline?: string | null;
  days_late?: number | null;
};

export type QuoteBreakdown = {
  rows: QuoteRow[];
  grand_total: number;
};

export type PaidRecord = {
  period_year: number;
  or_number: string | null;
  paid_on: string | null;
};

