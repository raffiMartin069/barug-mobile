import { supabase } from "@/constants/supabase";
import {
    RecentActivity
} from "@/types/recentActivityType";

export class RecentActivityRepository {
  async getRecentActivities(ownerPersonId: number, limit: number = 10): Promise<RecentActivity[]> {
    try {
      const activities: RecentActivity[] = [];

      // 1. Fetch Payment Records
      const { data: payments, error: paymentError } = await supabase
        .from('official_receipt')
        .select(`
          or_id,
          or_number,
          issued_at,
          amount_paid,
          doc_request_hdr!inner(
            business_id,
            business!inner(
              business_name,
              business_owner_id
            )
          )
        `)
        .eq('doc_request_hdr.business.business_owner_id', ownerPersonId)
        .order('issued_at', { ascending: false })
        .limit(limit);

      if (paymentError) {
        console.error('Error fetching payments:', paymentError);
      } else if (payments) {
        payments.forEach((payment: any) => {
          activities.push({
            activity_id: `PAY-${payment.or_id}`,
            activity_type: 'PAYMENT',
            business_id: payment.doc_request_hdr?.business_id,
            business_name: payment.doc_request_hdr?.business?.business_name || 'Unknown Business',
            title: `Payment: OR #${payment.or_number}`,
            description: `Clearance Fee`,
            timestamp: payment.issued_at,
            status: 'PAID',
            reference: payment.or_number,
            amount: payment.amount_paid,
            icon: {
              name: 'cash',
              color: '#4e6151',
              bgColor: '#dce5dc',
            },
            badge: {
              text: 'Paid',
              color: '#b3e5fc',
            },
          });
        });
      }

      // 2. Fetch Renewal Requests
      const { data: renewals, error: renewalError } = await supabase
        .from('renewal_request')
        .select(`
          renewal_request_id,
          request_code,
          business_id,
          period_year,
          request_status_id,
          created_at,
          paid_on,
          total_quote,
          business!inner(
            business_name,
            business_owner_id
          ),
          request_status!inner(
            request_status_name
          )
        `)
        .eq('business.business_owner_id', ownerPersonId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (renewalError) {
        console.error('Error fetching renewals:', renewalError);
      } else if (renewals) {
        renewals.forEach((renewal: any) => {
          const statusName = renewal.request_status?.request_status_name?.toLowerCase() || 'pending';
          let status: any = 'PROCESSING';
          let badgeColor = '#ffe082';
          let badgeText = 'Processing';

          if (renewal.paid_on) {
            status = 'PAID';
            badgeColor = '#c8e6c9';
            badgeText = 'Approved';
          } else if (statusName.includes('pending')) {
            status = 'PENDING';
            badgeColor = '#ffe082';
            badgeText = 'Pending';
          } else if (statusName.includes('reject')) {
            status = 'REJECTED';
            badgeColor = '#ffcdd2';
            badgeText = 'Rejected';
          }

          activities.push({
            activity_id: `REN-${renewal.renewal_request_id}`,
            activity_type: 'RENEWAL_REQUEST',
            business_id: renewal.business_id,
            business_name: renewal.business?.business_name || 'Unknown Business',
            title: 'Business Clearance Renewal',
            description: `Year: ${renewal.period_year}`,
            timestamp: renewal.created_at,
            status,
            reference: renewal.request_code,
            amount: renewal.total_quote,
            icon: {
              name: 'document-text',
              color: '#6b4c3b',
              bgColor: '#f2e5d7',
            },
            badge: {
              text: badgeText,
              color: badgeColor,
            },
          });
        });
      }

      // 3. Fetch Closure Requests
      const { data: closures, error: closureError } = await supabase
        .from('closure_payment_request')
        .select(`
          closure_payment_request_id,
          request_code,
          business_id,
          request_status_id,
          created_at,
          paid_on,
          total_quote,
          business!inner(
            business_name,
            business_owner_id
          ),
          request_status!inner(
            request_status_name
          )
        `)
        .eq('business.business_owner_id', ownerPersonId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (closureError) {
        console.error('Error fetching closures:', closureError);
      } else if (closures) {
        closures.forEach((closure: any) => {
          const statusName = closure.request_status?.request_status_name?.toLowerCase() || 'pending';
          let status: any = 'PROCESSING';
          let badgeColor = '#ffe082';
          let badgeText = 'Processing';

          if (closure.paid_on) {
            status = 'COMPLETED';
            badgeColor = '#c8e6c9';
            badgeText = 'Completed';
          } else if (statusName.includes('pending')) {
            status = 'PENDING';
            badgeColor = '#ffe082';
            badgeText = 'Pending';
          }

          activities.push({
            activity_id: `CLO-${closure.closure_payment_request_id}`,
            activity_type: 'CLOSURE_REQUEST',
            business_id: closure.business_id,
            business_name: closure.business?.business_name || 'Unknown Business',
            title: 'Business Closure Request',
            description: `Final payment required`,
            timestamp: closure.created_at,
            status,
            reference: closure.request_code,
            amount: closure.total_quote,
            icon: {
              name: 'close-circle',
              color: '#4a5c6a',
              bgColor: '#dfe3e6',
            },
            badge: {
              text: badgeText,
              color: badgeColor,
            },
          });
        });
      }

      // Sort all activities by timestamp (most recent first)
      activities.sort((a, b) => {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });

      // Return only the requested limit
      return activities.slice(0, limit);
    } catch (error) {
      console.error('Error in getRecentActivities:', error);
      throw error;
    }
  }
}
