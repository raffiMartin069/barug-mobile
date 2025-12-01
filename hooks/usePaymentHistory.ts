import { PaymentHistoryService } from "@/services/paymentHistoryService";
import { PaymentHistory } from "@/types/paymentHistoryType";
import { useState } from "react";

export const usePaymentHistory = () => {
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  async function fetchPaymentHistory(ownerPersonId: number, fromDate?: string, toDate?: string, reset = false) {
    if (!ownerPersonId) return;
    
    const currentPage = reset ? 0 : page;
    const isFirstLoad = currentPage === 0;
    
    if (isFirstLoad) setLoading(true);
    else setLoadingMore(true);
    
    try {
      const service = new PaymentHistoryService();
      const data = await service.fetchPaymentHistory(ownerPersonId, fromDate, toDate, PAGE_SIZE, currentPage * PAGE_SIZE);
      
      if (reset || isFirstLoad) {
        setPaymentHistory(data || []);
      } else {
        setPaymentHistory(prev => [...prev, ...(data || [])]);
      }
      
      setHasMore((data?.length || 0) === PAGE_SIZE);
      setPage(currentPage + 1);
    } catch (error) {
      console.error('Error fetching payment history:', error);
      if (reset || isFirstLoad) setPaymentHistory([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  const loadMore = (ownerPersonId: number, fromDate?: string, toDate?: string) => {
    if (!loadingMore && hasMore) {
      fetchPaymentHistory(ownerPersonId, fromDate, toDate, false);
    }
  };

  const refresh = (ownerPersonId: number, fromDate?: string, toDate?: string) => {
    setPage(0);
    setHasMore(true);
    fetchPaymentHistory(ownerPersonId, fromDate, toDate, true);
  };

  return {
    paymentHistory,
    loading,
    loadingMore,
    hasMore,
    fetchPaymentHistory,
    loadMore,
    refresh,
    setPaymentHistory
  };
};