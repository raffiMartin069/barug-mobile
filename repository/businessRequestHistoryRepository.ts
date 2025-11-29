// repository/businessRequestHistoryRepository.ts
import { supabase } from '@/constants/supabase';
import type { BusinessRequestHistory } from '@/types/businessRequestHistoryType';

export async function getBusinessRequestHistory(
  businessOwnerId: number
): Promise<BusinessRequestHistory[]> {
  try {
    const results: BusinessRequestHistory[] = [];

    // 1. Fetch clearance requests (doc_request_hdr)
    const { data: clearances, error: clearanceError } = await supabase
      .from('doc_request_hdr')
      .select(`
        doc_request_id,
        request_code,
        created_at,
        business_id,
        request_status:request_status_id(request_status_name),
        business!inner(business_name, business_owner_id)
      `)
      .eq('business.business_owner_id', businessOwnerId)
      .not('business_id', 'is', null)
      .order('created_at', { ascending: false });

    if (clearanceError) throw clearanceError;

    if (clearances) {
      clearances.forEach((c: any) => {
        const statusName = c.request_status?.request_status_name || 'PENDING';
        results.push({
          id: `clearance-${c.doc_request_id}`,
          request_code: c.request_code,
          type: 'CLEARANCE',
          business_id: c.business_id,
          business_name: c.business?.business_name,
          status: statusName.toUpperCase().replace(/ /g, '_'),
          status_label: statusName,
          created_at: c.created_at,
        });
      });
    }

    // 2. Fetch renewal requests
    const { data: renewals, error: renewalError } = await supabase
      .from('renewal_request')
      .select(`
        renewal_request_id,
        request_code,
        created_at,
        business_id,
        request_status:request_status_id(request_status_name),
        paid_on,
        or_number,
        total_quote,
        period_type,
        period_year,
        period_quarter,
        business!inner(business_name, business_owner_id)
      `)
      .eq('business.business_owner_id', businessOwnerId)
      .order('created_at', { ascending: false });

    if (renewalError) throw renewalError;

    if (renewals) {
      renewals.forEach((r: any) => {
        const periodInfo = r.period_type === 'QUARTERLY' 
          ? `Q${r.period_quarter} ${r.period_year}`
          : `${r.period_year}`;
        
        const statusName = r.request_status?.request_status_name || 'PENDING';
        
        results.push({
          id: `renewal-${r.renewal_request_id}`,
          request_code: r.request_code,
          type: 'RENEWAL',
          business_id: r.business_id,
          business_name: r.business?.business_name,
          status: statusName.toUpperCase().replace(/ /g, '_'),
          status_label: statusName,
          created_at: r.created_at,
          paid_on: r.paid_on,
          or_number: r.or_number,
          total_quote: r.total_quote,
          period_info: periodInfo,
        });
      });
    }

    // 3. Fetch closure requests
    const { data: closures, error: closureError } = await supabase
      .from('closure_payment_request')
      .select(`
        closure_payment_request_id,
        request_code,
        created_at,
        business_id,
        request_status:request_status_id(request_status_name),
        paid_on,
        or_number,
        total_quote,
        period_type,
        period_year,
        period_quarter,
        business!inner(business_name, business_owner_id)
      `)
      .eq('business.business_owner_id', businessOwnerId)
      .order('created_at', { ascending: false });

    if (closureError) throw closureError;

    if (closures) {
      closures.forEach((c: any) => {
        const periodInfo = c.period_type === 'QUARTERLY'
          ? `Q${c.period_quarter} ${c.period_year}`
          : `${c.period_year}`;
        
        const statusName = c.request_status?.request_status_name || 'PENDING';
        
        results.push({
          id: `closure-${c.closure_payment_request_id}`,
          request_code: c.request_code,
          type: 'CLOSURE',
          business_id: c.business_id,
          business_name: c.business?.business_name,
          status: statusName.toUpperCase().replace(/ /g, '_'),
          status_label: statusName,
          created_at: c.created_at,
          paid_on: c.paid_on,
          or_number: c.or_number,
          total_quote: c.total_quote,
          period_info: periodInfo,
        });
      });
    }

    // Sort all results by created_at (newest first)
    results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return results;
  } catch (error) {
    console.error('[businessRequestHistoryRepository] Error:', error);
    throw error;
  }
}
