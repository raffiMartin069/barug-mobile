import { BusinessService } from "@/services/businessService";
import { QuoteBreakdown } from "@/types/businessType";
import { useState } from "react";

export const useBusinessQuote = () => {
  const [quote, setQuote] = useState<QuoteBreakdown | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  async function loadAutoQuote(businessId: number, year: number, service?: BusinessService) {
    setLoading(true);
    setError(null);
    try {
      const svc = service ?? new BusinessService();
      const res = await svc.fetchAutoQuote(businessId, year);
      setQuote(res);
      return res;
    } catch (e) {
      setError(e);
      setQuote(null);
      throw e;
    } finally {
      setLoading(false);
    }
  }

  function clear() {
    setQuote(null);
    setError(null);
  }

  return { quote, loading, error, loadAutoQuote, clear };
};
