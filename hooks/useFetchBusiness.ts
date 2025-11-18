import { BusinessService } from "@/services/businessService";
import { Business, BusinessDetails } from "@/types/businessType";
import { useState } from "react";

export const useFetchBusiness = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessDetails | null>(null);

  async function getBusinesses(service?: BusinessService, ownerId?: number) {
    if (ownerId === undefined) return;
    const svc = service ?? new BusinessService();
    const data = await svc.fetchByOwner(ownerId);
    if (data) setBusinesses(data);
    else setBusinesses([]);
  }

  async function getBusinessDetails(service?: BusinessService, businessId?: number | null) {
    if (!businessId) return null;
    if (selectedBusiness?.business_id === businessId) return selectedBusiness;
    const svc = service ?? new BusinessService();
    const details = await svc.fetchDetails(businessId);
    setSelectedBusiness(details);
    return details;
  }

  return {
    businesses,
    setBusinesses,           // optional
    getBusinesses,
    selectedBusiness,
    setSelectedBusiness,     // important for your list
    getBusinessDetails,      // useful for details screen
  };
};
