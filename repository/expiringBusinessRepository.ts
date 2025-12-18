import { supabase } from "@/constants/supabase";
import { ExpiringBusiness } from "@/types/expiringBusinessType";

export class ExpiringBusinessRepository {
  async getExpiringBusinesses(ownerPersonId: number): Promise<ExpiringBusiness[]> {
    try {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1; // 0-indexed
      
      // Determine which year's clearances are expiring soon
      // If we're before Jan 20, check previous year's clearances
      // If we're after Jan 20, check current year's clearances
      let expiryYear: number;
      let renewalDeadline: Date;
      
      if (currentMonth === 1 && currentDate.getDate() <= 20) {
        // Between Jan 1-20: previous year's clearances need renewal
        expiryYear = currentYear - 1;
        renewalDeadline = new Date(currentYear, 0, 20); // Jan 20 of current year
      } else {
        // After Jan 20: current year's clearances will need renewal by next Jan 20
        expiryYear = currentYear;
        renewalDeadline = new Date(currentYear + 1, 0, 20); // Jan 20 of next year
      }

      // Get businesses owned by this person that have active clearances for the expiry year
      const { data, error } = await supabase
        .from('business')
        .select(`
          business_id,
          business_name,
          business_status!inner(business_status_name),
          business_clearance_status_record!inner(period_year, period_type, paid_on)
        `)
        .eq('business_owner_id', ownerPersonId)
        .eq('business_clearance_status_record.period_year', expiryYear)
        .eq('business_clearance_status_record.period_type', 'ANNUAL')
        .not('business_clearance_status_record.paid_on', 'is', null);

      if (error) {
        console.error('Error fetching expiring businesses:', error);
        throw new Error(error.message);
      }

      // Calculate days until deadline and urgency for each business
      const expiringBusinesses: ExpiringBusiness[] = (data || []).map((business: any) => {
        const daysUntilDeadline = Math.ceil((renewalDeadline.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
        
        let urgency: 'critical' | 'warning' | 'info';
        if (daysUntilDeadline < 0) {
          urgency = 'critical'; // Already past deadline
        } else if (daysUntilDeadline <= 30) {
          urgency = 'critical';
        } else if (daysUntilDeadline <= 60) {
          urgency = 'warning';
        } else {
          urgency = 'info';
        }

        return {
          business_id: business.business_id,
          business_name: business.business_name,
          business_status_name: business.business_status?.business_status_name || 'Unknown',
          expiry_year: expiryYear,
          renewal_deadline: renewalDeadline.toISOString().split('T')[0],
          days_until_deadline: daysUntilDeadline,
          urgency,
        };
      });

      // Sort by urgency (critical first) and then by days remaining
      return expiringBusinesses.sort((a, b) => {
        const urgencyOrder = { critical: 0, warning: 1, info: 2 };
        if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
          return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
        }
        return a.days_until_deadline - b.days_until_deadline;
      });
    } catch (error) {
      console.error('Error in getExpiringBusinesses:', error);
      throw error;
    }
  }
}
